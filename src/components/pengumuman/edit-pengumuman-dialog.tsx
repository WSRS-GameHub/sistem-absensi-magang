"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updatePengumumanAdmin } from "@/actions/admin/update-pengumuman";
import { updatePengumumanTL } from "@/actions/tl/update-pengumuman";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type RoleType = "admin" | "tl";
type AnnouncementKind = "pengumuman" | "pemberitahuan";

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  jenis: AnnouncementKind;
  tanggal_event: string | null;
  created_at: string;
};

interface EditPengumumanDialogProps {
  role: RoleType;
  announcement: AnnouncementRow;
}

export function EditPengumumanDialog({
  role,
  announcement,
}: EditPengumumanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jenis, setJenis] = useState<AnnouncementKind>(
    announcement.jenis ?? "pengumuman"
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        id: announcement.id,
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
          ? await updatePengumumanAdmin(payload)
          : await updatePengumumanTL(payload);

      toast.success(result.message);
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui data";

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
          setJenis(announcement.jenis ?? "pengumuman");
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 text-sm font-medium text-blue-600 hover:bg-blue-500/15">
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[30px]">
        <DialogHeader>
          <DialogTitle>Edit Data</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
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
                defaultValue={announcement.tanggal_event ?? ""}
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Judul</label>
            <input
              name="title"
              defaultValue={announcement.title}
              placeholder="Judul"
              required
              className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Isi</label>
            <textarea
              name="content"
              defaultValue={announcement.content}
              placeholder="Isi"
              required
              rows={8}
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-medium hover:bg-muted"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
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