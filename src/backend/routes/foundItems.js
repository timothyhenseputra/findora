const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const ItemService = require("../services/itemService");
const MatchingService = require("../services/matchingService");
const { authenticateToken } = require("../authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", async (req, res) => {
  try {
    // Include matching details only for authenticated admin requests.
    let includeMatchings = false;
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        includeMatchings = true;
      } catch {
        includeMatchings = false;
      }
    }

    const items = await ItemService.getAllItems(includeMatchings);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await ItemService.getItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Barang tidak ditemukan" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil detail", error: err.message });
  }
});

/**
 * GET /api/found-items/search?q=...
 * Search items
 */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Query harus minimal 2 karakter" });
    }
    const items = await ItemService.searchItems(q);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mencari barang", error: err.message });
  }
});

router.post("/generate-description", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    let photoUrl = req.body.photoUrl;

    // Upload photo to Cloudinary if file provided
    if (req.file) {
      photoUrl = await ItemService.uploadPhoto(req.file);
    }

    if (!photoUrl) {
      return res.status(400).json({ message: "Foto diperlukan untuk generate deskripsi AI" });
    }

    // Use Gemini to analyze the photo
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Kamu adalah sistem Lost & Found kampus. Analisis foto barang temuan ini.

Berikan respons dalam format JSON VALID (tanpa markdown, tanpa backtick):
{
  "aiName": "nama barang (singkat, 2-4 kata)",
  "aiCategory": "pilih salah satu: Elektronik, Dokumen, Pakaian, Aksesoris, Tas, Alat Tulis, Kunci, Lainnya",
  "aiColor": "warna dominan barang",
  "aiGeneratedDescription": "deskripsi detail barang dalam 2-3 kalimat bahasa Indonesia, mencakup kondisi, ciri khas, dan detail identifikasi"
}

PENTING: Hanya output JSON, tanpa penjelasan tambahan.`;

    const imageResponse = await fetch(photoUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    const response = await model.generateContent([{ inlineData: { data: base64Image, mimeType: "image/jpeg" } }, prompt]);

    let text = response.response.text().trim();
    // Strip markdown code fences if present
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        aiName: "",
        aiCategory: "",
        aiColor: "",
        aiGeneratedDescription: text,
      };
    }

    res.json({
      photoUrl,
      aiName: parsed.aiName || "",
      aiCategory: parsed.aiCategory || "",
      aiColor: parsed.aiColor || "",
      aiGeneratedDescription: parsed.aiGeneratedDescription || text,
    });
  } catch (err) {
    console.error("AI generate-description error:", err);
    res.status(500).json({ message: "Gagal generate deskripsi AI", error: err.message });
  }
});

/**
 * POST /api/found-items
 * Create new found item with photo upload and AI description
 */
router.post("/", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { name, brand, color, category, locationFound, foundDate, description, photoUrl, status, claimedByName } = req.body;

    // Validate required fields
    if (!name || !category || !locationFound) {
      return res.status(400).json({ message: "Nama, kategori, dan lokasi diperlukan" });
    }

    // Upload photo if provided
    let finalPhotoUrl = photoUrl;
    if (req.file) {
      finalPhotoUrl = await ItemService.uploadPhoto(req.file);
    }

    // Create item
    const item = await ItemService.createItem({
      name,
      brand: brand || null,
      color: color || null,
      category,
      locationFound,
      foundDate: foundDate || new Date(),
      description,
      photoUrl: finalPhotoUrl,
      status,
      claimedByName,
      adminId: req.user.id,
    });

    // Auto-match with lost reports
    await MatchingService.autoMatchAll().catch((err) => console.error("Auto-matching failed:", err));

    res.status(201).json({ message: "Barang berhasil ditambahkan", item });
  } catch (err) {
    console.error(err);
    if (err.message?.includes("wajib diisi")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Gagal menambahkan barang", error: err.message });
  }
});

/**
 * PUT /api/found-items/:id
 * Update found item (supports multipart for photo update)
 */
router.put("/:id", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { name, brand, color, category, locationFound, foundDate, description, status, photoUrl, claimedByName } = req.body;

    // Upload new photo if provided
    let finalPhotoUrl = photoUrl || undefined;
    if (req.file) {
      finalPhotoUrl = await ItemService.uploadPhoto(req.file);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand || null;
    if (color !== undefined) updateData.color = color || null;
    if (category !== undefined) updateData.category = category;
    if (locationFound !== undefined) updateData.locationFound = locationFound;
    if (foundDate !== undefined) updateData.foundDate = foundDate;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (claimedByName !== undefined) updateData.claimedByName = claimedByName;
    if (finalPhotoUrl !== undefined) updateData.photoUrl = finalPhotoUrl;

    const item = await ItemService.updateItem(Number(req.params.id), updateData);

    res.json({ message: "Barang berhasil diupdate", item });
  } catch (err) {
    console.error(err);
    if (err.message?.includes("wajib diisi")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Gagal mengupdate barang", error: err.message });
  }
});

/**
 * DELETE /api/found-items/:id
 * Delete found item
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const item = await ItemService.deleteItem(Number(req.params.id));
    res.json({ message: "Barang berhasil dihapus", item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus barang", error: err.message });
  }
});

/**
 * POST /api/found-items/:id/generate-description
 * Generate AI description for item
 */
router.post("/:id/generate-description", authenticateToken, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    const item = await ItemService.getItemById(Number(req.params.id));

    if (!item) return res.status(404).json({ message: "Barang tidak ditemukan" });

    const description = await ItemService.generateDescription(item.name, item.brand, item.color, photoUrl || item.photoUrl);

    const updated = await ItemService.updateItem(Number(req.params.id), {
      aiGeneratedDescription: description,
    });

    res.json({ message: "Deskripsi AI berhasil dibuat", item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat deskripsi AI", error: err.message });
  }
});

module.exports = router;
