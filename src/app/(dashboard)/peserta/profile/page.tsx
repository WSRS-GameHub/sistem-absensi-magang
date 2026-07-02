import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { pesertaNavigation } from "@/constants/navigation";

type ProfileRow = {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  division: string | null;
  mulai_magang: string;
  is_active: boolean;
  avatar_url: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function PesertaProfilePage() {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, nama, username, email, phone, role, division, mulai_magang, is_active, avatar_url"
    )
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const profile = data as ProfileRow;

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-5">
        {/* Header banner — identitas utama, sekarang dengan foto */}
        <section className="relative overflow-hidden rounded-[24px] bg-[#0072CE] p-5 shadow-sm sm:p-7">
          {/* aksen kuning diagonal */}
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rotate-12 rounded-[28px] bg-[#FFE600]/90" />
          <div className="pointer-events-none absolute -right-2 top-10 h-20 w-20 rotate-12 rounded-2xl bg-white/10" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Foto profil */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/15 shadow-sm sm:h-20 sm:w-20">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={`Foto profil ${profile.nama}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-7 w-7 text-white sm:h-9 sm:w-9" />
                )}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  Profile Peserta
                </div>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {profile.nama}
                </h1>

                <p className="mt-1 text-sm text-white/80">
                  Peserta Magang &middot;{" "}
                  {profile.division ?? "Belum ada divisi"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  profile.is_active
                    ? "bg-[#FFE600] text-[#0A2540]"
                    : "bg-white/15 text-white"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    profile.is_active ? "bg-[#0A2540]" : "bg-white/60"
                  }`}
                />
                {profile.is_active ? "Aktif" : "Tidak Aktif"}
              </span>

              <Link
                href="/peserta/profile/edit"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0072CE] shadow-sm transition-all hover:bg-white/90"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          {/* Ringkasan keanggotaan */}
          <section className="rounded-[22px] border border-[#0072CE]/10 bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0072CE]">
              Ringkasan
            </h3>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.04] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0072CE] text-white">
                  <BriefcaseBusiness className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Divisi</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {profile.division ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.04] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE600] text-[#0A2540]">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="truncate text-sm font-semibold capitalize text-foreground">
                    {profile.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.04] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A2540] text-white">
                  <CalendarDays className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Bergabung Sejak
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {formatDate(profile.mulai_magang)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Informasi akun */}
          <section className="rounded-[22px] border border-[#0072CE]/10 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Informasi Akun
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Detail akun peserta magang.
                </p>
              </div>
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#0072CE]/10 text-[#0072CE] sm:flex">
                <UserRound className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:border-[#0072CE]/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0072CE]/10 text-[#0072CE]">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Nama Lengkap
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {profile.nama}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:border-[#0072CE]/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0072CE]/10 text-[#0072CE]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Username / NIM
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {profile.username}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:border-[#0072CE]/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0072CE]/10 text-[#0072CE]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {profile.email ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:border-[#0072CE]/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0072CE]/10 text-[#0072CE]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Nomor Telepon
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {profile.phone ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl border-l-4 border-[#FFE600] bg-[#0072CE]/[0.04] p-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0072CE] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                Halaman ini menampilkan informasi akun peserta magang pada
                Aplikasi Tugas dan Absensi Peserta Magang Berbasis Web pada PT
                PLN (Persero) ULP Rivai Palembang.
              </p>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}