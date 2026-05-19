import { CheckCircle, Mail, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { LostReport } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lostReports: LostReport[];
  inboxSearch: string;
  onInboxSearchChange: (value: string) => void;
  onOpenEmail: (report: LostReport) => void;
  onOpenMatches: (report: LostReport) => void;
  onMarkDone: (id: number) => void;
  onMarkUndone: (id: number) => void;
  onDelete: (id: number) => void;
};

const InboxDialog = ({ open, onOpenChange, lostReports, inboxSearch, onInboxSearchChange, onOpenEmail, onOpenMatches, onMarkDone, onMarkUndone, onDelete }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[90vw] dark:bg-[#232526] dark:text-gray-100 flex flex-col" style={{ maxHeight: "90vh" }}>
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" /> Inbox Laporan Masuk
          </div>
        </DialogTitle>
        <DialogDescription>Daftar laporan barang hilang yang masuk ke sistem.</DialogDescription>
      </DialogHeader>
      <div className="mb-4">
        <Input placeholder="Cari nama, NIM, kategori, email, atau deskripsi..." className="w-full dark:bg-[#181c24] dark:text-gray-100" value={inboxSearch} onChange={(e) => onInboxSearchChange(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto px-2 min-w-0">
        {lostReports.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-300 py-8">Tidak ada laporan masuk.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-w-0">
            {lostReports
              .filter((report) => [report.name, report.nim, report.nonStudentId, report.category, report.email, report.phone, report.description].join(" ").toLowerCase().includes(inboxSearch.toLowerCase()))
              .map((report) => (
                <Card key={report.id} className="w-full min-w-0 shadow-lg border border-indigo-200 rounded-xl bg-white/90 dark:bg-[#232526] dark:text-gray-100 transition hover:scale-[1.02] flex flex-col h-full">
                  <CardHeader className="pb-2 border-b border-indigo-100 dark:border-gray-700">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <span className="text-indigo-700 dark:text-indigo-300">{report.name}</span>
                      <span className="text-xs text-gray-400">({report.reporterType === "Umum" ? report.nonStudentId : report.nim})</span>
                      <Badge className={report.status === "Selesai" ? "bg-green-500" : "bg-yellow-500"}>{report.status}</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 dark:text-gray-300">
                      <span className="font-semibold">{report.category}</span> &middot; {new Date(report.lostDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm mt-2">
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-300">Email:</span> {report.email}
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-300">No. HP:</span> {report.phone}
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-300">Deskripsi:</span>
                      <div className="text-gray-700 dark:text-gray-200">{report.description}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-300">Waktu Lapor:</span> {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 mt-auto">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 w-full" onClick={() => onOpenEmail(report)}>
                      <Mail className="w-4 h-4 mr-1" /> Kirim Email Manual
                    </Button>
                    <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-600" onClick={() => onOpenMatches(report)}>
                      <Sparkles className="w-4 h-4 mr-1" /> Lihat Match AI
                    </Button>
                    {report.status === "Selesai" ? (
                      <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-600" onClick={() => onMarkUndone(report.id)}>
                        Batalkan
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => onMarkDone(report.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Tandai Selesai
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-red-500 border-red-500" onClick={() => onDelete(report.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Hapus
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default InboxDialog;
