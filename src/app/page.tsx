import Link from "next/link";
import { ArrowRight, ShieldCheck, ClipboardCheck, Users2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-14 lg:flex-row lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-medium text-primary backdrop-blur">
            Sistem Monitoring Magang Terintegrasi
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Sistem Absensi & Tugas Peserta Magang
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Platform digital untuk monitoring absensi, pengelolaan tugas,
            pengumuman, dan aktivitas peserta magang secara real-time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:opacity-95"
            >
              Masuk ke Sistem
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <div className="rounded-2xl border bg-background px-5 py-3 text-sm text-muted-foreground">
              Next.js • Supabase • shadcn/ui
            </div>
          </div>
        </div>

        <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
              <ClipboardCheck className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Monitoring Absensi
            </h3>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Pantau check-in dan check-out peserta magang dengan sistem
              absensi berbasis lokasi.
            </p>
          </div>

          <div className="rounded-[28px] border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Users2 className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Manajemen Peserta
            </h3>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Kelola data peserta, divisi, serta progress kegiatan magang
              dalam satu dashboard.
            </p>
          </div>

          <div className="rounded-[28px] border bg-card p-6 shadow-sm sm:col-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Sistem Terintegrasi & Aman
            </h3>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Dibangun menggunakan teknologi modern untuk memastikan performa,
              keamanan data, dan pengalaman penggunaan yang optimal.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}