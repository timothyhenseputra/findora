import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search, Filter, LogOut, Plus, Edit, Trash2, Bell, Mail, Image as ImageIcon, Sun, Moon, CheckCircle, XCircle, Menu, Loader, BarChart3 } from "lucide-react";
import { FaBoxOpen, FaSearch } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import ItemDetail from "@/components/ItemDetail";
import EmailDialog, { type EmailDraft } from "./components/EmailDialog";
import InboxDialog from "./components/InboxDialog";
import MatchingQueue from "./components/MatchingQueue";
import MatchesDialog from "./components/MatchesDialog";
import type { FoundItem, LostReport, ReportMatch } from "./types";

type Notification = {
  id: number;
  message: string;
  date: string;
  read: boolean;
};

const ITEMS_PER_PAGE = 5;

function FindoraLogo({ size = 48 }: { size?: number }) {
  const boxSize = Math.round(size * 0.7);
  const searchSize = Math.round(size * 0.4);
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <FaBoxOpen className="text-indigo-500 drop-shadow-lg" size={boxSize} />
      <FaSearch className="absolute text-yellow-400" size={searchSize} style={{ left: size * 0.58, top: size * 0.52 }} />
    </span>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<FoundItem[]>([]);
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<FoundItem | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastReportId, setLastReportId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<FoundItem | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [form, setForm] = useState<any>({
    name: "",
    brand: "",
    color: "",
    category: "",
    locationFound: "",
    foundDate: "",
    description: "",
    photo: null,
    status: "Ditemukan",
    claimedByName: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // AI Mode states
  const [inputMode, setInputMode] = useState<"ai" | "manual">("ai");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedDesc, setAiGeneratedDesc] = useState<string>("");

  // Search khusus untuk inbox laporan
  const [inboxSearch, setInboxSearch] = useState("");
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LostReport | null>(null);
  const [reportMatches, setReportMatches] = useState<ReportMatch[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraft>({
    report: null,
    itemName: "",
    itemLocation: "",
    pickupLocation: "",
    itemDescription: "",
  });
  const [selectedReportId, setSelectedReportId] = useState<string>("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/found-items", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setItems(data);
    } catch {
      toast({ title: "Gagal memuat data", variant: "destructive" });
    }
    setLoading(false);
  };

  const fetchLostReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/lost-reports", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLostReports(data);

      if (data.length > 0) {
        const latestReport = data.reduce((max, r) => (r.id > max.id ? r : max), data[0]);
        if (lastReportId !== null && latestReport.id > lastReportId) {
          setNotifications((prev) => [
            {
              id: latestReport.id,
              message: `Laporan baru dari ${latestReport.name} (${latestReport.category})`,
              date: new Date(latestReport.createdAt).toLocaleDateString(),
              read: false,
            },
            ...prev,
          ]);
        }
        setLastReportId(latestReport.id);
      }
    } catch {
      toast({ title: "Gagal memuat laporan user", variant: "destructive" });
    }
  };

  useEffect(() => {
    const name = sessionStorage.getItem("adminName");
    if (name) {
      setAdminName(name);
    }
    fetchItems();
    fetchLostReports();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLostReports();
    }, 10000);
    return () => clearInterval(interval);
  }, [lastReportId]);

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari sistem",
    });
    localStorage.removeItem("token");
    navigate("/login_admin");
  };

  const deleteItem = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus barang ini?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8080/api/found-items/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      setItems(items.filter((item) => item.id !== id));
      toast({ title: "Item Dihapus", description: "Item berhasil dihapus" });
    } else {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const openDialog = (item?: FoundItem) => {
    setEditItem(item || null);
    setForm(
      item
        ? {
            ...item,
            foundDate: item.foundDate?.slice(0, 10),
            photo: null,
            claimedByName: item.claimedByName || "",
          }
        : {
            name: "",
            brand: "",
            color: "",
            category: "",
            locationFound: "",
            foundDate: "",
            description: "",
            photo: null,
            status: "Ditemukan",
            claimedByName: "",
          },
    );
    setPreview(item?.photoUrl || null);
    setInputMode("ai");
    setAiGeneratedDesc("");
    setShowDialog(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as any;
    if (name === "photo" && files && files[0]) {
      setForm((prev: any) => ({ ...prev, photo: files[0] }));
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleRemovePhoto = () => {
    setForm((prev: any) => ({ ...prev, photo: null }));
    setPreview(null);
    setAiGeneratedDesc("");
  };

  const handleGenerateWithAI = async () => {
    const hasPhoto = form.photo || form.photoUrl;

    if (!hasPhoto) {
      toast({
        title: "Error",
        description: "Foto harus di-upload untuk generate dengan AI",
        variant: "destructive",
      });
      return;
    }

    setAiGenerating(true);

    try {
      const formData = new FormData();

      if (form.photo) {
        formData.append("photo", form.photo);
      } else if (form.photoUrl) {
        formData.append("photoUrl", form.photoUrl);
      }

      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/found-items/generate-description", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to generate description");
      }

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        name: data.aiName || prev.name,
        category: data.aiCategory || prev.category,
        color: data.aiColor || prev.color,
        description: data.aiGeneratedDescription,
        photoUrl: data.photoUrl,
        photo: null,
      }));

      setAiGeneratedDesc(data.aiGeneratedDescription || "generated");
      setPreview(data.photoUrl);

      toast({
        title: "✅ Deskripsi Berhasil Di-Generate!",
        description: "AI telah menganalisis foto. Anda bisa edit deskripsi jika perlu, lalu klik 'Simpan Barang'.",
      });
    } catch (error: any) {
      toast({
        title: "❌ Error AI Generation",
        description: error.message || "Gagal analyze foto dengan Gemini AI. Silakan coba lagi atau gunakan Input Manual.",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (form.status === "Diklaim" && !form.claimedByName?.trim()) {
      toast({
        title: "Nama pengklaim wajib diisi",
        description: "Isi kolom 'Diklaim oleh' saat status barang diubah menjadi Diklaim.",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value as any);
    });
    const token = localStorage.getItem("token");
    let url = "http://localhost:8080/api/found-items";
    let method = "POST";
    if (editItem) {
      url += `/${editItem.id}`;
      method = "PUT";
    }
    const res = await fetch(url, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.ok) {
      setShowDialog(false);
      setEditItem(null);
      setFormLoading(false);
      fetchItems();

      setForm({
        name: "",
        brand: "",
        color: "",
        category: "",
        locationFound: "",
        foundDate: "",
        description: "",
        photo: null,
        photoUrl: null,
        status: "Ditemukan",
        claimedByName: "",
      });
      setPreview(null);
      setAiGeneratedDesc("");
      setInputMode("ai");

      toast({
        title: editItem ? "Barang berhasil diubah" : "Barang berhasil ditambah",
      });
    } else {
      let errorMessage = "Gagal menyimpan data";
      try {
        const errorData = await res.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // Keep default error message when response is not JSON
      }
      toast({
        title: errorMessage,
        variant: "destructive",
      });
      setFormLoading(false);
    }
  };

  const deleteReport = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus laporan ini?")) return;
    try {
      await fetch(`http://localhost:8080/api/lost-reports/${id}`, { method: "DELETE" });
      setLostReports((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Laporan dihapus" });
    } catch {
      toast({ title: "Gagal menghapus laporan", variant: "destructive" });
    }
  };

  const markDone = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/lost-reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "Selesai" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Gagal update status laporan");
      }

      await fetchLostReports();
      await fetchItems();
      toast({ title: "Laporan ditandai selesai" });
    } catch (err: any) {
      toast({ title: "Gagal update status", description: err?.message || "Terjadi kesalahan", variant: "destructive" });
    }
  };

  const markUndone = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/lost-reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "Diproses" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Gagal membatalkan status laporan");
      }

      await fetchLostReports();
      await fetchItems();
      toast({
        title: "Status selesai dibatalkan",
        description: "Laporan kembali ke Diproses, barang terkait dikembalikan ke Ditemukan, dan AI matching bisa dijalankan ulang.",
      });
    } catch (err: any) {
      toast({ title: "Gagal membatalkan status", description: err?.message || "Terjadi kesalahan", variant: "destructive" });
    }
  };

  const openEmailDialog = (report: LostReport, item?: FoundItem) => {
    setEmailDraft({
      report,
      itemName: item?.name || "",
      itemLocation: item?.locationFound || "",
      pickupLocation: item?.locationFound || "",
      itemDescription: item?.description || "",
    });
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailDraft.report) return;
    if (!emailDraft.itemName || !emailDraft.itemLocation || !emailDraft.pickupLocation) {
      toast({
        title: "Data belum lengkap",
        description: "Nama barang, lokasi ditemukan, dan lokasi pengambilan wajib diisi.",
        variant: "destructive",
      });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/lost-reports/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          email: emailDraft.report.email,
          userName: emailDraft.report.name,
          itemDetails: {
            name: emailDraft.itemName,
            category: emailDraft.report.category,
            locationFound: emailDraft.itemLocation,
            pickupLocation: emailDraft.pickupLocation,
            description: emailDraft.itemDescription || "-",
          },
        }),
      });

      if (res.ok) {
        toast({
          title: "✉️ Email Berhasil Dikirim",
          description: `Notifikasi telah dikirim ke ${emailDraft.report.email}`,
        });
        setEmailDialogOpen(false);
      } else {
        const data = await res.json();
        toast({
          title: "❌ Gagal Mengirim Email",
          description: data.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "❌ Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      });
    }
  };

  const fetchReportMatches = async (report: LostReport) => {
    setSelectedReport(report);
    setMatchesOpen(true);
    setMatchesLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8080/api/lost-reports/${report.id}/recompute-matches`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const res = await fetch(`http://localhost:8080/api/lost-reports/${report.id}/matches`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setReportMatches(data);
    } catch {
      toast({ title: "Gagal memuat matches", variant: "destructive" });
    } finally {
      setMatchesLoading(false);
    }
  };

  const loadReportMatches = async (reportId: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8080/api/lost-reports/${reportId}/matches`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Gagal mengambil data match");
    }

    const data = await res.json();
    setReportMatches(data);
  };

  const recomputeMatches = async () => {
    if (!selectedReport) return;
    setMatchesLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8080/api/lost-reports/${selectedReport.id}/recompute-matches`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await loadReportMatches(selectedReport.id);
    } catch {
      toast({ title: "Gagal recompute match", variant: "destructive" });
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleRunMatch = async (reportId: number) => {
    const report = lostReports.find((r) => r.id === reportId);
    if (!report) return;
    await fetchReportMatches(report);
  };

  const confirmMatch = async (match: { id: number; foundItemId: number }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/lost-reports/matches/${match.id}/confirm`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal konfirmasi match");
      }
      toast({ title: "Match dikonfirmasi", description: "Status barang dan laporan diperbarui." });
      fetchItems();
      fetchLostReports();
      setReportMatches((prev) => prev.filter((m) => m.id !== match.id));
      if (selectedReport) {
        await loadReportMatches(selectedReport.id);
      }
    } catch (err: any) {
      toast({ title: "Gagal konfirmasi", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    }
  };

  const rejectMatch = async (match: { id: number; foundItemId: number }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/lost-reports/matches/${match.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal menolak match");
      }
      toast({ title: "Match ditolak" });
      setReportMatches((prev) => prev.filter((m) => m.id !== match.id));
      if (selectedReport) {
        await loadReportMatches(selectedReport.id);
      }
    } catch (err: any) {
      toast({ title: "Gagal menolak", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter !== "all" ? item.category === categoryFilter : true;
    const matchesStatus = statusFilter !== "all" ? item.status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "date_desc") return new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime();
    if (sortBy === "date_asc") return new Date(a.foundDate).getTime() - new Date(b.foundDate).getTime();
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "name_desc") return b.name.localeCompare(a.name);
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = sortedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Hilang":
        return <Badge variant="destructive">{status}</Badge>;
      case "Ditemukan":
        return <Badge className="bg-amber-500 text-white dark:text-gray-900">{status}</Badge>;
      case "Diklaim":
        return <Badge className="bg-blue-500 text-white dark:text-gray-900">{status}</Badge>;
      case "Dikembalikan":
        return <Badge className="bg-green-500 text-white dark:text-gray-900">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusOwnerText = (item: FoundItem) => {
    const confirmedMatch = item.matchings?.find((m) => m.isConfirmed && m.lostReport?.name);
    const ownerName = item.claimedByName || confirmedMatch?.lostReport?.name;

    if (item.status === "Diklaim") {
      return ownerName ? `Diklaim oleh ${ownerName}` : "Diklaim (pelapor tidak diketahui)";
    }

    return "";
  };

  const formatStatusDate = (value?: string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString("id-ID");
  };

  const getStatusDateText = (item: FoundItem) => {
    const confirmedMatch = item.matchings?.find((m) => m.isConfirmed);

    if (item.status === "Diklaim") {
      const claimDate = formatStatusDate(item.claimedAt || confirmedMatch?.matchedAt);
      return claimDate ? `Tanggal diklaim: ${claimDate}` : "";
    }

    return "";
  };

  const formatScore = (score: number) => `${Math.round(score * 100)}%`;
  const scoreBadge = (score: number) => {
    if (score >= 0.75) return "bg-emerald-600";
    if (score >= 0.6) return "bg-amber-500";
    return "bg-gray-500";
  };

  const matchQueue = items
    .flatMap((item) =>
      (item.matchings || []).map((m) => ({
        ...m,
        foundItem: item,
        foundItemId: item.id,
      })),
    )
    .filter((m) => m.lostReport && !m.isConfirmed && m.matchingScore >= 0.5 && m.lostReport.status !== "Selesai")
    .reduce((acc, m) => {
      const existing = acc.get(m.lostReportId);
      if (!existing || m.matchingScore > existing.matchingScore) acc.set(m.lostReportId, m);
      return acc;
    }, new Map<number, { id: number; matchingScore: number; lostReportId: number; lostReport?: LostReport; foundItem: FoundItem; foundItemId: number }>());

  const matchQueueList = Array.from(matchQueue.values()).sort((a, b) => b.matchingScore - a.matchingScore);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markNotifRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };
  const newReportCount = lostReports.filter((r) => r.status !== "Selesai").length;

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full shadow-lg" style={{ background: "radial-gradient(circle at 60% 40%, #facc15 0%, #6366f1 70%, transparent 100%)" }}>
            <FindoraLogo size={48} />
          </span>
          <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">Findora</span>
        </div>
        <button onClick={() => setDarkMode((d) => !d)} className="ml-2 p-2 rounded hover:bg-indigo-100 dark:hover:bg-gray-700" title="Toggle dark mode">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className="p-6 flex-1">
        <nav className="space-y-2">
          <a href="#" className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md font-semibold dark:bg-indigo-900 dark:text-indigo-200">
            <Bell className="mr-2 h-4 w-4" /> Dashboard
          </a>
          <NavLink to="/admin/statistik" className="flex items-center px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-md dark:text-indigo-200 dark:hover:bg-gray-700">
            <BarChart3 className="mr-2 h-4 w-4" /> Statistik
          </NavLink>
          <button className="flex items-center w-full px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md relative dark:text-blue-300 dark:hover:bg-gray-700" onClick={() => setNotifOpen(true)}>
            <Bell className="mr-2 h-4 w-4" />
            Notifikasi
            {unreadCount > 0 && <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>}
          </button>
          <button className="flex items-center w-full px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-md relative dark:text-indigo-200 dark:hover:bg-gray-700" onClick={() => setInboxOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Inbox
            {newReportCount > 0 && <Badge className="ml-2 bg-yellow-500 text-white">{newReportCount}</Badge>}
          </button>
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-red-500 hover:bg-red-50 rounded-md dark:hover:bg-gray-700">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </button>
        </nav>
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex min-h-screen">
        <aside className="hidden md:block w-72 bg-white dark:bg-[#181c24] shadow-lg border-r">{SidebarContent}</aside>
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed top-0 left-0 h-full w-64 z-50 bg-white/90 dark:bg-[#181c24]/95 shadow-lg transition-transform duration-300 md:hidden" style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}>
              <div className="flex flex-col h-full">
                <div className="p-6 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full shadow-lg" style={{ background: "radial-gradient(circle at 60% 40%, #facc15 0%, #6366f1 70%, transparent 100%)" }}>
                      <FindoraLogo size={42} />
                    </span>
                    <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">Findora</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="ml-2 p-2 rounded hover:bg-indigo-100 dark:hover:bg-gray-700" aria-label="Tutup sidebar">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 flex-1">
                  <nav className="space-y-2">
                    <a href="#" className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md font-semibold dark:bg-indigo-900 dark:text-indigo-200" onClick={() => setSidebarOpen(false)}>
                      <Bell className="mr-2 h-4 w-4" /> Dashboard
                    </a>
                    <NavLink to="/admin/statistik" className="flex items-center px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-md dark:text-indigo-200 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>
                      <BarChart3 className="mr-2 h-4 w-4" /> Statistik
                    </NavLink>
                    <button
                      className="flex items-center w-full px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md relative dark:text-blue-300 dark:hover:bg-gray-700"
                      onClick={() => {
                        setNotifOpen(true);
                        setSidebarOpen(false);
                      }}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notifikasi
                      {unreadCount > 0 && <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>}
                    </button>
                    <button
                      className="flex items-center w-full px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-md relative dark:text-indigo-200 dark:hover:bg-gray-700"
                      onClick={() => {
                        setInboxOpen(true);
                        setSidebarOpen(false);
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Inbox
                      {newReportCount > 0 && <Badge className="ml-2 bg-yellow-500 text-white">{newReportCount}</Badge>}
                    </button>
                    <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-red-500 hover:bg-red-50 rounded-md dark:hover:bg-gray-700">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </button>
                  </nav>
                </div>
              </div>
            </aside>
          </>
        )}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          {!sidebarOpen && (
            <button className="p-2 rounded-md bg-white/80 shadow hover:bg-indigo-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition" onClick={() => setSidebarOpen(true)} aria-label="Buka sidebar">
              <Menu className="w-7 h-7 text-indigo-600" />
            </button>
          )}
        </div>
        <main
          className="flex-1 min-h-screen"
          style={{
            background: darkMode ? "linear-gradient(135deg, #232526 0%, #414345 100%)" : "linear-gradient(135deg, #fff 0%, rgba(96,165,250,0.18) 30%, rgba(49,46,129,0.18) 70%, rgba(162,28,175,0.13) 100%)",
          }}
        >
          <div className="pt-4 px-4 md:px-8 max-w-full">
            <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
              <DialogContent className="sm:max-w-md dark:bg-[#232526] dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5" /> Notifikasi
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {notifications.length === 0 && <div className="text-center text-gray-500 dark:text-gray-300 py-8">Belum ada notifikasi baru.</div>}
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`rounded-lg px-4 py-3 mb-2 shadow-sm border flex items-center justify-between ${!notif.read ? "bg-indigo-50 dark:bg-indigo-900" : "bg-white dark:bg-[#232526]"}`}>
                      <div>
                        <div className="font-medium">{notif.message}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">{notif.date}</div>
                      </div>
                      {!notif.read && (
                        <Badge className="bg-blue-600 text-white cursor-pointer ml-2" onClick={() => markNotifRead(notif.id)}>
                          Baru
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNotifOpen(false)}>
                    Tutup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <InboxDialog
              open={inboxOpen}
              onOpenChange={setInboxOpen}
              lostReports={lostReports}
              inboxSearch={inboxSearch}
              onInboxSearchChange={setInboxSearch}
              onOpenEmail={openEmailDialog}
              onOpenMatches={fetchReportMatches}
              onMarkDone={markDone}
              onMarkUndone={markUndone}
              onDelete={deleteReport}
            />

            <MatchesDialog
              open={matchesOpen}
              onOpenChange={setMatchesOpen}
              matchesLoading={matchesLoading}
              reportMatches={reportMatches}
              selectedReport={selectedReport}
              onOpenEmail={openEmailDialog}
              onConfirm={confirmMatch}
              onReject={rejectMatch}
              onRecompute={recomputeMatches}
              formatScore={formatScore}
              scoreBadge={scoreBadge}
            />

            <EmailDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} draft={emailDraft} onDraftChange={setEmailDraft} onSend={handleSendEmail} />

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
              <DialogContent className="sm:max-w-lg dark:bg-[#232526] dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>Detail Barang</DialogTitle>
                </DialogHeader>
                {detailItem && <ItemDetail item={detailItem} />}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>
                    Tutup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
              <DialogContent className="sm:max-w-md dark:bg-[#232526] dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>Konfirmasi Logout</DialogTitle>
                  <DialogDescription>Anda yakin ingin logout? Tindakan ini akan mengakhiri sesi admin.</DialogDescription>
                </DialogHeader>
                <div className="rounded-xl bg-indigo-50/80 dark:bg-indigo-900/30 p-4 border border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">👋</span>
                    <div>
                      <p className="font-semibold text-indigo-900 dark:text-indigo-200">Sesi Anda akan berakhir</p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">Pastikan pekerjaan sudah tersimpan.</p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-2">
                  <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                    Batal
                  </Button>
                  <Button variant="destructive" onClick={confirmLogout}>
                    Logout
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {(() => {
              const now = new Date();
              const hour = now.getHours();
              const greeting = hour < 12 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";
              const emoji = hour < 12 ? "☀️" : hour < 15 ? "🌤️" : hour < 18 ? "🌅" : "🌙";
              const motivations = [
                "Yuk bantu temukan barang yang hilang hari ini!",
                "Setiap barang yang dikembalikan membawa senyuman.",
                "Semangat mengelola sistem barang hilang & ditemukan!",
                "Hari yang baik untuk membantu sesama!",
                "Mari jadikan hari ini produktif!",
              ];
              const motivation = motivations[now.getDate() % motivations.length];
              const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
              return (
                <div className="mb-6 relative overflow-hidden rounded-2xl shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 opacity-90" />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
                  <div className="relative p-6 flex items-center justify-between gap-4 text-white">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                        <span className="text-3xl">{emoji}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/70 tracking-wide uppercase">{dateStr}</p>
                        <h2 className="text-2xl font-bold mt-0.5">
                          {greeting}, {adminName || "Admin"}!
                        </h2>
                        <p className="text-white/80 mt-1 text-sm">{motivation}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{items.length}</p>
                        <p className="text-xs text-white/70">Barang</p>
                      </div>
                      <div className="w-px h-10 bg-white/20" />
                      <div className="text-center">
                        <p className="text-2xl font-bold">{lostReports.length}</p>
                        <p className="text-xs text-white/70">Laporan</p>
                      </div>
                      <div className="w-px h-10 bg-white/20" />
                      <div className="text-center">
                        <p className="text-2xl font-bold">{items.filter((i) => i.status === "Diklaim").length}</p>
                        <p className="text-xs text-white/70">Diklaim</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">Kelola Barang Hilang & Ditemukan</h1>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Item Baru
                </Button>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-[#232526] dark:text-gray-100">
                  <DialogHeader>
                    <DialogTitle>{editItem ? "Edit Barang" : "Tambah Item Baru"}</DialogTitle>
                    <DialogDescription>{editItem ? "Ubah detail barang yang ditemukan." : "Pilih metode input untuk menambahkan barang yang ditemukan"}</DialogDescription>
                  </DialogHeader>

                  {editItem ? (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="flex gap-3">
                        <Input name="name" placeholder="Nama Barang" value={form.name} onChange={handleChange} required className="dark:bg-[#232526] dark:text-gray-100" />
                        <Input name="brand" placeholder="Merk" value={form.brand} onChange={handleChange} className="dark:bg-[#232526] dark:text-gray-100" />
                      </div>
                      <div className="flex gap-3">
                        <Input name="color" placeholder="Warna" value={form.color} onChange={handleChange} className="dark:bg-[#232526] dark:text-gray-100" />
                        <Input name="category" placeholder="Kategori" value={form.category} onChange={handleChange} required className="dark:bg-[#232526] dark:text-gray-100" />
                      </div>
                      <div className="flex gap-3">
                        <Input name="locationFound" placeholder="Lokasi Ditemukan" value={form.locationFound} onChange={handleChange} required className="dark:bg-[#232526] dark:text-gray-100" />
                        <Input name="foundDate" type="date" value={form.foundDate} onChange={handleChange} required className="dark:bg-[#232526] dark:text-gray-100" />
                      </div>
                      <Textarea name="description" placeholder="Deskripsi" value={form.description} onChange={handleChange} className="dark:bg-[#232526] dark:text-gray-100" />
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <ImageIcon className="h-5 w-5 text-indigo-500" />
                          <span className="text-sm">{preview ? "Klik gambar untuk ganti" : "Klik di sini untuk upload foto barang"}</span>
                          <input name="photo" type="file" accept="image/*" onChange={handleChange} className="hidden" />
                        </label>
                        {preview && (
                          <div className="relative group mt-2">
                            <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded border shadow" />
                            <button type="button" onClick={handleRemovePhoto} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1">
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                      <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 border rounded dark:bg-[#232526] dark:text-gray-100">
                        <option value="Ditemukan">Ditemukan</option>
                        <option value="Diklaim">Diklaim</option>
                        <option value="Dikembalikan">Dikembalikan</option>
                      </select>
                      {form.status === "Diklaim" && <Input name="claimedByName" placeholder="Diklaim oleh (nama pemilik)" value={form.claimedByName || ""} onChange={handleChange} required className="dark:bg-[#232526] dark:text-gray-100" />}
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>
                          Batal
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                          {formLoading ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                      </DialogFooter>
                    </form>
                  ) : (
                    <Tabs value={inputMode} onValueChange={(value: any) => setInputMode(value)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="ai" className="flex items-center gap-2">
                          🤖 Generate AI
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="flex items-center gap-2">
                          ✏️ Input Manual
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="ai" className="space-y-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">🤖 Generate Otomatis dari Foto</h3>
                          <p className="text-sm text-indigo-800 dark:text-indigo-200">Upload foto barang → AI akan menganalisis dan mengisi Nama, Kategori, Warna, dan Deskripsi secara otomatis!</p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium mb-2 block">📸 1. Upload Foto Barang (REQUIRED) *</label>
                            <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg p-6 text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition cursor-pointer">
                              <label className="cursor-pointer">
                                <div className="flex items-center justify-center gap-2">
                                  <ImageIcon className="h-5 w-5 text-indigo-500" />
                                  <span className="text-sm font-medium">{preview ? "Klik untuk ganti foto" : "Klik untuk upload foto"}</span>
                                </div>
                                <input name="photo" type="file" accept="image/*" onChange={handleChange} disabled={aiGenerating} className="hidden" />
                              </label>
                            </div>
                            {preview && (
                              <div className="relative group mt-3">
                                <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded border shadow mx-auto" />
                                <button type="button" onClick={handleRemovePhoto} disabled={aiGenerating} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                                  ×
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">🏷️ 2. Merk Barang (Opsional)</label>
                            <Input name="brand" placeholder="Contoh: Apple, Samsung, Adidas, dll" value={form.brand} onChange={handleChange} disabled={aiGenerating} className="dark:bg-[#232526] dark:text-gray-100" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Isi jika Anda sudah tahu merknya (AI akan menggunakannya untuk analisis lebih akurat)</p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block">📍 3. Lokasi Ditemukan (REQUIRED) *</label>
                              <Input
                                name="locationFound"
                                placeholder="Contoh: Ruang Kelas A1, Lapangan, Kantin, dll"
                                value={form.locationFound}
                                onChange={handleChange}
                                disabled={aiGenerating}
                                required
                                className="dark:bg-[#232526] dark:text-gray-100"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">📅 4. Tanggal Ditemukan (REQUIRED) *</label>
                              <Input type="date" name="foundDate" value={form.foundDate} onChange={handleChange} disabled={aiGenerating} required className="dark:bg-[#232526] dark:text-gray-100" />
                            </div>
                          </div>

                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <p className="text-xs text-amber-900 dark:text-amber-100 mb-3">
                              ⏭️ <strong>Langkah Selanjutnya:</strong> Pastikan foto sudah diupload dan lokasi serta tanggal sudah diisi, kemudian klik tombol di bawah
                            </p>
                            <Button type="button" onClick={handleGenerateWithAI} disabled={!form.photo || !form.locationFound || !form.foundDate || aiGenerating} className="bg-indigo-600 hover:bg-indigo-700 w-full font-semibold">
                              {aiGenerating ? (
                                <>
                                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                                  Menganalisis Foto (⏳ 5 - 10 detik)...
                                </>
                              ) : (
                                "🤖 5. Generate dengan AI"
                              )}
                            </Button>
                          </div>

                          {aiGeneratedDesc && (
                            <div className="space-y-3 pt-4 border-t-2 border-green-200 dark:border-green-800">
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-2xl">✅</span>
                                  <p className="font-bold text-green-900 dark:text-green-100">Analisis Selesai! Hasil AI:</p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">NAMA BARANG</p>
                                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{form.name || "—"}</p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">KATEGORI</p>
                                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{form.category || "—"}</p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">WARNA</p>
                                    <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{form.color || "—"}</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2 block">📝 DESKRIPSI (Boleh diedit):</label>
                                  <Textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="dark:bg-gray-800 dark:text-gray-100 bg-white border-green-200 dark:border-green-700"
                                    placeholder="Deskripsi dari AI..."
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button type="button" onClick={handleGenerateWithAI} disabled={(!form.photo && !form.photoUrl) || aiGenerating} variant="outline" className="flex-1">
                                  {aiGenerating ? (
                                    <>
                                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                                      Menganalisis...
                                    </>
                                  ) : (
                                    "🔄 Generate Ulang"
                                  )}
                                </Button>
                                <Button type="button" onClick={handleSubmit} disabled={formLoading || !form.description} className="flex-1 bg-green-600 hover:bg-green-700 font-semibold">
                                  {formLoading ? (
                                    <>
                                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                                      Menyimpan...
                                    </>
                                  ) : (
                                    "✅ Simpan Barang"
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end pt-4 border-t">
                          <Button variant="outline" onClick={() => setShowDialog(false)} disabled={aiGenerating}>
                            Batal
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="manual" className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">✏️ Input Detail Barang Secara Manual</h3>
                          <p className="text-sm text-blue-800 dark:text-blue-200">Ketik sendiri deskripsi detail barang. Foto opsional. Sistem akan mencocokkan dengan laporan hilang berdasarkan deskripsi Anda.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input name="name" placeholder="Nama Barang *" value={form.name} onChange={handleChange} required disabled={formLoading} />
                            <Input name="brand" placeholder="Merk" value={form.brand} onChange={handleChange} disabled={formLoading} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input name="color" placeholder="Warna" value={form.color} onChange={handleChange} disabled={formLoading} />
                            <select name="category" value={form.category} onChange={handleChange} required disabled={formLoading} className="px-3 py-2 border rounded-md text-sm">
                              <option value="">Pilih Kategori *</option>
                              <option value="Elektronik">Elektronik</option>
                              <option value="Pakaian">Pakaian</option>
                              <option value="Olahraga">Olahraga</option>
                              <option value="Aksesoris">Aksesoris</option>
                              <option value="Buku">Buku</option>
                              <option value="Lainnya">Lainnya</option>
                            </select>
                          </div>
                          <Input name="locationFound" placeholder="Lokasi Ditemukan" value={form.locationFound} onChange={handleChange} disabled={formLoading} />
                          <Input type="date" name="foundDate" value={form.foundDate} onChange={handleChange} disabled={formLoading} />

                          <div>
                            <label className="text-sm font-medium mb-2 block">📝 Deskripsi Barang (REQUIRED) *</label>
                            <Textarea
                              name="description"
                              placeholder="Contoh: Tumbler stainless steel warna hitam, kapasitas 500ml, ada logo sekolah di samping, kondisi seperti baru..."
                              value={form.description}
                              onChange={handleChange}
                              required
                              disabled={formLoading}
                              rows={5}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Tip: Semakin detail deskripsi, semakin akurat sistem mencocokkan dengan laporan hilang</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">📸 Upload Foto (OPSIONAL)</label>
                            <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-900/10 transition cursor-pointer">
                              <label className="cursor-pointer">
                                <div className="flex items-center justify-center gap-2">
                                  <ImageIcon className="h-5 w-5 text-blue-500" />
                                  <span className="text-sm">{preview ? "Klik untuk ubah foto" : "Upload foto (opsional)"}</span>
                                </div>
                                <input name="photo" type="file" accept="image/*" onChange={handleChange} disabled={formLoading} className="hidden" />
                              </label>
                            </div>
                            {preview && (
                              <div className="relative group mt-3">
                                <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded border shadow mx-auto" />
                                <button type="button" onClick={handleRemovePhoto} disabled={formLoading} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                  ×
                                </button>
                              </div>
                            )}
                          </div>

                          <select name="status" value={form.status} onChange={handleChange} disabled={formLoading} className="w-full p-2 border rounded">
                            <option value="Ditemukan">Ditemukan</option>
                            <option value="Diklaim">Diklaim</option>
                            <option value="Dikembalikan">Dikembalikan</option>
                          </select>

                          {form.status === "Diklaim" && <Input name="claimedByName" placeholder="Diklaim oleh (nama pemilik)" value={form.claimedByName || ""} onChange={handleChange} required disabled={formLoading} />}

                          <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)} disabled={formLoading}>
                              Batal
                            </Button>
                            <Button type="submit" disabled={!form.name || !form.category || !form.description || formLoading} className="bg-blue-600 hover:bg-blue-700">
                              {formLoading ? (
                                <>
                                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                                  Menambahkan...
                                </>
                              ) : (
                                "✅ Tambahkan Barang"
                              )}
                            </Button>
                          </div>
                        </form>
                      </TabsContent>
                    </Tabs>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`rounded-xl p-6 shadow ${darkMode ? "bg-[#181c24] text-gray-100" : "bg-white"}`}>
                <div className="text-lg font-semibold mb-2">Total Laporan</div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{lostReports.length}</div>
              </div>
              <div className={`rounded-xl p-6 shadow ${darkMode ? "bg-[#181c24] text-gray-100" : "bg-white"}`}>
                <div className="text-lg font-semibold mb-2">Barang Hilang</div>
                <div className="text-3xl font-bold text-red-500 dark:text-red-400">{items.filter((i) => i.status === "Hilang").length}</div>
              </div>
              <div className={`rounded-xl p-6 shadow ${darkMode ? "bg-[#181c24] text-gray-100" : "bg-white"}`}>
                <div className="text-lg font-semibold mb-2">Barang Ditemukan</div>
                <div className="text-3xl font-bold text-green-500 dark:text-green-400">{items.filter((i) => i.status === "Ditemukan").length}</div>
              </div>
            </div>

            <MatchingQueue
              matchQueueList={matchQueueList}
              darkMode={darkMode}
              inboxReports={lostReports.filter((r) => r.status !== "Selesai")}
              selectedReportId={selectedReportId}
              onSelectReport={setSelectedReportId}
              onRunMatch={handleRunMatch}
              onOpenMatches={fetchReportMatches}
              onConfirm={confirmMatch}
              onOpenEmail={openEmailDialog}
              formatScore={formatScore}
              scoreBadge={scoreBadge}
            />

            <div className="flex gap-4 mb-4 flex-wrap">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] dark:bg-[#232526] dark:text-gray-100">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#232526] dark:text-gray-100">
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="date_desc">Tanggal Terbaru</SelectItem>
                  <SelectItem value="date_asc">Tanggal Terlama</SelectItem>
                  <SelectItem value="name_asc">Nama A-Z</SelectItem>
                  <SelectItem value="name_desc">Nama Z-A</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] dark:bg-[#232526] dark:text-gray-100">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Kategori" />
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-[#232526] dark:text-gray-100">
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Elektronik">Elektronik</SelectItem>
                  <SelectItem value="Dokumen">Dokumen</SelectItem>
                  <SelectItem value="Pakaian">Pakaian</SelectItem>
                  <SelectItem value="Aksesoris">Aksesoris</SelectItem>
                  <SelectItem value="Buku">Buku</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] dark:bg-[#232526] dark:text-gray-100">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-[#232526] dark:text-gray-100">
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Hilang">Hilang</SelectItem>
                  <SelectItem value="Ditemukan">Ditemukan</SelectItem>
                  <SelectItem value="Diklaim">Diklaim</SelectItem>
                  <SelectItem value="Dikembalikan">Dikembalikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={`shadow rounded-lg p-6 ${darkMode ? "bg-[#232526] text-gray-100" : "bg-white"}`}>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Cari berdasarkan nama barang..." className="pl-10 dark:bg-[#181c24] dark:text-gray-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader className="dark:bg-[#181c24]">
                    <TableRow>
                      <TableHead className="dark:text-gray-100">Foto</TableHead>
                      <TableHead className="dark:text-gray-100">Nama Barang</TableHead>
                      <TableHead className="dark:text-gray-100">Merk</TableHead>
                      <TableHead className="dark:text-gray-100">Warna</TableHead>
                      <TableHead className="dark:text-gray-100">Kategori</TableHead>
                      <TableHead className="dark:text-gray-100">Lokasi</TableHead>
                      <TableHead className="dark:text-gray-100">Tanggal</TableHead>
                      <TableHead className="dark:text-gray-100">Status</TableHead>
                      <TableHead className="dark:text-gray-100">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-indigo-600 dark:text-indigo-300">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    ) : paginatedItems.length > 0 ? (
                      paginatedItems.map((item) => (
                        <TableRow key={item.id} className="dark:bg-[#232526]">
                          <TableCell>
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt={item.name} className="w-14 h-14 object-cover rounded border" />
                            ) : (
                              <span className="flex items-center text-gray-400">
                                <ImageIcon className="mr-1" /> -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              className="text-indigo-700 hover:underline dark:text-indigo-300"
                              onClick={() => {
                                setDetailItem(item);
                                setDetailOpen(true);
                              }}
                            >
                              {item.name}
                            </button>
                          </TableCell>
                          <TableCell>{item.brand}</TableCell>
                          <TableCell>{item.color}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.locationFound}</TableCell>
                          <TableCell>{new Date(item.foundDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {renderStatusBadge(item.status)}
                            {getStatusOwnerText(item) && <div className="text-xs text-gray-500 mt-1">{getStatusOwnerText(item)}</div>}
                            {getStatusDateText(item) && <div className="text-xs text-gray-500 mt-1">{getStatusDateText(item)}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => openDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 dark:text-red-400" onClick={() => deleteItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-gray-500 dark:text-gray-300">
                          Tidak ada data yang ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={() => handlePageChange(currentPage - 1)} />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, idx) => (
                      <PaginationItem key={idx}>
                        <PaginationLink href="#" isActive={currentPage === idx + 1} onClick={() => handlePageChange(idx + 1)}>
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={() => handlePageChange(currentPage + 1)} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
