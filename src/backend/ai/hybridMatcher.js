/**
 * Hybrid Matcher Module
 * Combines keyword filtering and semantic ranking for optimal matching
 *
 * Architecture:
 * Stage 1: Fast keyword filtering (Jaccard) - reduces 5000 items to ~50
 * Stage 2: Accurate semantic ranking (Transformers) - re-ranks for accuracy
 * Final: Combined score = (semantic * 0.8) + (keyword * 0.2)
 */

const semanticMatcher = require("./semanticMatcher");
const keywordMatcher = require("./keywordMatcher");

const STAGE1_THRESHOLD = 0.1; // Keyword similarity threshold for filtering
const STAGE2_COUNT = 100; // Limit candidates for Stage 2
const MIN_FINAL_SCORE = 0.3; // Minimum score for final results

/**
 * Run hybrid matching
 */
async function hybridMatch(lostReport, foundItems) {
  console.log(`\n🔍 HYBRID MATCHING: "${lostReport.description}"`);
  console.log(`   Searching in ${foundItems.length} items...`);

  // Combine all report text
  const reportText = [lostReport.name || "", lostReport.category || "", lostReport.description || ""].filter((f) => f).join(" ");

  // ============ STAGE 1: Keyword Filtering ============
  console.log("\n⚡ STAGE 1: Keyword Filtering");
  const candidates = keywordMatcher.filterByKeywords(reportText, foundItems, STAGE1_THRESHOLD);
  console.log(`   ✓ Filtered to ${candidates.length} candidates from ${foundItems.length} items`);

  if (candidates.length === 0) {
    console.log("   ✗ No candidates passed keyword filter");
    return [];
  }

  // Limit for Stage 2 performance
  const candidatesForStage2 = candidates.slice(0, STAGE2_COUNT);

  // ============ STAGE 2: Semantic Re-ranking ============
  console.log("\n🧠 STAGE 2: Semantic Re-ranking");
  const reranked = await semanticMatcher.rankCandidates(reportText, candidatesForStage2);
  console.log(`   ✓ Re-ranked ${reranked.length} candidates`);

  // ============ FINAL: Combine Scores & Filter ============
  const finalMatches = reranked
    .map((item, index) => {
      // Combined score: 80% semantic + 20% keyword
      const finalScore = item.semanticScore * 0.8 + (item.jaccardScore || 0) * 0.2;

      const breakdown = {
        method: "HybridMatching",
        semanticScore: (item.semanticScore * 100).toFixed(1),
        jaccardScore: ((item.jaccardScore || 0) * 100).toFixed(1),
        finalScore: (finalScore * 100).toFixed(1),
        stage1Rank: index + 1,
        matchedKeywords: item.matchedKeywords || [],
      };

      return {
        foundItemId: item.id,
        matchingScore: finalScore,
        matchBreakdown: breakdown,
        item,
        rank: index + 1,
      };
    })
    .filter((m) => m.matchingScore > MIN_FINAL_SCORE)
    .sort((a, b) => b.matchingScore - a.matchingScore);

  console.log(`   ✓ Final matches: ${finalMatches.length} items with score > ${MIN_FINAL_SCORE * 100}%\n`);

  return finalMatches;
}

module.exports = {
  hybridMatch,
};
