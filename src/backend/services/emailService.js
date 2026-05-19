const nodemailer = require("nodemailer");

// Initialize transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: false,
  port: 587,
  timeout: 10000,
  tls: {
    rejectUnauthorized: false,
  },
});

// Email templates
const templates = {
  matchingNotification: (recipientName, reportName, itemName, itemBrand, score) => ({
    from: process.env.EMAIL_USER,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Ditemukan Kecocokan untuk Laporan Anda!</h2>
        
        <p>Halo <strong>${recipientName}</strong>,</p>
        
        <p>Sistem AI Findora telah menemukan barang yang mungkin merupakan barang yang Anda cari:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Barang Laporan:</strong> ${reportName}</p>
          <p><strong>Barang Ditemukan:</strong> ${itemName}</p>
          ${itemBrand ? `<p><strong>Brand:</strong> ${itemBrand}</p>` : ""}
          <p><strong>Tingkat Kecocokan:</strong> <span style="color: #10b981; font-weight: bold;">${(score * 100).toFixed(1)}%</span></p>
        </div>
        
        <p>Silakan login ke dashboard admin untuk melihat detail lengkap dan melakukan konfirmasi.</p>
        
        <p>Terima kasih,<br/><strong>Tim Findora</strong></p>
      </div>
    `,
  }),

  verificationAlert: (adminEmail, itemName, photo) => ({
    from: process.env.EMAIL_USER,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Barang Baru Memerlukan Verifikasi</h2>
        
        <p>Barang baru "<strong>${itemName}</strong>" telah ditambahkan dan menunggu verifikasi.</p>
        
        <p>Silakan login ke dashboard untuk melihat dan memverifikasi barang tersebut.</p>
        
        <p>Terima kasih,<br/><strong>Tim Findora</strong></p>
      </div>
    `,
  }),

  reportCreatedConfirmation: (reporterName, itemName, reportId) => ({
    from: process.env.EMAIL_USER,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Laporan Kehilangan Anda Telah Diterima</h2>
        
        <p>Halo <strong>${reporterName}</strong>,</p>
        
        <p>Terima kasih telah melaporkan kehilangan barang <strong>${itemName}</strong> ke Findora.</p>
        
        <p>Tim AI kami akan secara otomatis mencari kecocokan dengan barang-barang yang sudah dilaporkan dan ditemukan.</p>
        
        <p><strong>No. Laporan:</strong> ${reportId}</p>
        
        <p>Kami akan mengirimkan notifikasi jika ada kecocokan yang ditemukan.</p>
        
        <p>Terima kasih,<br/><strong>Tim Findora</strong></p>
      </div>
    `,
  }),
};

class EmailService {
  /**
   * Send matching notification email
   */
  static async sendMatchingNotification(recipientEmail, recipientName, reportName, foundItemName, itemBrand, score) {
    try {
      const mailOptions = {
        to: recipientEmail,
        subject: `✨ Kecocokan Ditemukan untuk Laporan: ${reportName}`,
        ...templates.matchingNotification(recipientName, reportName, foundItemName, itemBrand, score),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipientEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  /**
   * Send verification alert email to admin
   */
  static async sendVerificationAlert(adminEmail, itemName) {
    try {
      const mailOptions = {
        to: adminEmail,
        subject: `[Admin] Barang Baru Memerlukan Verifikasi: ${itemName}`,
        ...templates.verificationAlert(adminEmail, itemName),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Verification alert sent to ${adminEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending verification alert:", error);
      throw error;
    }
  }

  /**
   * Send report created confirmation
   */
  static async sendReportConfirmation(recipientEmail, reporterName, itemName, reportId) {
    try {
      const mailOptions = {
        to: recipientEmail,
        subject: "✓ Laporan Kehilangan Anda Telah Diterima",
        ...templates.reportCreatedConfirmation(reporterName, itemName, reportId),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Report confirmation sent to ${recipientEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending report confirmation:", error);
      throw error;
    }
  }

  /**
   * Send test email to verify configuration
   */
  static async sendTestEmail(recipientEmail) {
    try {
      const mailOptions = {
        to: recipientEmail,
        subject: "[Test] Findora Email Service",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Email Service Working!</h2>
            <p>Email configuration is working correctly.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Test email sent to ${recipientEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending test email:", error);
      throw error;
    }
  }

  /**
   * Get transporter for custom email sending
   */
  static getTransporter() {
    return transporter;
  }
}

module.exports = EmailService;
