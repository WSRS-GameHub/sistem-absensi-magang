"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updatePeserta } from "@/actions/admin/update-peserta";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Peserta = {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  jurusan: string | null;
  instansi: string | null;
  division: "PA" | "TE" | "TEKNIK" | null;
  mulai_magang: string | null;
  akhir_magang: string | null;
};

interface EditPesertaDialogProps {
  peserta: Peserta;
}

export function EditPesertaDialog({ peserta }: EditPesertaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData(event.currentTarget);

      await updatePeserta({
        id: peserta.id,
        nama: String(formData.get("nama") ?? ""),
        username: String(formData.get("username") ?? ""),
        email: String(formData.get("email") ?? ""),
        jurusan: String(formData.get("jurusan") ?? ""),
        instansi: String(formData.get("instansi") ?? ""),
        division: formData.get("division") as "PA" | "TE" | "TEKNIK",
        mulai_magang: String(formData.get("mulai_magang") ?? ""),
        akhir_magang: String(formData.get("akhir_magang") ?? ""),
      });

      toast.success("Data peserta berhasil diupdate");
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengupdate peserta";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setErrorMessage("");
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border bg-background px-4 text-sm font-medium hover:bg-muted">
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Peserta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="nama"
              defaultValue={peserta.nama}
              placeholder="Nama lengkap"
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />

            <input
              name="username"
              defaultValue={peserta.username}
              placeholder="NIM / NISN"
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="email"
              type="email"
              defaultValue={peserta.email ?? ""}
              placeholder="Email peserta"
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />

            <input
              name="jurusan"
              defaultValue={peserta.jurusan ?? ""}
              placeholder="Jurusan"
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="instansi"
              defaultValue={peserta.instansi ?? ""}
              placeholder="Instansi"
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />

            <select
              name="division"
              defaultValue={peserta.division ?? ""}
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            >
              <option value="" disabled>
                Pilih Divisi
              </option>
              <option value="PA">PA</option>
              <option value="TE">TE</option>
              <option value="TEKNIK">TEKNIK</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="date"
              name="mulai_magang"
              defaultValue={peserta.mulai_magang ?? ""}
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />

            <input
              type="date"
              name="akhir_magang"
              defaultValue={peserta.akhir_magang ?? ""}
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}