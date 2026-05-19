const prisma = require("../db");
const { hybridMatchLostWithFound } = require("../aiService");
const EmailService = require("./emailService");

const MIN_NOTIFICATION_SCORE = 0.5; // Only notify on high confidence matches

class MatchingService {
  static getMatchableFoundItemsWhere() {
    return {
      NOT: {
        status: {
          in: ["Dikembalikan", "Diklaim"],
        },
      },
    };
  }

  static async autoMatchAll() {
    try {
      const lostReports = await prisma.lostReport.findMany({
        where: { status: { in: ["Hilang", "Diproses"] } },
      });

      const foundItems = await prisma.foundItem.findMany({
        where: this.getMatchableFoundItemsWhere(),
      });

      if (lostReports.length === 0 || foundItems.length === 0) {
        console.log("No active reports or items to match");
        return {
          created: 0,
          updated: 0,
          notified: 0,
        };
      }

      let createdCount = 0;
      let notifiedCount = 0;

      for (const report of lostReports) {
        // Run hybrid AI matching
        const matches = await hybridMatchLostWithFound(report, foundItems);

        for (const match of matches) {
          // Check/update existing match
          const existing = await prisma.matching.findFirst({
            where: {
              lostReportId: report.id,
              foundItemId: match.foundItemId,
            },
          });

          if (!existing) {
            // Create new match
            await prisma.matching.create({
              data: {
                lostReportId: report.id,
                foundItemId: match.foundItemId,
                matchingScore: match.matchingScore,
                matchBreakdown: JSON.stringify(match.matchBreakdown),
                isConfirmed: false,
              },
            });
            createdCount++;

            // Notify if high confidence
            if (match.matchingScore > MIN_NOTIFICATION_SCORE) {
              await this.notifyMatch(report, match);
              notifiedCount++;
            }
          }
        }
      }

      console.log(`Matching completed: ${createdCount} created, ${notifiedCount} notified`);
      return {
        created: createdCount,
        notified: notifiedCount,
      };
    } catch (error) {
      console.error("Error in autoMatchAll:", error);
      throw error;
    }
  }

  /**
   * Recompute matches for specific lost report
   */
  static async recomputeMatchesForReport(reportId) {
    try {
      const numericReportId = Number(reportId);
      const report = await prisma.lostReport.findUnique({
        where: { id: numericReportId },
      });

      if (!report) throw new Error("Report not found");

      const foundItems = await prisma.foundItem.findMany({
        where: this.getMatchableFoundItemsWhere(),
      });

      // Get AI matches
      const aiMatches = await hybridMatchLostWithFound(report, foundItems);

      // Delete old unconfirmed matches
      await prisma.matching.deleteMany({
        where: {
          lostReportId: numericReportId,
          isConfirmed: false,
        },
      });

      // Create new matches
      const newMatches = [];
      for (const match of aiMatches) {
        const alreadyConfirmed = await prisma.matching.findFirst({
          where: {
            lostReportId: numericReportId,
            foundItemId: match.foundItemId,
            isConfirmed: true,
          },
        });

        if (alreadyConfirmed) {
          continue;
        }

        const created = await prisma.matching.create({
          data: {
            lostReportId: numericReportId,
            foundItemId: match.foundItemId,
            matchingScore: match.matchingScore,
            matchBreakdown: JSON.stringify(match.matchBreakdown),
            isConfirmed: false,
          },
          include: {
            foundItem: {
              select: {
                id: true,
                name: true,
                brand: true,
                color: true,
                foundDate: true,
                createdAt: true,
                description: true,
              },
            },
          },
        });
        newMatches.push(created);
      }

      return newMatches;
    } catch (error) {
      console.error("Error recomputing matches:", error);
      throw error;
    }
  }

  /**
   * Get matches for a lost report
   */
  static async getMatchesForReport(reportId) {
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
            locationFound: true,
            foundDate: true,
            createdAt: true,
            description: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { matchingScore: "desc" },
    });
    return matches;
  }

  /**
   * Confirm a match (mark isConfirmed = true)
   */
  static async confirmMatch(matchId) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.matching.findUnique({
        where: { id: Number(matchId) },
      });

      if (!existing) {
        throw new Error("Match not found");
      }

      const match = await tx.matching.update({
        where: { id: Number(matchId) },
        data: { isConfirmed: true },
        include: {
          foundItem: true,
          lostReport: true,
        },
      });

      // A confirmed match means the item has been claimed.
      await tx.foundItem.update({
        where: { id: existing.foundItemId },
        data: {
          status: "Diklaim",
          claimedByName: match.lostReport?.name || null,
          claimedAt: new Date(),
          returnedAt: null,
        },
      });

      // Close the report after confirmed ownership.
      await tx.lostReport.update({
        where: { id: existing.lostReportId },
        data: { status: "Selesai" },
      });

      // Remove pending alternatives for this report and this item.
      await tx.matching.deleteMany({
        where: {
          id: { not: Number(matchId) },
          OR: [{ lostReportId: existing.lostReportId }, { foundItemId: existing.foundItemId }],
          isConfirmed: false,
        },
      });

      return match;
    });
  }

  /**
   * Reject a match (delete it)
   */
  static async rejectMatch(matchId) {
    const match = await prisma.matching.delete({
      where: { id: Number(matchId) },
    });
    return match;
  }

  /**
   * Get all unconfirmed matches
   */
  static async getPendingMatches() {
    const matches = await prisma.matching.findMany({
      where: { isConfirmed: false },
      include: {
        foundItem: {
          select: {
            id: true,
            name: true,
            brand: true,
            color: true,
            photoUrl: true,
          },
        },
        lostReport: {
          select: {
            id: true,
            name: true,
            nim: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ matchingScore: "desc" }, { matchedAt: "desc" }],
    });
    return matches;
  }

  /**
   * Notify about a match via email and database notification
   */
  static async notifyMatch(report, match) {
    try {
      // Create notification in database
      await prisma.notification.create({
        data: {
          foundItemId: match.foundItemId,
          lostReportId: report.id,
          message: `Ditemukan kecocokan: "${report.name}" kemungkinan adalah barang yang Anda cari (score: ${(match.matchingScore * 100).toFixed(1)}%)`,
          read: false,
        },
      });

      // Send email notification
      try {
        await EmailService.sendMatchingNotification(report.email, report.name, report.name, match.item.name, match.item.brand, match.matchingScore);
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr.message);
      }
    } catch (err) {
      console.error("Notify match error:", err);
    }
  }

  /**
   * Get matching statistics
   */
  static async getStatistics() {
    const stats = {
      totalMatches: await prisma.matching.count(),
      confirmedMatches: await prisma.matching.count({
        where: { isConfirmed: true },
      }),
      pendingMatches: await prisma.matching.count({
        where: { isConfirmed: false },
      }),
    };
    return stats;
  }
}

module.exports = MatchingService;
