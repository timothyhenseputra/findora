/**
 * Keyword Matcher Module
 * Handles fast keyword-based filtering using Jaccard similarity
 */

/**
 * Extract keywords from text
 */
const CANONICAL_KEYWORDS = {
  charger: "charger",
  casan: "charger",
  cas: "charger",
  adaptor: "charger",
  adapter: "charger",
  adaptop: "charger",
  adptor: "charger",
};

function normalizeKeyword(word) {
  return CANONICAL_KEYWORDS[word] || word;
}

function extractKeywords(text) {
  // Convert to lowercase, remove special chars, split by spaces
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .map((word) => normalizeKeyword(word))
      .filter((word) => word.length > 2), // Filter short words
  );
}

/**
 * Calculate Jaccard similarity between two keyword sets
 */
function calculateJaccardSimilarity(set1, set2) {
  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Filter candidates by keyword similarity (fast stage 1)
 */
function filterByKeywords(reportText, candidates, threshold = 0.1) {
  const reportKeywords = extractKeywords(reportText);

  const filtered = candidates
    .map((candidate) => {
      const itemText = [candidate.name || "", candidate.brand || "", candidate.color || "", candidate.category || "", candidate.description || ""].filter((f) => f).join(" ");

      const itemKeywords = extractKeywords(itemText);
      const similarity = calculateJaccardSimilarity(reportKeywords, itemKeywords);
      const matchedKeywords = [...reportKeywords].filter((k) => itemKeywords.has(k));

      return {
        ...candidate,
        jaccardScore: similarity,
        matchedKeywords,
      };
    })
    .filter((c) => c.jaccardScore >= threshold)
    .sort((a, b) => b.jaccardScore - a.jaccardScore);

  return filtered;
}

/**
 * Get relevant keywords for display
 */
function getMatchedKeywords(text, maxKeywords = 10) {
  const keywords = extractKeywords(text);
  return Array.from(keywords).slice(0, maxKeywords);
}

module.exports = {
  extractKeywords,
  calculateJaccardSimilarity,
  filterByKeywords,
  getMatchedKeywords,
};
