"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Harus ada huruf besar")
      .regex(/[0-9]/, "Harus ada angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password harus sama",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Gagal mengubah password");
        return;
      }

      toast.success("Password berhasil diganti");
      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[30px] border border-[#0072CE]/10 bg-white shadow-sm">
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE600]/25 px-3 py-1 text-xs font-medium text-[#0A2540]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Wajib Diisi
                </div>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#0A2540] sm:text-[1.7rem]">
                  Ubah Password
                </h1>

                <p className="mt-1.5 text-sm leading-6 text-[#5C6B7A]">
                  Ganti password Anda sebelum lanjut ke dashboard
                </p>
              </div>

              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0072CE] sm:flex">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0A2540]">
                  Password Baru
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    className="h-11 w-full rounded-xl border border-[#0072CE]/15 bg-white px-4 pr-12 text-sm text-[#0A2540] outline-none transition-all placeholder:text-[#9AA7B4] focus:border-[#0072CE]/40 focus:ring-4 focus:ring-[#0072CE]/10"
                    placeholder="Masukkan password baru"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#9AA7B4] hover:text-[#0072CE]"
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
                ) : (
                  <p className="mt-1.5 text-xs text-[#9AA7B4]">
                    Minimal 8 karakter, ada huruf besar dan angka
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0A2540]">
                  Konfirmasi Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    {...form.register("confirmPassword")}
                    className="h-11 w-full rounded-xl border border-[#0072CE]/15 bg-white px-4 pr-12 text-sm text-[#0A2540] outline-none transition-all placeholder:text-[#9AA7B4] focus:border-[#0072CE]/40 focus:ring-4 focus:ring-[#0072CE]/10"
                    placeholder="Ulangi password baru"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#9AA7B4] hover:text-[#0072CE]"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {form.formState.errors.confirmPassword ? (
                  <p className="mt-1.5 text-sm text-red-500">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0072CE] px-4 font-medium text-white shadow-sm transition-all hover:bg-[#005fab] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Menyimpan..." : "Simpan Password"}
              </button>
            </form>

            <div className="mt-5 flex gap-2.5 rounded-2xl border-l-4 border-[#FFE600] bg-[#0072CE]/[0.04] p-3.5">
              <p className="text-xs leading-5 text-[#5C6B7A]">
                Password baru akan digunakan untuk login selanjutnya. Pastikan
                Anda mengingatnya dengan baik.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-[#9AA7B4]">
          © 2026 PT PLN (Persero) ULP Rivai Palembang
        </div>
      </div>
    </main>
  );
}
