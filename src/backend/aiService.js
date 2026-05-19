/**
 * AI Service - Main Entry Point
 *
 * Refactored to use modular AI components for better code organization:
 * - ./ai/hybridMatcher.js - 2-stage matching (keyword + semantic)
 * - ./ai/semanticMatcher.js - Sentence Transformers embeddings
 * - ./ai/keywordMatcher.js - Fast Jaccard-based filtering
 * - ./ai/visionMatcher.js - Google Gemini vision analysis
 *
 * This file maintains backward compatibility while delegating to modular implementations.
 */

const { hybridMatchLostWithFound, initEmbeddingModel, getEmbedding, generateItemDescription, analyzeItemDetails } = require("./ai");

module.exports = {
  // Hybrid matching (main algorithm)
  hybridMatchLostWithFound,
  matchLostWithFound: hybridMatchLostWithFound, // Backward compat alias

  // Embedding & semantic matching
  initEmbeddingModel,
  getEmbedding,

  // Vision analysis
  generateItemDescription,
  generateItemDetails: analyzeItemDetails,
};
