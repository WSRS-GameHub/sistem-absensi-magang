"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateTugas } from "@/actions/admin/update-tugas";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  target_type: "all" | "division" | "individual";
  target_division: "PA" | "TE" | "TEKNIK" | null;
  due_date: string | null;
};

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function getTargetLabel(task: TaskRow) {
  if (task.target_type === "all") return "Semua Peserta";
  if (task.target_type === "division") return `Divisi ${task.target_division ?? "-"}`;
  return "Individu";
}

interface EditTugasDialogProps {
  task: TaskRow;
}

export function EditTugasDialog({ task }: EditTugasDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData(form);

      const result = await updateTugas({
        id: task.id,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        dueDate: String(formData.get("dueDate") ?? "") || null,
      });

      toast.success(result.message);
      form.reset();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui tugas";

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
          <DialogTitle>Edit Tugas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="rounded-3xl border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Target Tugas
            </p>
            <p className="mt-2 text-sm font-medium">{getTargetLabel(task)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target peserta tidak diubah dari sini. Jika ingin mengubah target, hapus lalu buat ulang tugas.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="title"
              defaultValue={task.title}
              placeholder="Judul tugas"
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />

            <input
              type="date"
              name="dueDate"
              defaultValue={toDateInputValue(task.due_date)}
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <textarea
            name="description"
            defaultValue={task.description ?? ""}
            placeholder="Deskripsi tugas"
            required
            rows={6}
            className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
          />

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