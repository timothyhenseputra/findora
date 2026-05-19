import { CheckCircle, Image as ImageIcon, Mail, Sparkles, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FoundItem, LostReport } from "../types";

type MatchQueueItem = {
  id: number;
  matchingScore: number;
  foundItemId: number;
  foundItem: FoundItem;
  lostReport?: LostReport;
};

type Props = {
  matchQueueList: MatchQueueItem[];
  darkMode: boolean;
  inboxReports: LostReport[];
  selectedReportId: string;
  onSelectReport: (value: string) => void;
  onRunMatch: (reportId: number) => void;
  onOpenMatches: (report: LostReport) => void;
  onConfirm: (match: { id: number; foundItemId: number }) => void;
  onOpenEmail: (report: LostReport, item: FoundItem) => void;
  formatScore: (score: number) => string;
  scoreBadge: (score: number) => string;
};

const MatchingQueue = ({ matchQueueList, darkMode, inboxReports, selectedReportId, onSelectReport, onRunMatch, onOpenMatches, onConfirm, onOpenEmail, formatScore, scoreBadge }: Props) => (
  <div className={`rounded-xl p-6 mb-8 shadow ${darkMode ? "bg-[#181c24] text-gray-100" : "bg-white"}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> AI Matching Queue
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">Rekomendasi otomatis untuk mempercepat validasi kecocokan.</p>
      </div>
      <Badge className="bg-indigo-600 text-white">{matchQueueList.length} rekomendasi</Badge>
    </div>
    <div className="rounded-lg border border-indigo-100 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-900/10 p-4 mb-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Pilih laporan dari Inbox</div>
          <div className="text-xs text-gray-500 dark:text-gray-300">Admin bisa memilih laporan lalu jalankan AI matching untuk mencari barang yang cocok.</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedReportId} onValueChange={onSelectReport}>
            <SelectTrigger className="w-[260px] bg-white dark:bg-[#181c24]">
              <SelectValue placeholder="Pilih laporan hilang" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {inboxReports.length === 0 ? (
                <SelectItem value="empty" disabled>
                  Tidak ada laporan aktif
                </SelectItem>
              ) : (
                inboxReports.map((report) => (
                  <SelectItem key={report.id} value={String(report.id)}>
                    {report.name} • {report.category}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" disabled={!selectedReportId || selectedReportId === "empty"} onClick={() => onRunMatch(Number(selectedReportId))}>
            <Wand2 className="w-4 h-4 mr-1" /> Cari Match AI
          </Button>
        </div>
      </div>
    </div>
    {matchQueueList.length === 0 ? (
      <div className="text-center text-gray-500 dark:text-gray-300 py-6">Belum ada rekomendasi AI dengan skor tinggi.</div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {matchQueueList.slice(0, 6).map((match) => (
          <div key={match.id} className="border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 bg-indigo-50/40 dark:bg-indigo-900/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {match.foundItem.photoUrl ? (
                  <img src={match.foundItem.photoUrl} alt={match.foundItem.name} className="w-14 h-14 rounded object-cover border" />
                ) : (
                  <div className="w-14 h-14 rounded border flex items-center justify-center bg-white">
                    <ImageIcon className="text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{match.foundItem.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{match.foundItem.locationFound}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {match.lostReport?.name} &middot; {match.lostReport?.category}
                  </div>
                </div>
              </div>
              <Badge className={`${scoreBadge(match.matchingScore)} text-white`}>{formatScore(match.matchingScore)}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {match.lostReport && (
                <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-600" onClick={() => onOpenMatches(match.lostReport!)}>
                  Detail Match
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => onConfirm({ id: match.id, foundItemId: match.foundItemId })}>
                <CheckCircle className="w-4 h-4 mr-1" /> Konfirmasi
              </Button>
              {match.lostReport && (
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => onOpenEmail(match.lostReport!, match.foundItem)}>
                  <Mail className="w-4 h-4 mr-1" /> Kirim Email
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default MatchingQueue;
