"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  username: z.string().min(3, "NIM / NISN wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Login gagal");
        return;
      }

      if (result.needsPasswordChange) {
        toast.message("Silakan ubah password terlebih dahulu");
        router.replace("/change-password");
        return;
      }

      toast.success("Login berhasil");

      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-white">
      <div className="grid h-full lg:grid-cols-2">
        {/* LEFT SIDE — putih dominan, aksen biru & kuning */}
        <div className="relative hidden overflow-hidden border-r border-[#0072CE]/10 bg-white lg:flex">
          {/* aksen kuning kecil di pojok */}
          <div className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rotate-12 rounded-[24px] bg-[#FFE600]/80" />
          <div className="pointer-events-none absolute bottom-10 right-0 h-40 w-40 translate-x-1/2 rounded-full bg-[#0072CE]/[0.06]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-8">
            <div>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-[#0072CE]/10 bg-white px-4 py-2.5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0072CE]">
                  <Building2 className="h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-tight text-slate-900">
                    PT PLN (Persero) ULP Rivai
                  </p>
                  <p className="text-xs text-slate-500">
                    Aplikasi Tugas & Absensi Peserta Magang
                  </p>
                </div>
              </div>

              <div className="mt-10 max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#0072CE]/10 bg-[#0072CE]/[0.04] px-3.5 py-1.5 text-xs font-medium text-[#0072CE]">
                  <Sparkles className="h-3.5 w-3.5 text-[#FFE600]" />
                  Sistem Monitoring Peserta Magang
                </div>

                <h1 className="mt-5 text-[2.1rem] font-bold leading-[1.15] tracking-tight text-slate-900">
                  Aplikasi Tugas dan Absensi{" "}
                  <span className="text-[#0072CE]">Peserta Magang</span>{" "}
                  Berbasis Web
                </h1>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  Platform monitoring peserta magang berbasis web pada PT PLN
                  (Persero) ULP Rivai Palembang yang mendukung absensi
                  lokasi, tugas peserta, pengumuman, dan monitoring aktivitas
                  magang.
                </p>
              </div>

              <div className="mt-8 grid gap-3">
                <div className="flex items-start gap-3.5 rounded-2xl border border-[#0072CE]/10 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0072CE]/10">
                    <ShieldCheck className="h-4.5 w-4.5 text-[#0072CE]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                      Login Sistem Magang
                    </h3>
                    <p className="mt-0.5 text-xs leading-6 text-slate-500">
                      Login aman dengan role-based access control dan first
                      login protection.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-2xl border border-[#0072CE]/10 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE600]/20">
                    <Building2 className="h-4.5 w-4.5 text-[#0A2540]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                      Monitoring Aktivitas Magang
                    </h3>
                    <p className="mt-0.5 text-xs leading-6 text-slate-500">
                      Pantau absensi, tugas, dan aktivitas peserta magang
                      dalam satu sistem terintegrasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#0072CE]/10 pt-4 text-xs text-slate-500">
              © 2026 PT PLN (Persero) ULP Rivai Palembang
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex h-full items-center justify-center overflow-hidden bg-white px-6 py-6">
          <div className="w-full max-w-md">
            {/* MOBILE HEADER */}
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0072CE]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                  PT PLN (Persero) ULP Rivai
                </h2>
                <p className="text-xs text-slate-500">
                  Aplikasi peserta magang
                </p>
              </div>
            </div>

            {/* LOGIN CARD */}
            <div className="rounded-[30px] border border-[#0072CE]/10 bg-white shadow-sm">
              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE600]/25 px-3 py-1 text-xs font-medium text-[#0A2540]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure Login
                    </div>

                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.7rem]">
                      Login Peserta Magang
                    </h2>

                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Masuk menggunakan username dan password
                    </p>
                  </div>

                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0072CE] sm:flex">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-900">
                      Username
                    </label>

                    <input
                      {...form.register("username")}
                      className="h-11 w-full rounded-xl border border-[#0072CE]/15 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0072CE]/40 focus:ring-4 focus:ring-[#0072CE]/10"
                      placeholder="Masukkan username"
                    />

                    {form.formState.errors.username ? (
                      <p className="mt-1.5 text-sm text-red-500">
                        {form.formState.errors.username.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-900">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...form.register("password")}
                        className="h-11 w-full rounded-xl border border-[#0072CE]/15 bg-white px-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0072CE]/40 focus:ring-4 focus:ring-[#0072CE]/10"
                        placeholder="Masukkan password"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-[#0072CE]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {form.formState.errors.password ? (
                      <p className="mt-1.5 text-sm text-red-500">
                        {form.formState.errors.password.message}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0072CE] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#005fab] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Memproses..." : "Login"}
                  </button>
                </form>

                <div className="mt-5 flex gap-2.5 rounded-2xl border-l-4 border-[#FFE600] bg-[#0072CE]/[0.04] p-3.5">
                  <p className="text-xs leading-5 text-slate-500">
                    Jika ini pertama kali login, Anda akan diminta mengganti
                    password sebelum masuk ke dashboard sistem.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-slate-500 lg:hidden">
              © 2026 PT PLN (Persero) ULP Rivai Palembang
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
