/**
 * Test Hybrid Matching Implementation
 * Testing: Keyword Filter + Semantic Re-ranking
 */

const { hybridMatchLostWithFound, calculateSemanticSimilarity, getEmbedding } = require("./src/backend/aiService");

// Test data
const mockLostReport = {
  id: 1,
  name: "Timi",
  description: "charger laptop asus",
  category: "Elektronik",
};

const mockFoundItems = [
  {
    id: 101,
    name: "Kabel Casan Laptop",
    brand: "Asus",
    color: "Hitam",
    description: "Kabel casan laptop asus original",
    aiGeneratedDescription: "Kabel power untuk laptop dengan plug tipe barrel",
  },
  {
    id: 102,
    name: "Adaptor Laptop",
    brand: "Universal",
    color: "Putih",
    description: "Adaptor universal untuk laptop",
    aiGeneratedDescription: "Adaptor power universal compatible dengan berbagai laptop",
  },
  {
    id: 103,
    name: "Mouse Wireless",
    brand: "Logitech",
    color: "Hitam",
    description: "Mouse nirkabel untuk computer",
    aiGeneratedDescription: "Mouse wireless dengan battery AA",
  },
  {
    id: 104,
    name: "USB Cable",
    brand: "Generic",
    color: "Putih",
    description: "Kabel usb tipe c",
    aiGeneratedDescription: "USB type-C cable untuk charging",
  },
  {
    id: 105,
    name: "Laptop Stand",
    brand: "Wooden",
    color: "Coklat",
    description: "Stand kayu untuk laptop",
    aiGeneratedDescription: "Laptop stand minimalis dari kayu solid",
  },
];

async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 HYBRID MATCHING TEST SUITE");
  console.log("=".repeat(60));

  try {
    console.log("\n📋 Test Case 1: Basic Semantic Similarity");
    console.log("−".repeat(60));
    const sim1 = await calculateSemanticSimilarity("charger laptop asus", "kabel casan laptop asus");
    console.log(`Score: ${(sim1 * 100).toFixed(1)}%`);
    console.log(`Expected: 85-95% (should understand charger = casan)`);
    console.log(`Status: ${sim1 > 0.8 ? "✅ PASS" : "❌ FAIL"}`);

    console.log("\n📋 Test Case 2: Hybrid Matching on Mock Data");
    console.log("−".repeat(60));
    console.log(`Query: "${mockLostReport.description}"`);
    console.log(`Searching in ${mockFoundItems.length} items...`);

    const startTime = Date.now();
    const matches = await hybridMatchLostWithFound(mockLostReport, mockFoundItems);
    const endTime = Date.now();

    console.log(`\nResults (${endTime - startTime}ms):`);
    if (matches.length === 0) {
      console.log("❌ NO MATCHES FOUND");
    } else {
      matches.forEach((match, idx) => {
        const breakdown = match.matchBreakdown;
        console.log(`\n${idx + 1}. ${match.item.name}`);
        console.log(`   Score: ${breakdown.finalScore}% (Semantic: ${breakdown.semanticScore}%, Keyword: ${breakdown.jaccardScore}%)`);
        console.log(`   Rank after keyword filter: #${breakdown.stage1Rank}`);
      });
    }

    console.log(`\n✅ Test Case 2 Status: ${matches.length > 0 ? "PASS" : "FAIL"}`);

    console.log("\n📋 Test Case 3: Verify Top Result");
    console.log("−".repeat(60));
    if (matches.length > 0) {
      const topMatch = matches[0];
      console.log(`Top Match: ${topMatch.item.name}`);
      console.log(`Score: ${topMatch.matchBreakdown.finalScore}%`);
      console.log(`Expected: Kabel Casan Laptop (should be top due to semantic similarity)`);
      const isCorrect = topMatch.item.id === 101;
      console.log(`Status: ${isCorrect ? "✅ PASS" : "❌ FAIL"}`);
    }

    console.log("\n📋 Test Case 4: Embedding Model Initialization");
    console.log("−".repeat(60));
    const embedding = await getEmbedding("test text");
    console.log(`Embedding dimensions: ${embedding.length}`);
    console.log(`Expected: 384 (MiniLM model)`);
    console.log(`Status: ${embedding.length === 384 ? "✅ PASS" : "❌ FAIL"}`);

    console.log("\n" + "=".repeat(60));
    console.log("✨ TEST SUITE COMPLETED");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Test Error:", error);
  }

  // Exit after tests
  process.exit(0);
}

// Run tests
runTests();
