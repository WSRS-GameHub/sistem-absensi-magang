import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
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
import { EditProfileForm } from "@/components/peserta/edit-profile-form";

type ProfileRow = {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  division: string | null;
  created_at: string;
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

export default async function PesertaEditProfilePage() {
  const user = await requireRole(["peserta"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, nama, username, email, phone, role, division, created_at, is_active, avatar_url"
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
        {/* Header banner — konsisten dengan halaman profile */}
        <section className="relative overflow-hidden rounded-[24px] bg-[#0072CE] p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rotate-12 rounded-[28px] bg-[#FFE600]/90" />
          <div className="pointer-events-none absolute -right-2 top-10 h-20 w-20 rotate-12 rounded-2xl bg-white/10" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFE600] px-3 py-1 text-xs font-bold tracking-wide text-[#0072CE]">
                Edit Profile
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {profile.nama}
              </h1>

              <p className="mt-1 text-sm text-white/80">
                Perbarui email dan nomor telepon akun peserta.
              </p>
            </div>

            <Link
              href="/peserta/profile"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0072CE] shadow-sm transition-all hover:bg-white/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
          {/* Ringkasan data — read only, tanpa foto */}
          <section className="rounded-[22px] border border-[#0072CE]/10 bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0072CE]">
              Data Saat Ini
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
                  <p className="text-xs text-muted-foreground">
                    Username / NIM
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {profile.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.04] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0072CE] text-white">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {profile.email ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.04] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE600] text-[#0A2540]">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Nomor Telepon
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {profile.phone ?? "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl border-l-4 border-[#FFE600] bg-[#0072CE]/[0.04] p-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0072CE] text-white">
                <UserRound className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                Bergabung sejak {formatDate(profile.created_at)}.
              </p>
            </div>
          </section>

          {/* Form update */}
          <section className="rounded-[22px] border border-[#0072CE]/10 bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Update Informasi
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ubah email dan nomor telepon agar data akun tetap terbaru.
                </p>
              </div>
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#0072CE]/10 text-[#0072CE] sm:flex">
                <UserRound className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-[#0072CE]/10 bg-[#0072CE]/[0.03] p-4 sm:p-5">
              <EditProfileForm
                nama={profile.nama}
                email={profile.email ?? ""}
                phone={profile.phone ?? ""}
                avatarUrl={profile.avatar_url}
              />
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}