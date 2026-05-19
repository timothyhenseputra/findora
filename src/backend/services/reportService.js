/**
 * Report Service
 * Handles all Lost Report operations: CRUD, status management, matching
 */

const prisma = require("../db");

class ReportService {
  static async reopenReport(reportId, targetStatus = "Diproses", additionalData = {}) {
    return prisma.$transaction(async (tx) => {
      const confirmedMatches = await tx.matching.findMany({
        where: {
          lostReportId: Number(reportId),
          isConfirmed: true,
        },
        select: {
          foundItemId: true,
        },
      });

      const report = await tx.lostReport.update({
        where: { id: Number(reportId) },
        data: {
          ...additionalData,
          status: targetStatus,
        },
      });

      if (confirmedMatches.length > 0) {
        const foundItemIds = confirmedMatches.map((m) => m.foundItemId);

        await tx.matching.updateMany({
          where: {
            lostReportId: Number(reportId),
            isConfirmed: true,
          },
          data: {
            isConfirmed: false,
          },
        });

        await tx.foundItem.updateMany({
          where: {
            id: { in: foundItemIds },
            status: "Diklaim",
          },
          data: {
            status: "Ditemukan",
            claimedByName: null,
            claimedAt: null,
            returnedAt: null,
          },
        });
      }

      return report;
    });
  }

  /**
   * Get all lost reports with matching info
   */
  static async getAllReports(includeMatchings = true) {
    const reports = await prisma.lostReport.findMany({
      ...(includeMatchings && {
        include: {
          matchings: {
            include: {
              foundItem: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  color: true,
                  category: true,
                  photoUrl: true,
                  status: true,
                },
              },
            },
          },
          notifications: true,
        },
      }),
      orderBy: { createdAt: "desc" },
    });
    return reports;
  }

  /**
   * Get report by ID
   */
  static async getReportById(id, includeMatchings = true) {
    const report = await prisma.lostReport.findUnique({
      where: { id: Number(id) },
      include: {
        ...(includeMatchings && {
          matchings: {
            include: {
              foundItem: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  color: true,
                  category: true,
                  photoUrl: true,
                  status: true,
                },
              },
            },
          },
        }),
        notifications: true,
      },
    });
    return report;
  }

  /**
   * Get matches for specific report
   */
  static async getReportMatches(reportId) {
    const matches = await prisma.matching.findMany({
      where: { lostReportId: Number(reportId) },
      include: {
        foundItem: {
          select: {
            id: true,
            name: true,
            brand: true,
            color: true,
            category: true,
            photoUrl: true,
            locationFound: true,
            foundDate: true,
            status: true,
          },
        },
      },
      orderBy: { matchingScore: "desc" },
    });
    return matches;
  }

  /**
   * Create new lost report
   */
  static async createReport({ name, reporterType, nim, nonStudentId, email, phone, category, description, lostDate }) {
    const report = await prisma.lostReport.create({
      data: {
        name,
        reporterType: reporterType || "Mahasiswa",
        nim: nim || null,
        nonStudentId: nonStudentId || null,
        email,
        phone,
        category,
        description,
        lostDate: new Date(lostDate),
        status: "Hilang",
      },
    });
    return report;
  }

  /**
   * Update lost report
   */
  static async updateReport(id, updateData) {
    const normalizedData = {
      ...updateData,
      lostDate: updateData.lostDate ? new Date(updateData.lostDate) : undefined,
    };

    if (normalizedData.status === "Diproses") {
      return this.reopenReport(Number(id), "Diproses", normalizedData);
    }

    const report = await prisma.lostReport.update({
      where: { id: Number(id) },
      data: {
        ...normalizedData,
      },
    });
    return report;
  }

  /**
   * Mark report as completed (Selesai)
   */
  static async markReportDone(id) {
    const report = await prisma.lostReport.update({
      where: { id: Number(id) },
      data: { status: "Selesai" },
    });
    return report;
  }

  /**
   * Mark report as active again (Hilang)
   */
  static async markReportUndone(id) {
    return this.reopenReport(Number(id), "Diproses");
  }

  /**
   * Delete lost report and related data
   */
  static async deleteReport(id) {
    // Delete matchings
    await prisma.matching.deleteMany({
      where: { lostReportId: Number(id) },
    });

    // Delete notifications
    await prisma.notification.deleteMany({
      where: { lostReportId: Number(id) },
    });

    // Delete report
    const report = await prisma.lostReport.delete({
      where: { id: Number(id) },
    });

    return report;
  }

  /**
   * Count reports by status
   */
  static async countByStatus(status = "Hilang") {
    const count = await prisma.lostReport.count({
      where: { status },
    });
    return count;
  }

  /**
   * Search reports
   */
  static async searchReports(query) {
    const reports = await prisma.lostReport.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nim: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return reports;
  }

  /**
   * Get recent reports (last N days)
   */
  static async getRecentReports(days = 7) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const reports = await prisma.lostReport.findMany({
      where: {
        createdAt: {
          gte: sinceDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return reports;
  }

  /**
   * Get reports with unresolved matching status
   */
  static async getUnresolvedReports() {
    const reports = await prisma.lostReport.findMany({
      where: {
        status: { in: ["Hilang", "Diproses"] },
      },
      include: {
        matchings: {
          where: { isConfirmed: false },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return reports;
  }
}

module.exports = ReportService;
