/**
 * AI Module - Main Index
 * Exports all AI matching and analysis functions
 */

const { hybridMatch } = require("./hybridMatcher");
const { initModel: initEmbeddingModel, getEmbedding } = require("./semanticMatcher");
const { generateItemDescription, analyzeItemDetails } = require("./visionMatcher");

module.exports = {
  // Hybrid matching (main algorithm)
  hybridMatchLostWithFound: hybridMatch,

  // Semantic matching
  initEmbeddingModel,
  getEmbedding,

  // Vision/Image analysis
  generateItemDescription,
  analyzeItemDetails,
};
