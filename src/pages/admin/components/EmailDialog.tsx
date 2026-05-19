import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LostReport } from "../types";

export type EmailDraft = {
  report: LostReport | null;
  itemName: string;
  itemLocation: string;
  pickupLocation: string;
  itemDescription: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: EmailDraft;
  onDraftChange: (draft: EmailDraft) => void;
  onSend: () => void;
};

const EmailDialog = ({ open, onOpenChange, draft, onDraftChange, onSend }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg dark:bg-[#232526] dark:text-gray-100">
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" /> Kirim Notifikasi Email
          </div>
        </DialogTitle>
        <DialogDescription>Siapkan detail barang yang cocok lalu kirim ke pelapor.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 p-3 bg-indigo-50/60 dark:bg-indigo-900/20">
          <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-200">Penerima</div>
          <div className="text-sm text-gray-700 dark:text-gray-200">{draft.report ? `${draft.report.name} (${draft.report.email})` : "-"}</div>
        </div>
        <Input placeholder="Nama barang yang ditemukan" value={draft.itemName} onChange={(e) => onDraftChange({ ...draft, itemName: e.target.value })} />
        <Input placeholder="Lokasi ditemukan" value={draft.itemLocation} onChange={(e) => onDraftChange({ ...draft, itemLocation: e.target.value })} />
        <Input placeholder="Lokasi pengambilan barang" value={draft.pickupLocation} onChange={(e) => onDraftChange({ ...draft, pickupLocation: e.target.value })} />
        <Textarea placeholder="Deskripsi singkat barang" value={draft.itemDescription} onChange={(e) => onDraftChange({ ...draft, itemDescription: e.target.value })} rows={4} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Batal
        </Button>
        <Button onClick={onSend} className="bg-indigo-600 hover:bg-indigo-700">
          Kirim Email
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default EmailDialog;
