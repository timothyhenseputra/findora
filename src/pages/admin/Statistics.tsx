import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeftRight, BarChart3, CalendarRange, Menu, Moon, Sun, XCircle } from "lucide-react";
import { FaBoxOpen, FaSearch } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { FoundItem } from "./types";

type FilterMode = "singleMonth" | "dateRange" | "monthRange";

type TimelinePoint = {
  key: string;
  label: string;
  start: Date;
  end: Date;
  ditemukan: number;
  dikembalikan: number;
  foundItems: FoundItem[];
  returnedItems: FoundItem[];
};

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

const normalizeDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const createMonthRange = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: startOfDay(start), end: endOfDay(end) };
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const Statistics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const now = new Date();

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("singleMonth");

  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));

  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10));

  const [rangeYear, setRangeYear] = useState(String(now.getFullYear()));
  const [startMonthRange, setStartMonthRange] = useState("1");
  const [endMonthRange, setEndMonthRange] = useState(String(now.getMonth() + 1));

  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/api/found-items", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        toast({
          title: "Gagal memuat statistik",
          description: "Data tidak dapat diambil dari server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [toast]);

  const filteredBuckets = useMemo<TimelinePoint[]>(() => {
    let globalStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    let globalEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    if (filterMode === "singleMonth") {
      const year = Number(selectedYear);
      const month = Number(selectedMonth);
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        const range = createMonthRange(year, month);
        globalStart = range.start;
        globalEnd = range.end;
      }
    }

    if (filterMode === "dateRange") {
      const parsedStart = normalizeDate(startDate);
      const parsedEnd = normalizeDate(endDate);
      if (parsedStart && parsedEnd) {
        globalStart = startOfDay(parsedStart);
        globalEnd = endOfDay(parsedEnd < parsedStart ? parsedStart : parsedEnd);
      }
    }

    if (filterMode === "monthRange") {
      const year = Number(rangeYear);
      const startMonth = Number(startMonthRange);
      const endMonth = Number(endMonthRange);

      if (!Number.isNaN(year) && !Number.isNaN(startMonth) && !Number.isNaN(endMonth)) {
        const minMonth = Math.min(startMonth, endMonth);
        const maxMonth = Math.max(startMonth, endMonth);
        const startRange = createMonthRange(year, minMonth);
        const endRange = createMonthRange(year, maxMonth);
        globalStart = startRange.start;
        globalEnd = endRange.end;
      }
    }

    if (filterMode === "monthRange") {
      const year = Number(rangeYear);
      const startMonth = Number(startMonthRange);
      const endMonth = Number(endMonthRange);
      const minMonth = Math.min(startMonth, endMonth);
      const maxMonth = Math.max(startMonth, endMonth);

      const buckets: TimelinePoint[] = [];
      for (let month = minMonth; month <= maxMonth; month += 1) {
        const { start, end } = createMonthRange(year, month);

        const foundItems = items.filter((item) => {
          const foundDate = normalizeDate(item.foundDate);
          return foundDate ? foundDate >= start && foundDate <= end : false;
        });

        const returnedItems = items.filter((item) => {
          if (item.status !== "Dikembalikan") return false;
          const returnedDate = normalizeDate(item.returnedAt) || normalizeDate(item.foundDate);
          return returnedDate ? returnedDate >= start && returnedDate <= end : false;
        });

        buckets.push({
          key: `${year}-${month}`,
          label: monthNames[month - 1],
          start,
          end,
          ditemukan: foundItems.length,
          dikembalikan: returnedItems.length,
          foundItems,
          returnedItems,
        });
      }

      return buckets;
    }

    const buckets: TimelinePoint[] = [];
    let cursor = new Date(globalStart);
    while (cursor <= globalEnd) {
      const bucketStart = startOfDay(cursor);
      const bucketEnd = endOfDay(cursor);

      const foundItems = items.filter((item) => {
        const foundDate = normalizeDate(item.foundDate);
        return foundDate ? foundDate >= bucketStart && foundDate <= bucketEnd : false;
      });

      const returnedItems = items.filter((item) => {
        if (item.status !== "Dikembalikan") return false;
        const returnedDate = normalizeDate(item.returnedAt) || normalizeDate(item.foundDate);
        return returnedDate ? returnedDate >= bucketStart && returnedDate <= bucketEnd : false;
      });

      buckets.push({
        key: bucketStart.toISOString().slice(0, 10),
        label: bucketStart.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        start: bucketStart,
        end: bucketEnd,
        ditemukan: foundItems.length,
        dikembalikan: returnedItems.length,
        foundItems,
        returnedItems,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return buckets;
  }, [items, filterMode, selectedYear, selectedMonth, startDate, endDate, rangeYear, startMonthRange, endMonthRange, now]);

  useEffect(() => {
    if (filteredBuckets.length === 0) {
      setSelectedPointKey(null);
      return;
    }

    if (!selectedPointKey || !filteredBuckets.some((bucket) => bucket.key === selectedPointKey)) {
      setSelectedPointKey(filteredBuckets[0].key);
    }
  }, [filteredBuckets, selectedPointKey]);

  const summary = useMemo(() => {
    const ditemukanTotal = filteredBuckets.reduce((sum, point) => sum + point.ditemukan, 0);
    const dikembalikanTotal = filteredBuckets.reduce((sum, point) => sum + point.dikembalikan, 0);
    const returnRate = ditemukanTotal > 0 ? Math.round((dikembalikanTotal / ditemukanTotal) * 100) : 0;

    return {
      ditemukanTotal,
      dikembalikanTotal,
      pending: Math.max(ditemukanTotal - dikembalikanTotal, 0),
      returnRate,
    };
  }, [filteredBuckets]);

  const statusDistribution = useMemo(() => {
    const ditemukan = items.filter((item) => item.status === "Ditemukan").length;
    const diklaim = items.filter((item) => item.status === "Diklaim").length;
    const dikembalikan = items.filter((item) => item.status === "Dikembalikan").length;

    return [
      { name: "Ditemukan", value: ditemukan, color: "#2563eb" },
      { name: "Diklaim", value: diklaim, color: "#f59e0b" },
      { name: "Dikembalikan", value: dikembalikan, color: "#16a34a" },
    ].filter((item) => item.value > 0);
  }, [items]);

  const selectedPoint = useMemo(() => {
    if (!selectedPointKey) return null;
    return filteredBuckets.find((point) => point.key === selectedPointKey) || null;
  }, [filteredBuckets, selectedPointKey]);

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 rounded-md transition ${isActive ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900 dark:text-indigo-200" : "text-indigo-700 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-gray-700"}`;

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full shadow-lg" style={{ background: "radial-gradient(circle at 60% 40%, #facc15 0%, #6366f1 70%, transparent 100%)" }}>
            <FindoraLogo size={44} />
          </span>
          <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">Findora</span>
        </div>
        <button onClick={() => setDarkMode((prev) => !prev)} className="ml-2 p-2 rounded hover:bg-indigo-100 dark:hover:bg-gray-700" title="Toggle dark mode">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-6 flex-1">
        <nav className="space-y-2">
          <NavLink to="/admin/dashboard" className={navClassName} onClick={() => setSidebarOpen(false)}>
            <ArrowLeftRight className="mr-2 h-4 w-4" /> Dashboard
          </NavLink>
          <NavLink to="/admin/statistik" className={navClassName} onClick={() => setSidebarOpen(false)}>
            <BarChart3 className="mr-2 h-4 w-4" /> Statistik
          </NavLink>
        </nav>
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 dark:from-[#232526] dark:to-[#414345]">
        <aside className="hidden md:block w-72 bg-white shadow-lg border-r dark:bg-[#181c24] dark:border-gray-700">{SidebarContent}</aside>

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed top-0 left-0 h-full w-64 z-50 bg-white shadow-lg md:hidden dark:bg-[#181c24]">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b flex items-center justify-between dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <FindoraLogo size={40} />
                    <span className="text-xl font-bold text-indigo-800 dark:text-indigo-300">Findora</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="ml-2 p-2 rounded hover:bg-indigo-100 dark:hover:bg-gray-700" aria-label="Tutup sidebar">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 flex-1">
                  <nav className="space-y-2">
                    <NavLink to="/admin/dashboard" className={navClassName} onClick={() => setSidebarOpen(false)}>
                      <ArrowLeftRight className="mr-2 h-4 w-4" /> Dashboard
                    </NavLink>
                    <NavLink to="/admin/statistik" className={navClassName} onClick={() => setSidebarOpen(false)}>
                      <BarChart3 className="mr-2 h-4 w-4" /> Statistik
                    </NavLink>
                  </nav>
                </div>
              </div>
            </aside>
          </>
        )}

        <div className="fixed top-4 left-4 z-50 md:hidden">
          {!sidebarOpen && (
            <button className="p-2 rounded-md bg-white/90 shadow hover:bg-indigo-100 transition dark:bg-gray-800 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(true)} aria-label="Buka sidebar">
              <Menu className="w-7 h-7 text-indigo-600" />
            </button>
          )}
        </div>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
          <div className="mb-6 rounded-2xl overflow-hidden shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 opacity-95" />
            <div className="relative p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white/80 text-sm mb-2">Dashboard Admin • Insight Operasional</p>
                <h1 className="text-2xl md:text-3xl font-bold">Statistik Barang Ditemukan & Dikembalikan</h1>
                <p className="text-white/85 mt-2 max-w-2xl">Pantau tren penemuan dan pengembalian barang secara mingguan atau bulanan untuk melihat performa layanan lost and found.</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 min-w-[220px]">
                <p className="text-xs text-white/80 mb-2">Mode Filter</p>
                <Select value={filterMode} onValueChange={(v: FilterMode) => setFilterMode(v)}>
                  <SelectTrigger className="bg-white text-slate-900 border-white/30">
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singleMonth">Bulan Tertentu</SelectItem>
                    <SelectItem value="dateRange">Rentang Tanggal</SelectItem>
                    <SelectItem value="monthRange">Rentang Bulan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border shadow-sm p-4 mb-6 dark:bg-[#181c24] dark:border-gray-700">
            <div className="flex flex-wrap gap-3">
              {filterMode === "singleMonth" && (
                <>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[160px] dark:bg-[#232526] dark:text-gray-100 dark:border-gray-700">
                      <SelectValue placeholder="Pilih tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[200px] dark:bg-[#232526] dark:text-gray-100 dark:border-gray-700">
                      <SelectValue placeholder="Pilih bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((name, idx) => (
                        <SelectItem key={name} value={String(idx + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {filterMode === "dateRange" && (
                <>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[200px] dark:bg-[#232526] dark:text-gray-100 dark:border-gray-700" />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[200px] dark:bg-[#232526] dark:text-gray-100 dark:border-gray-700" />
                </>
              )}

              {filterMode === "monthRange" && (
                <>
                  <Select value={rangeYear} onValueChange={setRangeYear}>
                    <SelectTrigger className="w-[160px] dark:bg-[#232526] dark:text-gray-100 dark:border-gray-700">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={startMonthRange} onValueChange={setStartMonthRange}>
                    <SelectTrigger className="w-[190px] dark:bg-[#232526] dark:text-gray-100 dark:border-gray-700">
                      <SelectValue placeholder="Bulan awal" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((name, idx) => (
                        <SelectItem key={`start-${name}`} value={String(idx + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={endMonthRange} onValueChange={setEndMonthRange}>
                    <SelectTrigger className="w-[190px] dark:bg-[#232526] dark:text-gray-100 dark:border-gray-700">
                      <SelectValue placeholder="Bulan akhir" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((name, idx) => (
                        <SelectItem key={`end-${name}`} value={String(idx + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl bg-white p-5 border shadow-sm dark:bg-[#181c24] dark:border-gray-700">
              <p className="text-sm text-slate-500 dark:text-gray-400">Total Ditemukan</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{summary.ditemukanTotal}</p>
            </div>
            <div className="rounded-xl bg-white p-5 border shadow-sm dark:bg-[#181c24] dark:border-gray-700">
              <p className="text-sm text-slate-500 dark:text-gray-400">Total Dikembalikan</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{summary.dikembalikanTotal}</p>
            </div>
            <div className="rounded-xl bg-white p-5 border shadow-sm dark:bg-[#181c24] dark:border-gray-700">
              <p className="text-sm text-slate-500 dark:text-gray-400">Menunggu Pengembalian</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{summary.pending}</p>
            </div>
            <div className="rounded-xl bg-white p-5 border shadow-sm dark:bg-[#181c24] dark:border-gray-700">
              <p className="text-sm text-slate-500 dark:text-gray-400">Return Rate</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{summary.returnRate}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-2xl bg-white border shadow-sm p-5 md:p-6 dark:bg-[#181c24] dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">Tren Periode Terpilih</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Klik bar untuk menampilkan daftar detail data di bawah</p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  <CalendarRange className="w-4 h-4 mr-1" /> {filterMode === "singleMonth" ? "Per Hari" : filterMode === "dateRange" ? "Rentang Tanggal" : "Per Bulan"}
                </Badge>
              </div>

              <div className="h-[330px]">
                {loading ? (
                  <div className="h-full grid place-items-center text-slate-500 dark:text-gray-400">Memuat data statistik...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredBuckets} margin={{ top: 8, right: 12, left: 0, bottom: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#475569" : "#e2e8f0"} />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="ditemukan" name="Ditemukan" fill="#2563eb" radius={[8, 8, 0, 0]} onClick={(data: TimelinePoint) => setSelectedPointKey(data.key)} />
                      <Bar dataKey="dikembalikan" name="Dikembalikan" fill="#16a34a" radius={[8, 8, 0, 0]} onClick={(data: TimelinePoint) => setSelectedPointKey(data.key)} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white border shadow-sm p-5 md:p-6 dark:bg-[#181c24] dark:border-gray-700">
              <h2 className="text-lg font-semibold text-slate-800 mb-1 dark:text-gray-100">Distribusi Status</h2>
              <p className="text-sm text-slate-500 mb-3 dark:text-gray-400">Komposisi status barang saat ini</p>

              <div className="h-[240px]">
                {loading ? (
                  <div className="h-full grid place-items-center text-slate-500 dark:text-gray-400">Memuat chart...</div>
                ) : statusDistribution.length === 0 ? (
                  <div className="h-full grid place-items-center text-slate-500 dark:text-gray-400">Belum ada data status.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDistribution} dataKey="value" nameKey="name" outerRadius={86} innerRadius={45} paddingAngle={4}>
                        {statusDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-2 mt-2">
                {statusDistribution.map((row) => (
                  <div key={row.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="text-slate-700 dark:text-gray-300">{row.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-gray-100">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white border shadow-sm p-5 md:p-6 dark:bg-[#181c24] dark:border-gray-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">Detail Data Per Titik Grafik</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">Klik salah satu batang pada grafik. Detail data barang untuk rentang waktu yang dipilih akan tampil di sini.</p>

            {selectedPoint ? (
              <>
                <div className="mb-4 rounded-lg border p-3 bg-slate-50 dark:bg-[#232526] dark:border-gray-700">
                  <p className="font-semibold text-slate-800 dark:text-gray-100">Rentang Terpilih: {selectedPoint.label}</p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">
                    {selectedPoint.start.toLocaleDateString("id-ID")} - {selectedPoint.end.toLocaleDateString("id-ID")}
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 dark:border-gray-700">
                    <h3 className="font-semibold text-blue-700 mb-3">Data Barang Ditemukan ({selectedPoint.foundItems.length})</h3>
                    {selectedPoint.foundItems.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-gray-400">Tidak ada barang ditemukan pada rentang ini.</p>
                    ) : (
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {selectedPoint.foundItems.map((item) => {
                          const confirmed = item.matchings?.find((match) => match.isConfirmed);
                          const reporterName = confirmed?.lostReport?.name || "-";
                          const reporterEmail = confirmed?.lostReport?.email || "-";
                          const reporterPhone = confirmed?.lostReport?.phone || "-";

                          return (
                            <div key={`found-${item.id}`} className="rounded-md border p-3 bg-white dark:bg-[#232526] dark:border-gray-700">
                              <p className="font-medium text-slate-800 dark:text-gray-100">{item.name}</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">
                                Kategori: {item.category} • Tanggal ditemukan: {formatDate(item.foundDate)}
                              </p>
                              <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">Lokasi: {item.locationFound || "-"}</p>
                              <p className="text-sm text-slate-700 dark:text-gray-300">Pelapor terkait: {reporterName}</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">
                                Email: {reporterEmail} • Telp: {reporterPhone}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border p-4 dark:border-gray-700">
                    <h3 className="font-semibold text-emerald-700 mb-3">Data Barang Dikembalikan ({selectedPoint.returnedItems.length})</h3>
                    {selectedPoint.returnedItems.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-gray-400">Tidak ada barang dikembalikan pada rentang ini.</p>
                    ) : (
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {selectedPoint.returnedItems.map((item) => {
                          const confirmed = item.matchings?.find((match) => match.isConfirmed);
                          const reporterName = confirmed?.lostReport?.name || "-";
                          const receiverName = item.claimedByName || reporterName || "-";

                          return (
                            <div key={`returned-${item.id}`} className="rounded-md border p-3 bg-white dark:bg-[#232526] dark:border-gray-700">
                              <p className="font-medium text-slate-800 dark:text-gray-100">{item.name}</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">Tanggal dikembalikan: {formatDate(item.returnedAt || item.foundDate)}</p>
                              <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">Penerima: {receiverName}</p>
                              <p className="text-sm text-slate-700 dark:text-gray-300">Pelapor terkait: {reporterName}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-gray-400">Belum ada titik yang dipilih.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Statistics;
