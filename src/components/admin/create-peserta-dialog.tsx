"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Download, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { createPeserta } from "@/actions/admin/create-peserta";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  username: z
    .string()
    .min(3, "Username wajib diisi")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username hanya boleh huruf, angka, titik, underscore, dan minus"
    ),
  jurusan: z.string().min(1, "Jurusan wajib diisi"),
  instansi: z.string().min(1, "Instansi wajib diisi"),
  mulaiMagang: z.string().min(1, "Tanggal mulai wajib diisi"),
  akhirMagang: z.string().min(1, "Tanggal akhir wajib diisi"),
  division: z.enum(["PA", "TE", "TEKNIK"]),
});

type FormValues = z.infer<typeof schema>;

type AccountData = {
  nama: string;
  username: string;
  password: string;
  email: string;
  division: "PA" | "TE" | "TEKNIK";
  pdfBytes: number[];
};

export function CreatePesertaDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState<AccountData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama: "",
      username: "",
      jurusan: "",
      instansi: "",
      mulaiMagang: "",
      akhirMagang: "",
      division: "PA",
    },
  });

  async function downloadPdf(bytes: number[], filename: string) {
    const blob = new Blob([new Uint8Array(bytes)], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
      const result = await createPeserta(values);

      const nextAccountData: AccountData = {
        nama: values.nama,
        username: result.data.username,
        password: result.data.password,
        email: result.data.email,
        division: values.division,
        pdfBytes: result.data.pdfBytes,
      };

      setAccountData(nextAccountData);

      toast.success("Akun peserta berhasil dibuat");
      toast.message(
        `Username: ${nextAccountData.username} | Password: ${nextAccountData.password}`
      );

      form.reset({
        nama: "",
        username: "",
        jurusan: "",
        instansi: "",
        mulaiMagang: "",
        akhirMagang: "",
        division: "PA",
      });

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal membuat peserta";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Berhasil disalin");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset({
            nama: "",
            username: "",
            jurusan: "",
            instansi: "",
            mulaiMagang: "",
            akhirMagang: "",
            division: "PA",
          });
          setAccountData(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95">
          <Plus className="h-4 w-4" />
          Tambah Peserta
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[30px]">
        <DialogHeader>
          <DialogTitle>Tambah Peserta Magang</DialogTitle>
          <DialogDescription>
            Username digunakan untuk login peserta. Sistem akan membuat akun
            otomatis dengan password random dan file PDF credential.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama</label>
              <input
                {...form.register("nama")}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                placeholder="Nama peserta"
              />
              {form.formState.errors.nama ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nama.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <input
                {...form.register("username")}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                placeholder="Username login"
              />
              {form.formState.errors.username ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.username.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Jurusan</label>
              <input
                {...form.register("jurusan")}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                placeholder="Jurusan"
              />
              {form.formState.errors.jurusan ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.jurusan.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instansi</label>
              <input
                {...form.register("instansi")}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                placeholder="Instansi"
              />
              {form.formState.errors.instansi ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.instansi.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Divisi</label>
              <select
                {...form.register("division")}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              >
                <option value="PA">PA</option>
                <option value="TE">TE</option>
                <option value="TEKNIK">TEKNIK</option>
              </select>
              {form.formState.errors.division ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.division.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mulai Magang</label>
              <input
                type="date"
                {...form.register("mulaiMagang")}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              />
              {form.formState.errors.mulaiMagang ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.mulaiMagang.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Akhir Magang</label>
              <input
                type="date"
                {...form.register("akhirMagang")}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              />
              {form.formState.errors.akhirMagang ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.akhirMagang.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-medium hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Peserta"}
            </button>
          </div>

          {accountData ? (
            <div className="rounded-[28px] border bg-primary/[0.04] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold">
                    Akun peserta berhasil dibuat
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Username, password, dan PDF credential sudah siap.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadPdf(
                      accountData.pdfBytes,
                      `credential-${accountData.username}.pdf`
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>

              <div className="mt-5 grid gap-3 rounded-3xl border bg-background p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Nama</span>
                  <span className="font-medium">{accountData.nama}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Username</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{accountData.username}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountData.username)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border bg-muted/20 hover:bg-muted"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{accountData.password}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountData.password)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border bg-muted/20 hover:bg-muted"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Email Auth</span>
                  <span className="font-medium break-all">
                    {accountData.email}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}