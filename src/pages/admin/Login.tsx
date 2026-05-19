import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Lock, User } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Email harus valid" }),
  password: z.string().min(1, { message: "Password harus diisi" }),
});

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch("http://localhost:8080/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        // Simpan token ke localStorage agar fitur admin berjalan
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        // Simpan nama admin untuk welcome message
        const adminName = data.admin?.name || data.name || "Admin";
        sessionStorage.setItem("adminName", adminName);
        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${adminName}!`,
        });
        sessionStorage.setItem("adminLoggedIn", "true");
        navigate("/admin/dashboard");
      } else {
        toast({
          title: "Login Gagal",
          description: data.message || "Email atau password salah",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Login Gagal",
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
                <Lock className="w-10 h-10 text-white drop-shadow-lg" />
              </span>
            </div>
          </div>
          <CardTitle className="text-4xl font-black bg-gradient-to-r from-cyan-600 via-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">Findora</CardTitle>
          <CardDescription className="text-lg font-medium text-gray-600">Login Admin</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="text-right">
                <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-purple-600 hover:text-pink-600 hover:underline font-medium transition">
                  Lupa Password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-gray-600 mt-2 border-t pt-6">
          <div>
            <span className="text-gray-600">
              Belum punya akun?
              <button type="button" onClick={() => navigate("/register_admin")} className="text-purple-600 hover:text-cyan-600 hover:underline font-semibold ml-1 transition">
                Daftar di sini
              </button>
            </span>
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

export default Login;
