/**
 * Admin Authentication Routes
 * Handles login, registration, password reset
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../db");
const { authenticateToken } = require("../authMiddleware");
const { sendResetPasswordEmail } = require("../mailer");

const router = express.Router();

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * POST /api/admin/register
 * Register new admin account
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Semua field diperlukan" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password tidak sesuai" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    // Check if admin exists
    const existing = await prisma.admin.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    res.status(201).json({
      message: "Admin berhasil terdaftar",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mendaftar", error: err.message });
  }
});

/**
 * POST /api/admin/login
 * Login admin account
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password diperlukan" });
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login berhasil",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal login", error: err.message });
  }
});

/**
 * POST /api/admin/forgot-password
 * Send reset token to admin email
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email diperlukan" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return res.status(404).json({ message: "Email tidak terdaftar" });
    }

    const token = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpires: expiresAt,
      },
    });

    const emailResult = await sendResetPasswordEmail(admin.email, token);
    if (!emailResult.success) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          resetToken: null,
          resetTokenExpires: null,
        },
      });
      return res.status(500).json({ message: "Gagal mengirim email reset" });
    }

    return res.json({ message: "Kode reset telah dikirim" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memproses reset password", error: err.message });
  }
});

/**
 * POST /api/admin/reset-password
 * Reset admin password with token
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "Semua field diperlukan" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return res.status(404).json({ message: "Email tidak terdaftar" });
    }

    if (!admin.resetToken || !admin.resetTokenExpires) {
      return res.status(400).json({ message: "Token tidak valid atau sudah kadaluarsa" });
    }

    if (admin.resetTokenExpires < new Date()) {
      return res.status(400).json({ message: "Token tidak valid atau sudah kadaluarsa" });
    }

    const tokenHash = hashResetToken(token);
    if (tokenHash !== admin.resetToken) {
      return res.status(400).json({ message: "Token tidak valid atau sudah kadaluarsa" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return res.json({ message: "Password berhasil direset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mereset password", error: err.message });
  }
});

/**
 * GET /api/admin/profile
 * Get current admin profile (protected)
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil profil", error: err.message });
  }
});

/**
 * PUT /api/admin/profile
 * Update admin profile (protected)
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if email is already taken
    if (email && email !== req.user.email) {
      const existing = await prisma.admin.findUnique({
        where: { email },
      });
      if (existing) {
        return res.status(400).json({ message: "Email sudah digunakan" });
      }
    }

    const admin = await prisma.admin.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.json({
      message: "Profil berhasil diupdate",
      admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengupdate profil", error: err.message });
  }
});

/**
 * POST /api/admin/change-password
 * Change password (protected)
 */
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Semua field diperlukan" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Password tidak sesuai" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    // Get admin
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, admin.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password lama salah" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update
    await prisma.admin.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: "Password berhasil diubah" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengubah password", error: err.message });
  }
});

module.exports = router;
