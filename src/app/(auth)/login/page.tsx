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
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden border-r bg-background lg:flex">
          <div className="flex w-full flex-col justify-between p-10">
            <div>
              <div className="inline-flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-tight">
                    PT PLN (Persero) ULP Rivai
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Aplikasi Tugas & Absensi Peserta Magang
                  </p>
                </div>
              </div>

              <div className="mt-16 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-medium shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Sistem Monitoring Peserta Magang
                </div>

                <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight">
                  Aplikasi Tugas dan Absensi Peserta Magang Berbasis Web
                </h1>

                <p className="mt-6 text-base leading-8 text-muted-foreground">
                  Platform monitoring peserta magang berbasis web pada
                  PT PLN (Persero) ULP Rivai Palembang yang mendukung
                  absensi lokasi, tugas peserta, pengumuman, dan monitoring aktivitas magang.
                </p>
              </div>

              <div className="mt-12 grid gap-4">
                <div className="flex items-start gap-4 rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-semibold tracking-tight">
                      Login Sistem Magang
                    </h3>

                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      Login aman dengan role-based access control dan first login protection.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-semibold tracking-tight">
                      Monitoring Aktivitas Magang
                    </h3>

                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      Pantau absensi, tugas, dan aktivitas peserta magang dalam satu sistem terintegrasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 text-sm text-muted-foreground">
              © 2026 PT PLN (Persero) ULP Rivai Palembang
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {/* MOBILE HEADER */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h2 className="font-semibold tracking-tight">
                  PT PLN (Persero) ULP Rivai
                </h2>

                <p className="text-xs text-muted-foreground">
                  Aplikasi peserta magang
                </p>
              </div>
            </div>

            {/* LOGIN CARD */}
            <div className="rounded-[36px] border bg-card shadow-sm">
              <div className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Secure Login
                    </div>

                    <h2 className="mt-4 text-3xl font-bold tracking-tight">
                      Login Peserta Magang
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Masuk menggunakan username dan password
                    </p>
                  </div>

                  <div className="hidden h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 sm:flex">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-8 space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Username
                    </label>

                    <input
                      {...form.register("username")}
                      className="h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                      placeholder="Masukkan username"
                    />

                    {form.formState.errors.username ? (
                      <p className="mt-2 text-sm text-red-500">
                        {form.formState.errors.username.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...form.register("password")}
                        className="h-12 w-full rounded-2xl border bg-background px-4 pr-12 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                        placeholder="Masukkan password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {form.formState.errors.password ? (
                      <p className="mt-2 text-sm text-red-500">
                        {form.formState.errors.password.message}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Memproses..." : "Login"}
                  </button>
                </form>

                <div className="mt-8 rounded-3xl border bg-muted/30 p-4">
                  <p className="text-xs leading-6 text-muted-foreground">
                    Jika ini pertama kali login, Anda akan diminta mengganti
                    password sebelum masuk ke dashboard sistem.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
              © 2026 PT PLN (Persero) ULP Rivai Palembang
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}