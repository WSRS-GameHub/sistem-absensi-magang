import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  Mail,
  Phone,
  ShieldCheck,
  User2,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { pesertaNavigation } from "@/constants/navigation";

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
      "id, nama, username, email, phone, role, division, created_at, is_active"
    )
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const profile = data as ProfileRow;

  return (
    <DashboardLayout navigation={pesertaNavigation}>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Profile Peserta
            </div>
            <p className="text-sm text-muted-foreground sm:text-[15px]">
              Informasi data diri dan akun peserta magang.
            </p>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-24 sm:w-24">
                <User2 className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
                {profile.nama}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Peserta Magang
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600">
                <BadgeCheck className="h-4 w-4" />
                {profile.is_active ? "Peserta Aktif" : "Tidak Aktif"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border bg-muted/20 p-3.5 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Divisi</p>
                    <p className="text-sm font-semibold">
                      {profile.division ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-3.5 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-semibold capitalize">
                      {profile.role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-3.5 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Bergabung Sejak
                    </p>
                    <p className="text-sm font-semibold">
                      {formatDate(profile.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                  Informasi Akun
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Detail akun peserta magang.
                </p>
              </div>

              <Link
                href="/peserta/profile/edit"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User2 className="h-4 w-4" />
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

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
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

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
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

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
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

            <div className="mt-5 rounded-2xl border bg-primary/[0.04] p-4">
              <h4 className="text-sm font-semibold text-primary">Informasi</h4>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
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