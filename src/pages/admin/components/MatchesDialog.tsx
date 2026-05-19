import { CheckCircle, Image as ImageIcon, Info, Mail, RefreshCcw, Sparkles, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LostReport, MatchBreakdown, ReportMatch } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchesLoading: boolean;
  reportMatches: ReportMatch[];
  selectedReport: LostReport | null;
  onOpenEmail: (report: LostReport, item: ReportMatch["foundItem"]) => void;
  onConfirm: (match: ReportMatch) => void;
  onReject: (match: ReportMatch) => void;
  onRecompute: () => void;
  formatScore: (score: number) => string;
  scoreBadge: (score: number) => string;
};

const MatchesDialog = ({ open, onOpenChange, matchesLoading, reportMatches, selectedReport, onOpenEmail, onConfirm, onReject, onRecompute, formatScore, scoreBadge }: Props) => {
  const parseBreakdown = (breakdownString: string | null | undefined): MatchBreakdown | null => {
    if (!breakdownString) return null;
    try {
      return JSON.parse(breakdownString);
    } catch {
      return null;
    }
  };

  const formatFoundDate = (value?: string, fallback?: string) => {
    const rawValue = value || fallback;
    if (!rawValue) return "Tanggal tidak tersedia";
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return "Tanggal tidak tersedia";
    return parsed.toLocaleDateString("id-ID");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl dark:bg-[#232526] dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Matching
            </div>
          </DialogTitle>
          <DialogDescription>{selectedReport ? `Rekomendasi AI untuk laporan ${selectedReport.name} (${selectedReport.category})` : "Rekomendasi AI untuk laporan"}</DialogDescription>
          {selectedReport && (
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
              <span>Recompute untuk mencari kecocokan terbaru.</span>
              <Button size="sm" variant="outline" onClick={onRecompute} disabled={matchesLoading} className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/30">
                <RefreshCcw className="w-4 h-4 mr-1" /> Recompute
              </Button>
            </div>
          )}
        </DialogHeader>
        {matchesLoading ? (
          <div className="text-center py-10 text-indigo-600">Memuat rekomendasi...</div>
        ) : reportMatches.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-300">Belum ada match yang direkomendasikan.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {reportMatches.map((match) => {
              const breakdown = parseBreakdown(match.matchBreakdown);

              return (
                <Card key={match.id} className="border border-indigo-200 dark:border-indigo-800 bg-white/90 dark:bg-[#1f2430]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-indigo-700 dark:text-indigo-300">{match.foundItem.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge className={`${scoreBadge(match.matchingScore)} text-white`}>{formatScore(match.matchingScore)}</Badge>
                        {breakdown && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Info className="w-4 h-4 text-indigo-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 dark:bg-[#1f2430] dark:border-indigo-800">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-sm text-indigo-700 dark:text-indigo-300 mb-2">📊 Penjelasan Score {breakdown.finalScore || breakdown.semanticScore}%</h4>

                                  {/* Hybrid Matching Explanation */}
                                  {breakdown.method === "HybridMatching" && (
                                    <div className="space-y-3 text-xs">
                                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded border border-indigo-200 dark:border-indigo-700">
                                        <div className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">🚀 HYBRID MATCHING (2-Stage Pipeline)</div>
                                        <div className="space-y-2 text-gray-700 dark:text-gray-200">
                                          <div>
                                            <span className="font-medium">Stage 1 - Keyword Filtering:</span>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                                              Jaccard Score: <span className="font-bold">{breakdown.jaccardScore}%</span>
                                            </div>
                                          </div>
                                          <div>
                                            <span className="font-medium">Stage 2 - Semantic Re-ranking:</span>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                                              AI Semantic Score: <span className="font-bold">{breakdown.semanticScore}%</span>
                                            </div>
                                          </div>
                                          <div className="border-t border-indigo-200 dark:border-indigo-700 pt-2 font-bold text-indigo-600 dark:text-indigo-300">Final Score = Semantic × 0.8 + Keyword × 0.2 = {breakdown.finalScore}%</div>
                                        </div>
                                      </div>

                                      {/* Explanation */}
                                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-700">
                                        <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">💡 Cara Kerja</div>
                                        <div className="space-y-2 text-gray-700 dark:text-gray-200">
                                          <div>
                                            <div className="text-xs font-medium">1. Keyword Filtering (Cepat)</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 ml-2">Cari barang dengan kata kunci mirip → Rank: #{breakdown.stage1Rank}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs font-medium">2. Semantic Re-ranking (Pintar)</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 ml-2">AI paham makna → "charger" = "casan" = "adaptor"</div>
                                          </div>
                                          <div>
                                            <div className="text-xs font-medium">3. Final Score</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 ml-2">Kombinasi kedua score untuk ranking akurat</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Legacy Keyword-Only Matching */}
                                  {breakdown.method === "JaccardSimilarity" && (
                                    <div className="space-y-3 text-xs">
                                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-700">
                                        <div className="font-semibold text-amber-700 dark:text-amber-300 mb-2">🔑 KEYWORD-BASED MATCHING</div>
                                        <div className="space-y-2 text-gray-700 dark:text-gray-200">
                                          <div>
                                            <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Kata Kunci Laporan:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {breakdown.lostKeywords?.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                  {kw}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>

                                          <div>
                                            <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Kata Kunci Barang:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {breakdown.foundKeywords?.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                  {kw}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>

                                          <div>
                                            <div className="font-medium text-green-600 dark:text-green-400 mb-1">Kata yang Cocok:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {breakdown.matchedKeywords?.map((kw, i) => (
                                                <Badge key={i} className="text-xs bg-green-600 text-white">
                                                  {kw}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="border-t pt-2 mt-2">
                                            <div>
                                              Coverage Barang: <span className="font-semibold">{breakdown.foundCoverage}%</span>
                                            </div>
                                            <div>
                                              Coverage Laporan: <span className="font-semibold">{breakdown.lostCoverage}%</span>
                                            </div>
                                            <div className="mt-1 font-semibold text-indigo-600 dark:text-indigo-300">Score = {breakdown.finalScore}%</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-xs text-gray-500 dark:text-gray-300">
                      {match.foundItem.category} &middot; {formatFoundDate(match.foundItem.foundDate, match.foundItem.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      {match.foundItem.photoUrl ? (
                        <img src={match.foundItem.photoUrl} alt={match.foundItem.name} className="w-16 h-16 object-cover rounded border" />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border">
                          <ImageIcon className="text-gray-400" />
                        </div>
                      )}
                      <div className="text-gray-700 dark:text-gray-200">
                        <div className="font-medium">{match.foundItem.locationFound}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">{match.foundItem.color || "Warna tidak diisi"}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">{match.foundItem.description || "-"}</div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => selectedReport && onOpenEmail(selectedReport, match.foundItem)}>
                      <Mail className="w-4 h-4 mr-1" /> Kirim Email
                    </Button>
                    <div className="flex gap-2 w-full">
                      <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-600" onClick={() => onConfirm(match)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Konfirmasi
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-red-500 border-red-500" onClick={() => onReject(match)}>
                        <XCircle className="w-4 h-4 mr-1" /> Tolak
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchesDialog;
