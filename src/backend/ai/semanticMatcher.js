/**
 * Semantic Matcher Module
 * Handles AI-powered semantic text similarity using Sentence Transformers
 */

const { pipeline } = require("@xenova/transformers");

let embeddingModel = null;

/**
 * Initialize the embedding model (runs once on startup)
 */
async function initModel() {
  if (embeddingModel) return embeddingModel;

  try {
    console.log("🔄 Loading Sentence Transformers model...");
    embeddingModel = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
    console.log("✅ Model loaded successfully");
    return embeddingModel;
  } catch (error) {
    console.error("❌ Error loading model:", error.message);
    throw error;
  }
}

/**
 * Get embedding for text
 */
async function getEmbedding(text) {
  const model = await initModel();
  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error("Vector dimensions must match");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1 * norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Calculate semantic similarity between report and item
 */
async function calculateSimilarity(reportText, itemText) {
  const [reportEmbedding, itemEmbedding] = await Promise.all([getEmbedding(reportText), getEmbedding(itemText)]);

  const similarity = cosineSimilarity(reportEmbedding, itemEmbedding);
  return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
}

/**
 * Rank candidates by semantic similarity
 */
async function rankCandidates(reportText, candidates) {
  const ranked = await Promise.all(
    candidates.map(async (candidate) => {
      const candidateText = [candidate.name || "", candidate.brand || "", candidate.color || "", candidate.category || "", candidate.description || ""].filter((f) => f).join(" ");

      return {
        ...candidate,
        semanticScore: await calculateSimilarity(reportText, candidateText),
      };
    }),
  );

  return ranked.sort((a, b) => b.semanticScore - a.semanticScore);
}

module.exports = {
  initModel,
  getEmbedding,
  calculateSimilarity,
  rankCandidates,
  cosineSimilarity,
};
