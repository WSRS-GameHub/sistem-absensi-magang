"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import { toast } from "sonner";

import { createPengumumanAdmin } from "@/actions/admin/create-pengumuman";
import { createPengumumanTL } from "@/actions/tl/create-pengumuman";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type RoleType = "admin" | "tl";
type AnnouncementKind = "pengumuman" | "pemberitahuan";

interface CreatePengumumanDialogProps {
  role: RoleType;
}

export function CreatePengumumanDialog({
  role,
}: CreatePengumumanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jenis, setJenis] = useState<AnnouncementKind>("pengumuman");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        jenis,
        tanggalEvent:
          jenis === "pemberitahuan"
            ? String(formData.get("tanggalEvent") ?? "") || null
            : null,
      };

      const result =
        role === "admin"
          ? await createPengumumanAdmin(payload)
          : await createPengumumanTL(payload);

      toast.success(result.message);
      form.reset();
      setJenis("pengumuman");
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan data";

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
        if (!nextOpen) {
          setErrorMessage("");
          setJenis("pengumuman");
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95">
          <Megaphone className="h-4 w-4" />
          Buat
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[30px]">
        <DialogHeader>
          <DialogTitle>Buat Data</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="rounded-3xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Pilih <span className="font-medium">Pengumuman</span> untuk info umum
            atau <span className="font-medium">Pemberitahuan</span> untuk info
            penting seperti libur, tanggal merah, atau perubahan jadwal.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Jenis</label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value as AnnouncementKind)}
              className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            >
              <option value="pengumuman">Pengumuman</option>
              <option value="pemberitahuan">Pemberitahuan</option>
            </select>
          </div>

          {jenis === "pemberitahuan" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Event</label>
              <input
                type="date"
                name="tanggalEvent"
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Judul</label>
            <input
              name="title"
              placeholder="Contoh: Libur Nasional"
              required
              className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Isi</label>
            <textarea
              name="content"
              placeholder="Tulis isi pengumuman atau pemberitahuan"
              required
              rows={7}
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
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
              className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>

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