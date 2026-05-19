import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, User, Mail as MailIcon, Phone, BookUser, Tag, ChevronRight, Bell, Shield, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { FaSearch, FaBoxOpen, FaUsers } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama harus diisi minimal 2 karakter" }),
  identifier: z.string().min(3, { message: "NIM/ID harus diisi dengan benar" }),
  email: z.string().email({ message: "Email tidak valid" }),
  phone: z.string().min(10, { message: "Nomor telepon harus diisi minimal 10 digit" }),
  category: z.string({ required_error: "Silahkan pilih kategori barang" }),
  lostDate: z.date({ required_error: "Tanggal kehilangan harus diisi" }),
  description: z.string().min(10, { message: "Deskripsi harus diisi minimal 10 karakter" }),
});

const categories = [
  { value: "Elektronik", label: "Elektronik", icon: "📱" },
  { value: "Dokumen", label: "Dokumen", icon: "📄" },
  { value: "Pakaian", label: "Pakaian", icon: "👕" },
  { value: "Aksesoris", label: "Aksesoris", icon: "⌚" },
  { value: "Buku", label: "Buku", icon: "📚" },
  { value: "Lainnya", label: "Lainnya", icon: "📦" },
];

const Index = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [userType, setUserType] = useState<"mahasiswa" | "non-mahasiswa">("mahasiswa");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      identifier: "",
      email: "",
      phone: "",
      category: "",
      lostDate: undefined,
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        name: values.name,
        reporterType: userType === "mahasiswa" ? "Mahasiswa" : "Umum",
        nim: userType === "mahasiswa" ? values.identifier : undefined,
        nonStudentId: userType === "non-mahasiswa" ? values.identifier : undefined,
        email: values.email,
        phone: values.phone,
        category: values.category,
        lostDate: values.lostDate ? values.lostDate.toISOString() : undefined,
        description: values.description,
      };

      const res = await fetch("http://localhost:8080/api/lost-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal mengirim laporan");

      toast({
        title: "✅ Laporan Berhasil Terkirim",
        description: "Anda akan dihubungi jika barang ditemukan.",
      });

      form.reset();
      setShowForm(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast({
        title: "❌ Gagal mengirim laporan",
        description: "Terjadi kesalahan, coba lagi.",
        variant: "destructive",
      });
    }
  }

  if (!showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Premium Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Glowing orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/50 opacity-40"></div>
        </div>

        {/* Navigation - Premium */}
        <nav className="relative z-10 px-6 py-5 flex justify-between items-center backdrop-blur-xl bg-slate-900/30 border-b border-purple-500/20">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg opacity-75 group-hover:opacity-100 transition blur-sm"></div>
              <div className="relative w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <FaBoxOpen className="text-indigo-400 drop-shadow-lg text-2xl" />
                <FaSearch className="absolute text-yellow-400 text-sm" style={{ left: 26, top: 24 }} />
              </div>
            </div>
            <span className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">Findora</span>
          </div>
          <Button
            onClick={() => (window.location.href = "/login_admin")}
            variant="outline"
            className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-500 hover:to-blue-500 border-purple-400/30 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <Shield className="mr-2 h-4 w-4" />
            Admin Portal
          </Button>
        </nav>

        {/* Hero Section - Premium */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="mb-8 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-cyan-500/80 to-purple-500/80 text-white px-6 py-3 text-sm font-semibold backdrop-blur-md border border-cyan-400/30 shadow-lg">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              🚀 Platform Terpercaya #1 Kampus
            </Badge>

            <h1 className="text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl leading-tight">
              Temukan Barang
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Hilang Anda</span>
            </h1>

            <p className="text-xl md:text-2xl text-cyan-100/80 mb-10 max-w-3xl mx-auto leading-relaxed font-light">Sistem pelaporan barang hilang kampus yang modern dengan notifikasi real-time dan pengelolaan data yang aman</p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={() => setShowForm(true)}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-7 px-12 rounded-full shadow-2xl shadow-cyan-500/50 transform hover:scale-110 transition-all duration-300 text-lg"
              >
                📢 Laporkan Kehilangan
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
              <Button
                onClick={() => (window.location.href = "/login_admin")}
                variant="outline"
                size="lg"
                className="border-2 border-cyan-400/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 font-bold py-7 px-12 rounded-full transition-all"
              >
                🔐 Admin Login
              </Button>
            </div>
          </div>

          {/* Premium Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-6xl mx-auto">
            {[
              { icon: FaSearch, color: "from-cyan-500 to-blue-600", title: "Pencarian Cepat", desc: "Matching otomatis dengan teknologi pencarian modern" },
              { icon: Bell, color: "from-purple-500 to-indigo-600", title: "Notifikasi Real-time", desc: "Informasi langsung ke email dengan template profesional" },
              { icon: Shield, color: "from-blue-500 to-purple-600", title: "Data Terenkripsi", desc: "Keamanan tingkat tinggi untuk data pribadi Anda" },
            ].map((feature, i) => (
              <div key={i} className="group">
                <Card className="shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg hover:shadow-3xl hover:shadow-purple-500/20 transition-all duration-500 transform hover:-translate-y-2 hover:border-purple-500/30 border border-slate-700/30">
                  <CardHeader>
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="text-white text-3xl" />
                    </div>
                    <CardTitle className="text-cyan-200 text-2xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-lg leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* About Findora Section */}
          <div className="mt-28 mb-12">
            <h2 className="text-5xl font-black text-center mb-10 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">💡 Tentang Findora</h2>
            <div className="max-w-5xl mx-auto">
              <Card className="shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-purple-500/30">
                <CardContent className="p-8 md:p-12">
                  <div className="space-y-8 text-slate-200">
                    {/* Intro */}
                    <div className="text-center mb-8">
                      <p className="text-xl leading-relaxed text-cyan-100">
                        <span className="font-black text-2xl text-cyan-300">Findora</span> adalah platform digital inovatif yang dirancang khusus untuk mengatasi permasalahan barang hilang di lingkungan kampus.
                      </p>
                    </div>

                    {/* Features Points */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-slate-700/30 rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📝</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-cyan-200 mb-2">Pelaporan Mudah</h3>
                            <p className="text-sm leading-relaxed text-slate-300">Mahasiswa dan staff dapat melaporkan barang hilang dengan cepat melalui formulir online yang terstruktur dan user-friendly.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🔒</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-purple-200 mb-2">Database Aman</h3>
                            <p className="text-sm leading-relaxed text-slate-300">Setiap laporan tersimpan dengan aman dalam database terenkripsi dan secara otomatis dicocokkan dengan barang temuan.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">✉️</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-blue-200 mb-2">Notifikasi Otomatis</h3>
                            <p className="text-sm leading-relaxed text-slate-300">Sistem mengirimkan email notifikasi secara otomatis kepada pelapor ketika ada kecocokan dengan barang yang ditemukan.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-xl p-6 border border-indigo-500/20 hover:border-indigo-500/40 transition">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">✅</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-indigo-200 mb-2">Transparan & Cepat</h3>
                            <p className="text-sm leading-relaxed text-slate-300">Proses yang transparan memastikan tidak ada barang yang terlewat dan pemilik dapat segera dihubungi.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visi */}
                    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-2 border-purple-500/40 rounded-xl p-8 mt-8">
                      <h3 className="font-black text-xl text-purple-200 mb-4 flex items-center gap-2">🎯 Visi Kami</h3>
                      <p className="text-base leading-relaxed text-slate-200">
                        Menciptakan ekosistem kampus yang <span className="font-bold text-cyan-300">lebih tertib dan saling membantu</span>, di mana kehilangan barang bukan lagi menjadi masalah yang merepotkan. Dengan Findora, kami
                        berkomitmen untuk <span className="font-bold text-purple-300">mengembalikan setiap barang kepada pemiliknya</span> dengan cara yang transparan, cepat, dan terpercaya.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How It Works - Premium */}
          <div className="mt-32 mb-20">
            <h2 className="text-5xl font-black text-center mb-4 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">🎯 Proses Sederhana</h2>
            <p className="text-slate-300 mb-16 text-center text-lg">Dapatkan barang hilang Anda dalam 3 langkah mudah</p>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { num: 1, icon: "📝", title: "Laporkan Barang", desc: "Isi form detail dengan informasi akurat", color: "from-cyan-500 to-blue-600" },
                { num: 2, icon: "🔍", title: "Sistem Mencari", desc: "Sistem otomatis mencocokkan dengan database", color: "from-purple-500 to-indigo-600" },
                { num: 3, icon: "✉️", title: "Terima Notifikasi", desc: "Email instan saat barang ditemukan", color: "from-blue-500 to-purple-600" },
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -top-6 -left-6 w-14 h-14 bg-gradient-to-r ${step.color} text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg`}>{step.num}</div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/30 hover:border-purple-500/30 transition-all pt-12 shadow-lg">
                    <div className="text-5xl mb-4">{step.icon}</div>
                    <h3 className="font-bold text-xl text-cyan-200 mb-3">{step.title}</h3>
                    <p className="text-slate-300">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Premium */}
        <footer className="relative z-10 bg-gradient-to-r from-slate-900/80 to-slate-900/80 backdrop-blur-xl border-t border-purple-500/20 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8">
              <p className="font-black text-2xl bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent mb-2">Findora</p>
              <p className="text-slate-400">Sistem Pengelolaan Barang Hilang Kampus yang Modern</p>
            </div>
            <div className="border-t border-slate-700/30 pt-5 text-center text-slate-400 text-sm">
              <p>© 2025 Findora. Semua hak dilindungi. | Powered by React, Express, PostgreSQL & Tailwind CSS</p>
            </div>
          </div>
        </footer>

        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animate-fade-in {
            animation: fadeIn 1s ease-in;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Form Section
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setShowForm(false)} className="mb-6 text-indigo-600 hover:text-indigo-800">
          ← Kembali ke Halaman Utama
        </Button>
        {/* Hero Icon Animasi */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="relative">
            <FaBoxOpen className="text-indigo-500 drop-shadow-lg" size={64} />
            <FaSearch className="absolute text-yellow-400 animate-bounce" size={32} style={{ left: 40, top: 30 }} />
          </div>
          <h1 className="text-5xl font-extrabold text-indigo-700 mb-2 drop-shadow mt-4">Findora</h1>
          <p className="text-lg text-gray-600 font-medium">Platform Laporan Barang Hilang Kampus</p>
        </div>

        <Card className="shadow-2xl border-0 rounded-2xl bg-white/90 backdrop-blur-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-indigo-700 font-bold flex items-center gap-2">
              <Tag className="w-6 h-6 text-indigo-500" /> Formulir Laporan Barang Hilang
            </CardTitle>
            <CardDescription className="text-gray-600">Isi formulir berikut dengan lengkap dan jelas agar peluang barang Anda ditemukan semakin besar.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Toggle Mahasiswa / Non-Mahasiswa */}
            <div className="mb-6">
              <Tabs value={userType} onValueChange={(val) => setUserType(val as "mahasiswa" | "non-mahasiswa")}>
                <TabsList className="grid w-full grid-cols-2 bg-indigo-100">
                  <TabsTrigger value="mahasiswa" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                    <User className="w-4 h-4 mr-2" />
                    Mahasiswa
                  </TabsTrigger>
                  <TabsTrigger value="non-mahasiswa" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                    <FaUsers className="w-4 h-4 mr-2" />
                    Non-Mahasiswa
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                            <Input placeholder="Masukkan nama lengkap" {...field} className="pl-10 focus:ring-2 focus:ring-indigo-300" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{userType === "mahasiswa" ? "NIM" : "ID Non-Mahasiswa"}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <BookUser className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                            <Input placeholder={userType === "mahasiswa" ? "Masukkan NIM" : "Masukkan ID (KTP/SIM/dll)"} {...field} className="pl-10 focus:ring-2 focus:ring-indigo-300" />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">{userType === "non-mahasiswa" && "Misal: KTP, SIM, atau ID lainnya"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MailIcon className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                            <Input placeholder="contoh@email.com" type="email" {...field} className="pl-10 focus:ring-2 focus:ring-indigo-300" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Telepon</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                            <Input placeholder="08xxxxxxxxxx" {...field} className="pl-10 focus:ring-2 focus:ring-indigo-300" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori Barang</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-2 focus:ring-indigo-300">
                              <SelectValue placeholder="Pilih kategori barang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <span className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lostDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Kehilangan</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal w-full flex justify-between items-center focus:ring-2 focus:ring-indigo-300", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Detail Barang</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Berikan deskripsi lengkap tentang barang Anda (warna, ciri-ciri, lokasi kehilangan, dsb)" className="min-h-[120px] focus:ring-2 focus:ring-indigo-300" {...field} />
                      </FormControl>
                      <FormDescription>Semakin lengkap deskripsi, semakin besar kemungkinan barang Anda ditemukan.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 text-lg shadow-lg">
                  Kirim Laporan
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center text-sm text-gray-500 mt-2 border-t pt-6">
            <span>Findora © 2025 — Sistem Pengelolaan Barang Hilang Kampus</span>
            <span className="mt-1 text-xs text-gray-400">Powered by React & Shadcn UI</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
