/**
 * Item Service
 * Handles all Found Item operations: CRUD, verification, AI description
 */

const prisma = require("../db");
const cloudinary = require("../cloudinary");
const { generateItemDescription } = require("../aiService");

class ItemService {
  /**
   * Get all found items with matching information
   */
  static async getAllItems(includeMatchings = true) {
    const items = await prisma.foundItem.findMany({
      ...(includeMatchings && {
        include: {
          matchings: {
            include: {
              lostReport: {
                select: {
                  id: true,
                  name: true,
                  nim: true,
                  email: true,
                  phone: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      orderBy: { createdAt: "desc" },
    });
    return items;
  }

  /**
   * Get item by ID
   */
  static async getItemById(id) {
    const item = await prisma.foundItem.findUnique({
      where: { id: Number(id) },
      include: {
        matchings: {
          include: {
            lostReport: {
              select: {
                id: true,
                name: true,
                nim: true,
                email: true,
                phone: true,
                description: true,
              },
            },
          },
        },
      },
    });
    return item;
  }

  /**
   * Create new found item
   */
  static async createItem({ name, brand, color, category, locationFound, foundDate, description, photoUrl, status, claimedByName, adminId }) {
    const normalizedStatus = status || "Ditemukan";
    const normalizedClaimedByName = typeof claimedByName === "string" ? claimedByName.trim() : "";

    const item = await prisma.foundItem.create({
      data: {
        name,
        brand: brand || null,
        color: color || null,
        category,
        locationFound,
        foundDate: new Date(foundDate),
        description: description || "",
        photoUrl: photoUrl || null,
        status: normalizedStatus,
        claimedByName: normalizedStatus === "Diklaim" ? normalizedClaimedByName || null : null,
        claimedAt: normalizedStatus === "Diklaim" ? new Date() : null,
        returnedAt: normalizedStatus === "Dikembalikan" ? new Date() : null,
        admin: adminId ? { connect: { id: adminId } } : undefined,
      },
    });
    return item;
  }

  /**
   * Update found item
   */
  static async updateItem(id, updateData) {
    const existingItem = await prisma.foundItem.findUnique({
      where: { id: Number(id) },
      include: {
        matchings: {
          where: { isConfirmed: true },
          include: { lostReport: { select: { name: true } } },
          take: 1,
        },
      },
    });

    if (!existingItem) {
      throw new Error("Item not found");
    }

    const normalizedData = {
      ...updateData,
      foundDate: updateData.foundDate ? new Date(updateData.foundDate) : undefined,
    };

    if (typeof normalizedData.claimedByName === "string") {
      normalizedData.claimedByName = normalizedData.claimedByName.trim() || null;
    }

    if (normalizedData.status === "Ditemukan") {
      normalizedData.claimedByName = null;
      normalizedData.claimedAt = null;
      normalizedData.returnedAt = null;
    }

    if (normalizedData.status === "Diklaim") {
      const ownerFromConfirmedMatch = existingItem.matchings?.[0]?.lostReport?.name || null;

      if (!normalizedData.claimedByName) {
        normalizedData.claimedByName = ownerFromConfirmedMatch || existingItem.claimedByName || null;
      }

      if (!normalizedData.claimedByName) {
        throw new Error("Nama pengklaim wajib diisi untuk status Diklaim");
      }

      if (existingItem.status !== "Diklaim" || normalizedData.claimedByName !== existingItem.claimedByName) {
        normalizedData.claimedAt = new Date();
      }

      normalizedData.returnedAt = null;
    }

    if (normalizedData.status === "Dikembalikan") {
      normalizedData.returnedAt = new Date();
    }

    const item = await prisma.foundItem.update({
      where: { id: Number(id) },
      data: normalizedData,
    });
    return item;
  }

  /**
   * Delete found item and related matchings
   */
  static async deleteItem(id) {
    // Delete related matchings first (cascading)
    await prisma.matching.deleteMany({
      where: { foundItemId: Number(id) },
    });

    // Delete notifications
    await prisma.notification.deleteMany({
      where: { foundItemId: Number(id) },
    });

    // Delete the item
    const item = await prisma.foundItem.delete({
      where: { id: Number(id) },
    });

    return item;
  }

  /**
   * Upload photo and get Cloudinary URL
   */
  static async uploadPhoto(file) {
    if (!file) return null;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "findora",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Generate AI description for item
   */
  static async generateDescription(name, brand, color, photoUrl = null) {
    if (!name || !photoUrl) {
      throw new Error("Name and photo URL are required for description generation");
    }

    const description = await generateItemDescription(name, brand, color, photoUrl);
    return description;
  }

  /**
   * Count items by status
   */
  static async countByStatus(status = "Ditemukan") {
    const count = await prisma.foundItem.count({
      where: { status },
    });
    return count;
  }

  /**
   * Search items by name, brand, or category
   */
  static async searchItems(query) {
    const items = await prisma.foundItem.findMany({
      where: {
        OR: [{ name: { contains: query, mode: "insensitive" } }, { brand: { contains: query, mode: "insensitive" } }, { category: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
      },
      orderBy: { createdAt: "desc" },
    });
    return items;
  }
}

module.exports = ItemService;
