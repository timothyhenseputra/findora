const express = require("express");
const ReportService = require("../services/reportService");
const MatchingService = require("../services/matchingService");
const EmailService = require("../services/emailService");
const { authenticateToken } = require("../authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const reports = await ReportService.getAllReports();
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil laporan", error: err.message });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const report = await ReportService.getReportById(Number(req.params.id));
    if (!report) return res.status(404).json({ message: "Laporan tidak ditemukan" });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil laporan", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, reporterType, nim, nonStudentId, email, phone, category, description, lostDate } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !category || !lostDate) {
      return res.status(400).json({ message: "Semua field diperlukan" });
    }

    const type = reporterType || "Mahasiswa";
    if (type === "Mahasiswa" && !nim) {
      return res.status(400).json({ message: "NIM diperlukan untuk mahasiswa" });
    }
    if (type === "Umum" && !nonStudentId) {
      return res.status(400).json({ message: "No. KTP/SIM diperlukan untuk non-mahasiswa" });
    }

    // Create report
    const report = await ReportService.createReport({
      name,
      reporterType: type,
      nim: type === "Mahasiswa" ? nim : null,
      nonStudentId: type === "Umum" ? nonStudentId : null,
      email,
      phone,
      category,
      description: description || "",
      lostDate,
    });

    // Send confirmation email
    try {
      await EmailService.sendReportConfirmation(email, name, name, report.id);
    } catch (emailErr) {
      console.error("Confirmation email failed:", emailErr.message);
    }

    // Auto-match with found items
    await MatchingService.autoMatchAll().catch((err) => console.error("Auto-matching failed:", err));

    res.status(201).json({ message: "Laporan berhasil dibuat", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat laporan", error: err.message });
  }
});

/**
 * PUT /api/lost-reports/:id
 * Update lost report
 */
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { name, reporterType, nim, nonStudentId, email, phone, category, description, lostDate, status } = req.body;

    const report = await ReportService.updateReport(Number(req.params.id), {
      name,
      reporterType,
      nim,
      nonStudentId,
      email,
      phone,
      category,
      description,
      lostDate,
      status,
    });

    res.json({ message: "Laporan berhasil diupdate", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengupdate laporan", error: err.message });
  }
});

/**
 * DELETE /api/lost-reports/:id
 * Delete lost report
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const report = await ReportService.deleteReport(Number(req.params.id));
    res.json({ message: "Laporan berhasil dihapus", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus laporan", error: err.message });
  }
});

/**
 * POST /api/lost-reports/:id/mark-done
 * Mark report as completed
 */
router.post("/:id/mark-done", authenticateToken, async (req, res) => {
  try {
    const report = await ReportService.markReportDone(Number(req.params.id));
    res.json({ message: "Laporan ditandai selesai", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengupdate status", error: err.message });
  }
});

/**
 * POST /api/lost-reports/:id/mark-undone
 * Mark report as active again
 */
router.post("/:id/mark-undone", authenticateToken, async (req, res) => {
  try {
    const report = await ReportService.markReportUndone(Number(req.params.id));
    res.json({ message: "Laporan ditandai aktif kembali", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengupdate status", error: err.message });
  }
});

// ============ MATCHING ROUTES ============

/**
 * POST /api/lost-reports/send-notification
 * Send email notification to reporter about found item
 */
router.post("/send-notification", authenticateToken, async (req, res) => {
  try {
    const { email, userName, itemDetails } = req.body;

    if (!email || !itemDetails) {
      return res.status(400).json({ message: "Email dan detail barang diperlukan" });
    }

    const transporter = EmailService.getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `✨ Barang Anda Kemungkinan Ditemukan - ${itemDetails.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Kabar Baik! Barang Anda Kemungkinan Ditemukan</h2>
          
          <p>Halo <strong>${userName || "Pelapor"}</strong>,</p>
          
          <p>Kami ingin memberitahukan bahwa barang yang mungkin cocok dengan laporan kehilangan Anda telah ditemukan:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nama Barang:</strong> ${itemDetails.name}</p>
            ${itemDetails.category ? `<p><strong>Kategori:</strong> ${itemDetails.category}</p>` : ""}
            <p><strong>Lokasi Ditemukan:</strong> ${itemDetails.locationFound}</p>
            <p><strong>Lokasi Pengambilan:</strong> ${itemDetails.pickupLocation}</p>
            ${itemDetails.description && itemDetails.description !== "-" ? `<p><strong>Deskripsi:</strong> ${itemDetails.description}</p>` : ""}
          </div>
          
          <p>Silakan datang ke lokasi pengambilan untuk mengklaim barang Anda.</p>
          
          <p>Terima kasih,<br/><strong>Tim Findora</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Notification sent to ${email}:`, info.messageId);

    res.json({ message: "Email notifikasi berhasil dikirim", messageId: info.messageId });
  } catch (err) {
    console.error("Send notification error:", err);
    res.status(500).json({ message: "Gagal mengirim email notifikasi", error: err.message });
  }
});

/**
 * GET /api/lost-reports/:id/matches
 * Get matches for specific report
 */
router.get("/:id/matches", authenticateToken, async (req, res) => {
  try {
    const matches = await MatchingService.getMatchesForReport(Number(req.params.id));
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil kecocokan", error: err.message });
  }
});

/**
 * POST /api/lost-reports/:id/recompute-matches
 * Recompute matches using AI
 */
router.post("/:id/recompute-matches", authenticateToken, async (req, res) => {
  try {
    const matches = await MatchingService.recomputeMatchesForReport(Number(req.params.id));
    res.json({ message: "Kecocokan berhasil diperhitungkan ulang", matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperhitungkan ulang kecocokan", error: err.message });
  }
});

/**
 * POST /api/lost-reports/matches/:matchId/confirm
 * Confirm a match
 */
router.post("/matches/:matchId/confirm", authenticateToken, async (req, res) => {
  try {
    const match = await MatchingService.confirmMatch(Number(req.params.matchId));
    res.json({ message: "Kecocokan dikonfirmasi", match });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengkonfirmasi kecocokan", error: err.message });
  }
});

/**
 * DELETE /api/lost-reports/matches/:matchId
 * Reject a match
 */
router.delete("/matches/:matchId", authenticateToken, async (req, res) => {
  try {
    const match = await MatchingService.rejectMatch(Number(req.params.matchId));
    res.json({ message: "Kecocokan ditolak", match });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menolak kecocokan", error: err.message });
  }
});

/**
 * GET /api/lost-reports/matches/pending
 * Get all pending matches
 */
router.get("/matches/pending", authenticateToken, async (req, res) => {
  try {
    const matches = await MatchingService.getPendingMatches();
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil kecocokan pending", error: err.message });
  }
});

module.exports = router;
