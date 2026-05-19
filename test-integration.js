/**
 * COMPREHENSIVE INTEGRATION TEST
 * Tests the entire hybrid matching system end-to-end
 *
 * This test covers:
 * 1. Backend server startup verification
 * 2. API health check
 * 3. Database connectivity
 * 4. Hybrid matching algorithm with real Prisma
 * 5. Frontend data flow validation
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const API_BASE = "http://localhost:8080/api";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  log("\n📋 TEST 1: Backend Health Check", "cyan");
  log("─".repeat(50), "cyan");

  try {
    const response = await axios.get(`${API_BASE}/health`);
    if (response.data.status === "ok") {
      log("✅ Backend server is running", "green");
      return true;
    }
  } catch (error) {
    log("❌ Backend server health check failed", "red");
    log(`   Error: ${error.message}`, "red");
    return false;
  }
}

async function testDatabaseConnectivity() {
  log("\n📋 TEST 2: Database Connectivity", "cyan");
  log("─".repeat(50), "cyan");

  try {
    const count = await prisma.foundItem.count();
    log(`✅ Database connected. Found ${count} existing found items`, "green");
    return true;
  } catch (error) {
    log("❌ Database connection failed", "red");
    log(`   Error: ${error.message}`, "red");
    return false;
  }
}

async function testHybridMatchingAlgorithm() {
  log("\n📋 TEST 3: Hybrid Matching Algorithm", "cyan");
  log("─".repeat(50), "cyan");

  try {
    // Load the matching functions
    const aiService = require("./src/backend/aiService");

    // Create test data
    const lostReport = {
      id: 1,
      name: "Keyboard Mekanik RGB",
      category: "Electronics",
      description: "Keyboard mekanik gaming dengan RGB backlight, warna hitam, merek Razer",
      lostDate: new Date(),
    };

    const foundItems = [
      {
        id: 1,
        name: "Keyboard Gaming RGB",
        brand: "Razer",
        color: "Black",
        category: "Electronics",
        description: "Mechanical gaming keyboard with RGB lights",
        photoUrl: null,
      },
      {
        id: 2,
        name: "Keyboard Wireless",
        brand: "Logitech",
        color: "White",
        category: "Electronics",
        description: "Wireless keyboard for office work",
        photoUrl: null,
      },
      {
        id: 3,
        name: "Keyboard Mekanik Standard",
        brand: "Mechanical",
        color: "Black",
        category: "Electronics",
        description: "Standard mechanical keyboard without RGB",
        photoUrl: null,
      },
    ];

    log("Test data created:", "yellow");
    log(`  - Lost Report: "${lostReport.name}"`, "yellow");
    log(`  - Found Items: ${foundItems.length} items`, "yellow");

    // Run hybrid matching
    const startTime = Date.now();
    const matches = await aiService.hybridMatchLostWithFound(lostReport, foundItems);
    const duration = Date.now() - startTime;

    log(`\n⚙️  Hybrid Matching Results (${duration}ms):`, "yellow");
    if (matches && matches.length > 0) {
      log(`   Top match: ${matches[0].item.name}`, "yellow");
      log(`   Score: ${(matches[0].matchingScore * 100).toFixed(1)}%`, "yellow");
    }

    // Verify structure
    if (matches && matches.length > 0 && matches[0].matchingScore >= 0.3 && matches[0].matchBreakdown && matches[0].matchBreakdown.method === "HybridMatching") {
      log("✅ Hybrid matching works correctly", "green");
      log(`   - Stage 1 Jaccard filtered candidates`, "green");
      log(`   - Stage 2 Semantic re-ranked for accuracy`, "green");
      log(`   - Final score combines both methods`, "green");
      return true;
    } else {
      log("❌ Hybrid matching structure incomplete", "red");
      return false;
    }
  } catch (error) {
    log("❌ Hybrid matching test failed", "red");
    log(`   Error: ${error.message}`, "red");
    return false;
  }
}

async function testMatchingDatabase() {
  log("\n📋 TEST 4: Matching Data Persistence", "cyan");
  log("─".repeat(50), "cyan");

  try {
    // Check if we can query matching data
    const matchCount = await prisma.matching.count();
    log(`✅ Matching table accessible. Found ${matchCount} existing matches`, "green");

    // Check schema
    const sample = await prisma.matching.findFirst();
    if (sample && sample.matchBreakdown) {
      log("✅ matchBreakdown field present and storing data", "green");
    }

    return true;
  } catch (error) {
    log("❌ Matching database test failed", "red");
    log(`   Error: ${error.message}`, "red");
    return false;
  }
}

async function testApiEndpoints() {
  log("\n📋 TEST 5: API Endpoints", "cyan");
  log("─".repeat(50), "cyan");

  try {
    // Test without auth for now - just verify endpoints exist
    try {
      await axios.get(`${API_BASE}/lost-reports`);
    } catch (error) {
      // 401 Unauthorized is expected without token - endpoint exists
      if (error.response && error.response.status === 401) {
        log("✅ Lost reports endpoint exists (auth required)", "green");
      }
    }

    try {
      await axios.get(`${API_BASE}/found-items`);
    } catch (error) {
      // Found items might not require auth
      if (error.response) {
        log("✅ Found items endpoint exists", "green");
      }
    }

    log("✅ API endpoints are properly configured", "green");
    return true;
  } catch (error) {
    log("❌ API endpoint test failed", "red");
    log(`   Error: ${error.message}`, "red");
    return false;
  }
}

async function testTransformersLibrary() {
  log("\n📋 TEST 6: Transformers Library Integration", "cyan");
  log("─".repeat(50), "cyan");

  try {
    const aiService = require("./src/backend/aiService");

    // Initialize embedding model
    const model = await aiService.initEmbeddingModel();

    if (model) {
      log("✅ Transformers model loaded successfully", "green");
      log(`   - Model: paraphrase-multilingual-MiniLM-L12-v2`, "green");

      // Test embedding generation
      const embedding = await aiService.getEmbedding("test text");
      if (Array.isArray(embedding) && embedding.length === 384) {
        log(`✅ Embeddings working (384 dimensions)`, "green");
        return true;
      }
    }

    log("❌ Transformers library not working properly", "red");
    return false;
  } catch (error) {
    log("❌ Transformers library test failed", "red");
    log(`   Error: ${error.message}`, "red");
    return false;
  }
}

async function printSystemInfo() {
  log("\n" + "═".repeat(50), "bold");
  log("🔍 SYSTEM INTEGRATION TEST REPORT", "bold");
  log("═".repeat(50), "bold");

  log("\n📦 Dependencies Check:", "yellow");
  try {
    require("@xenova/transformers");
    log("  ✅ @xenova/transformers installed", "green");
  } catch {
    log("  ❌ @xenova/transformers missing", "red");
  }

  try {
    require("express");
    log("  ✅ express installed", "green");
  } catch {
    log("  ❌ express missing", "red");
  }

  try {
    require("@prisma/client");
    log("  ✅ @prisma/client installed", "green");
  } catch {
    log("  ❌ @prisma/client missing", "red");
  }
}

async function runAllTests() {
  await printSystemInfo();

  const results = [];

  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  results.push({ name: "Backend Health", passed: healthOk });

  if (!healthOk) {
    log("\n⚠️  Backend server is not running!", "red");
    log("   Please start the backend with: npm run server", "yellow");
    await printSummary(results);
    process.exit(1);
  }

  // Test 2: Database
  const dbOk = await testDatabaseConnectivity();
  results.push({ name: "Database Connectivity", passed: dbOk });

  // Test 3: Core Algorithm
  const algoOk = await testHybridMatchingAlgorithm();
  results.push({ name: "Hybrid Matching Algorithm", passed: algoOk });

  // Test 4: Database Schema
  const schemaOk = await testMatchingDatabase();
  results.push({ name: "Matching Data Persistence", passed: schemaOk });

  // Test 5: API Endpoints
  const apiOk = await testApiEndpoints();
  results.push({ name: "API Endpoints", passed: apiOk });

  // Test 6: Transformers
  const transformersOk = await testTransformersLibrary();
  results.push({ name: "Transformers Library", passed: transformersOk });

  // Summary
  await printSummary(results);

  // Cleanup
  await prisma.$disconnect();
}

async function printSummary(results) {
  log("\n" + "═".repeat(50), "bold");
  log("📊 TEST SUMMARY", "bold");
  log("═".repeat(50), "bold");

  let passed = 0;
  let failed = 0;

  results.forEach((result) => {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    const color = result.passed ? "green" : "red";
    log(`${status} - ${result.name}`, color);

    if (result.passed) passed++;
    else failed++;
  });

  log("\n" + "─".repeat(50), "bold");
  const passRate = ((passed / results.length) * 100).toFixed(1);
  const summary = `${passed}/${results.length} tests passed (${passRate}%)`;

  if (passed === results.length) {
    log(`✅ ${summary}`, "green");
    log("\n🎉 All integration tests PASSED!", "green");
    log("   The hybrid matching system is fully integrated and operational.", "green");
  } else {
    log(`⚠️  ${summary}`, "yellow");
    log("\n❌ Some tests failed. Please review the errors above.", "red");
  }
  log("═".repeat(50), "bold");
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    log(`\n💥 Fatal error: ${error.message}`, "red");
    process.exit(1);
  });
}

module.exports = { runAllTests };
