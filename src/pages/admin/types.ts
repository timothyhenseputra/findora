export type LostReport = {
  id: number;
  name: string;
  reporterType: string;
  nim?: string | null;
  nonStudentId?: string | null;
  email: string;
  phone: string;
  category: string;
  lostDate: string;
  description: string;
  status: string;
  createdAt: string;
};

export type FoundItem = {
  id: number;
  name: string;
  brand?: string;
  color?: string;
  category: string;
  locationFound: string;
  foundDate: string;
  description?: string;
  photoUrl?: string;
  status: string;
  claimedByName?: string | null;
  claimedAt?: string | null;
  returnedAt?: string | null;
  createdAt: string;
  matchings?: Array<{
    id: number;
    matchingScore: number;
    isConfirmed: boolean;
    matchedAt?: string;
    lostReportId: number;
    lostReport?: LostReport;
  }>;
};

export type MatchBreakdown = {
  // Legacy (Keyword-only matching)
  lostKeywords?: string[];
  foundKeywords?: string[];
  matchedKeywords?: string[];
  totalLost?: number;
  totalFound?: number;
  intersection?: number;
  foundCoverage?: string;
  lostCoverage?: string;
  finalScore?: string;

  // 🆕 Hybrid Matching
  method?: "JaccardSimilarity" | "HybridMatching";
  semanticScore?: string; // AI semantic similarity score
  jaccardScore?: string; // Keyword matching score
  stage1Rank?: number; // Ranking after keyword filtering
};

export type ReportMatch = {
  id: number;
  matchingScore: number;
  matchBreakdown?: string | null;
  isConfirmed: boolean;
  foundItemId: number;
  lostReportId: number;
  foundItem: FoundItem;
};
