require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const adminRoutes = require("./routes/admin");
const foundItemsRoutes = require("./routes/foundItems");
const lostReportsRoutes = require("./routes/lostReports");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api/found-items", foundItemsRoutes);
app.use("/api/lost-reports", lostReportsRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Server error",
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);

  // Initialize AI model on startup
  const { initEmbeddingModel } = require("./aiService");
  initEmbeddingModel()
    .then(() => console.log("✅ AI model loaded"))
    .catch((err) => console.error("⚠️  AI model initialization error:", err.message));
});
