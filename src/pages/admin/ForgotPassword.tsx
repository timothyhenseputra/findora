import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, Key } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email({ message: "Email harus valid" }),
});

const resetSchema = z
  .object({
    token: z.string().min(1, { message: "Token harus diisi" }),
    newPassword: z.string().min(6, { message: "Password minimal 6 karakter" }),
    confirmPassword: z.string().min(6, { message: "Konfirmasi password harus diisi" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [emailSent, setEmailSent] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    try {
      const res = await fetch("http://localhost:8080/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "✉️ Email Terkirim",
          description: "Silakan cek email Anda untuk kode reset password.",
        });
        setEmailSent(true);
        setStep("reset");
      } else {
        toast({
          title: "❌ Gagal",
          description: data.message || "Email tidak terdaftar",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "❌ Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      });
    }
  }

  async function onResetSubmit(values: z.infer<typeof resetSchema>) {
    try {
      const res = await fetch("http://localhost:8080/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailForm.getValues("email"),
          token: values.token,
          newPassword: values.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "✅ Password Berhasil Direset",
          description: "Silakan login menggunakan password baru Anda.",
        });
        setTimeout(() => navigate("/login_admin"), 2000);
      } else {
        toast({
          title: "❌ Gagal",
          description: data.message || "Token tidak valid atau sudah kadaluarsa",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "❌ Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl bg-white/95 backdrop-blur-lg relative z-10">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full blur-lg opacity-60"></div>
              <span className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-600 to-cyan-600 shadow-xl">
                {step === "email" ? <Mail className="w-10 h-10 text-white drop-shadow-lg" /> : <Key className="w-10 h-10 text-white drop-shadow-lg" />}
              </span>
            </div>
          </div>
          <CardTitle className="text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">Findora</CardTitle>
          <CardDescription className="text-lg font-medium text-gray-600">{step === "email" ? "Reset Password" : "Masukkan Kode Reset"}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        <span className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-purple-600" />
                          Email Terdaftar
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Masukkan email admin" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:via-purple-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                >
                  Kirim Kode Reset
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 mb-4 rounded-lg">
                  <p className="text-sm text-purple-800 font-medium">
                    Kode reset telah dikirim ke <strong>{emailForm.getValues("email")}</strong>. Silakan cek email Anda.
                  </p>
                </div>
                <FormField
                  control={resetForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        <span className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-purple-600" />
                          Kode Reset (dari email)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan kode 6 digit" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        <span className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-purple-600" />
                          Password Baru
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Masukkan password baru" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
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
                        <Input type="password" placeholder="Ulangi password baru" {...field} className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:via-purple-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                >
                  Reset Password
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep("email")} className="w-full text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition">
                  ← Kembali
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-gray-600 mt-2 border-t pt-6">
          <button onClick={() => navigate("/login_admin")} className="text-purple-600 hover:text-pink-600 hover:underline font-semibold transition">
            Kembali ke Login
          </button>
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

export default ForgotPassword;
