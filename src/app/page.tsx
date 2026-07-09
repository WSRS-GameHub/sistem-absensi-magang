"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Eye, GraduationCap } from "lucide-react";

const roles = [
  {
    key: "admin",
    label: "Administrator",
    desc: "Kelola data pengguna & seluruh sistem magang",
    icon: ShieldCheck,
  },
  {
    key: "team-leader",
    label: "Team Leader",
    desc: "Bimbing & pantau peserta di divisi Anda",
    icon: Users,
  },
  {
    key: "manager",
    label: "Manager",
    desc: "Monitoring aktivitas magang secara keseluruhan",
    icon: Eye,
  },
  {
    key: "peserta",
    label: "Peserta Magang",
    desc: "Absensi harian & pengumpulan tugas",
    icon: GraduationCap,
  },
];

export default function SelectRolePage() {
  const router = useRouter();

  const handleSelect = (roleKey: string) => {
    router.push(`/login?role=${roleKey}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A2540]">
      {/* Aksen dekoratif */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0072CE]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[#FFE600]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#0072CE]/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col items-center px-6 py-14 sm:py-20">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2.5 shadow-lg">
            <img
              src="/pln.png"
              alt="Logo PLN"
              className="h-full w-full object-contain"
            />
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-[#FFE600]">
            PT PLN (Persero) ULP Rivai Palembang
          </p>

          <h1 className="mt-3 max-w-xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            Aplikasi Tugas dan Absensi Peserta Magang
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
            Silakan pilih peran Anda untuk melanjutkan ke halaman login
          </p>
        </div>

        {/* ROLE GRID */}
        <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map(({ key, label, desc, icon: Icon }, i) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl bg-white/[0.06] p-5 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.1]"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="absolute right-4 top-4 text-4xl font-bold text-white/[0.06] transition-colors group-hover:text-[#FFE600]/10">
                0{i + 1}
              </span>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0072CE] shadow-md transition-transform group-hover:scale-105">
                <Icon className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-base font-semibold text-white">{label}</p>
                <p className="mt-1.5 text-xs leading-5 text-white/50">
                  {desc}
                </p>
              </div>

              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#FFE600] opacity-0 transition-opacity group-hover:opacity-100">
                Masuk →
              </span>
            </button>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-auto pt-14 text-center text-xs text-white/30">
          © 2026 PT PLN (Persero) ULP Rivai Palembang
        </div>
      </div>
    </main>
  );
}
