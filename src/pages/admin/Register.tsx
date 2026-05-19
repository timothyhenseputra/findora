import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Lock, User, LogIn, Home } from "lucide-react";

// Skema validasi untuk register admin
const formSchema = z
  .object({
    name: z.string().min(1, { message: "Nama harus diisi" }),
    email: z.string().email({ message: "Email harus valid" }),
    password: z.string().min(6, { message: "Password minimal 6 karakter" }),
    confirmPassword: z.string().min(1, { message: "Konfirmasi password harus diisi" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

const RegisterAdmin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch("http://localhost:8080/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Registrasi Berhasil",
          description: "Admin berhasil didaftarkan! Mengarahkan ke halaman login...",
        });
        setTimeout(() => {
          navigate("/login_admin");
        }, 2000);
      } else {
        toast({
          title: "Registrasi Gagal",
          description: data.message || "Gagal mendaftar",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Registrasi Gagal",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-cyan-900 p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl bg-white/95 backdrop-blur-lg relative z-10">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-lg opacity-60"></div>
              <span className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 shadow-xl">
                <User className="w-10 h-10 text-white drop-shadow-lg" />
              </span>
            </div>
          </div>
          <CardTitle className="text-4xl font-black bg-gradient-to-r from-cyan-600 via-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">Findora</CardTitle>
          <CardDescription className="text-lg font-medium text-gray-600">Register Admin</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        Nama
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        Email
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Masukkan email" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-600" />
                        Password
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan password" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-600" />
                        Konfirmasi Password
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Ulangi password" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                Register
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-gray-600 mt-4 border-t pt-6 space-y-3">
          <div className="text-center">
            <span>
              Sudah punya akun?
              <button type="button" onClick={() => navigate("/login_admin")} className="text-purple-600 hover:text-cyan-600 hover:underline font-semibold ml-1 transition inline-flex items-center gap-1">
                <LogIn className="w-4 h-4" /> Login di sini
              </button>
            </span>
          </div>
          <div className="w-full text-center border-t pt-3">
            <button type="button" onClick={() => navigate("/")} className="text-gray-500 hover:text-purple-600 hover:underline font-medium flex items-center justify-center gap-1 mx-auto transition">
              <Home className="w-4 h-4" /> Kembali ke Beranda
            </button>
          </div>
        </CardFooter>
      </Card>

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
      `}</style>
    </div>
  );
};

export default RegisterAdmin;
