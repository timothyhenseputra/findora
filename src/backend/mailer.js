const nodemailer = require("nodemailer");

// Konfigurasi transporter untuk Gmail

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email Anda
    pass: process.env.EMAIL_PASS, // App Password dari Google
  },
  // Options untuk better compatibility
  secure: false,
  port: 587,
  timeout: 10000,
  tls: {
    rejectUnauthorized: false, // Untuk development (aman untuk localhost)
  },
  logger: false,
});

// Test connection saat startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error.message);
  } else {
    console.log("✅ Email transporter ready");
  }
});

// Fungsi untuk send email reset password
async function sendResetPasswordEmail(toEmail, resetToken) {
  const mailOptions = {
    from: `"Findora System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 Reset Password - Findora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Reset Password</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Anda menerima email ini karena ada permintaan reset password untuk akun admin Findora Anda.
          </p>
          <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Kode Reset Password Anda:</p>
            <h2 style="margin: 10px 0 0 0; font-size: 32px; color: #667eea; letter-spacing: 5px; font-weight: bold;">${resetToken}</h2>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Masukkan kode di atas pada halaman reset password. Kode ini berlaku selama <strong>15 menit</strong>.
          </p>
          <p style="font-size: 14px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
            Jika Anda tidak meminta reset password, abaikan email ini.<br>
            © 2025 Findora - Sistem Pengelolaan Barang Hilang Kampus
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

// Fungsi untuk send email notifikasi barang ditemukan
async function sendItemFoundEmail(toEmail, userName, itemDetails) {
  const mailOptions = {
    from: `"Findora System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🎉 Barang Anda Ditemukan - Findora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Kabar Gembira!</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            <strong>Halo ${userName},</strong>
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Kami memiliki kabar baik untuk Anda! Barang yang Anda laporkan hilang telah <strong>ditemukan</strong> oleh petugas kami.
          </p>
          <div style="background-color: #f0f4ff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #667eea;">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">📦 Detail Barang:</h3>
            <table style="width: 100%; font-size: 14px; color: #333;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Nama Barang:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${itemDetails.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Kategori:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${itemDetails.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Lokasi Ditemukan:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${itemDetails.locationFound}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Lokasi Pengambilan:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${itemDetails.pickupLocation || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Deskripsi:</strong></td>
                <td style="padding: 8px 0;">${itemDetails.description || "-"}</td>
              </tr>
            </table>
          </div>
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>⚠️ Langkah Selanjutnya:</strong><br>
              Silakan hubungi petugas kampus atau datang ke bagian Lost & Found untuk mengambil barang Anda. 
              Jangan lupa bawa identitas diri untuk verifikasi.
            </p>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Terima kasih telah menggunakan layanan Findora.
          </p>
          <p style="font-size: 14px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
            © 2025 Findora - Sistem Pengelolaan Barang Hilang Kampus<br>
            Email ini dikirim otomatis, mohon tidak membalas.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendResetPasswordEmail, sendItemFoundEmail, sendMatchingNotificationEmail };

/**
 * Send email notifikasi AI matching ke pelapor
 */
async function sendMatchingNotificationEmail(toEmail, userName, foundItem, matchingScore) {
  const confidenceLevel = matchingScore > 0.8 ? "Sangat Tinggi" : matchingScore > 0.6 ? "Tinggi" : "Sedang";

  const mailOptions = {
    from: `"Findora System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `⚡ Kemungkinan Barang Anda Ditemukan! (${confidenceLevel}) - Findora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚡ Ada Berita Bagus!</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            <strong>Halo ${userName},</strong>
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Sistem AI kami telah menemukan kemungkinan barang yang Anda laporkan hilang. Silakan periksa detail di bawah ini!
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="margin: 0; color: #667eea;">🔍 Hasil Kecocokan AI</h3>
              <div style="background-color: ${matchingScore > 0.8 ? "#28a745" : matchingScore > 0.6 ? "#ffc107" : "#17a2b8"}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                ${(matchingScore * 100).toFixed(1)}% - ${confidenceLevel}
              </div>
            </div>
            <table style="width: 100%; font-size: 14px; color: #333;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Nama Barang:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${foundItem.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Kategori:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${foundItem.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Warna:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${foundItem.color || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Lokasi Ditemukan:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${foundItem.locationFound}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Deskripsi:</strong></td>
                <td style="padding: 8px 0;">${foundItem.description || "-"}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #2e7d32;">
              <strong>✅ Langkah Selanjutnya:</strong><br>
              Periksa detail barang di atas. Jika cocok dengan barang Anda, silakan hubungi petugas kampus untuk konfirmasi final.
              Semakin tinggi persentase kecocokan, semakin besar kemungkinan ini adalah barang Anda.
            </p>
          </div>

          <p style="font-size: 13px; color: #999; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
            ℹ️ Sistem kami menggunakan teknologi AI untuk mencocokkan deskripsi barang Anda dengan barang yang ditemukan.
            Meskipun akurat, verifikasi manual tetap diperlukan.
          </p>
          <p style="font-size: 13px; color: #999; margin: 10px 0 0 0;">
            © 2025 Findora - Sistem Pengelolaan Barang Hilang Kampus<br>
            Email ini dikirim otomatis, mohon tidak membalas.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending matching email:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendResetPasswordEmail, sendItemFoundEmail, sendMatchingNotificationEmail };
