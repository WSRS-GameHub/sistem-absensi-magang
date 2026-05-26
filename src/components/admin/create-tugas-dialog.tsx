"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { createTugas } from "@/actions/admin/create-tugas";
import type { DivisionType } from "@/types/domain";
import type { TaskTargetUser } from "@/lib/tasks/get-task-target-users";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateTugasDialogProps {
  participants: TaskTargetUser[];
}

export function CreateTugasDialog({ participants }: CreateTugasDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [targetType, setTargetType] = useState<
    "all" | "division" | "individual"
  >("all");
  const [targetDivision, setTargetDivision] =
    useState<DivisionType>("PA");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    []
  );

  const selectedCount = useMemo(() => {
    if (targetType === "all") {
      return participants.length;
    }

    if (targetType === "division") {
      return participants.filter(
        (item) => item.division === targetDivision
      ).length;
    }

    return selectedUserIds.length;
  }, [participants, selectedUserIds, targetDivision, targetType]);

  const filteredParticipants = useMemo(() => {
    if (targetType === "division") {
      return participants.filter(
        (item) => item.division === targetDivision
      );
    }

    return participants;
  }, [participants, targetDivision, targetType]);

  function toggleSelectedUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  function resetForm() {
    setErrorMessage("");
    setTargetType("all");
    setTargetDivision("PA");
    setSelectedUserIds([]);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;

    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData(form);

      const result = await createTugas({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        targetType,
        targetDivision:
          targetType === "division" ? targetDivision : null,
        dueDate: String(formData.get("dueDate") ?? "") || null,
        selectedUserIds:
          targetType === "individual" ? selectedUserIds : [],
      });

      toast.success(result.message);
      form.reset();
      resetForm();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal membuat tugas";

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
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-95">
          <Plus className="h-4 w-4" />
          Buat Tugas
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[30px]">
        <DialogHeader>
          <DialogTitle>Buat Tugas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="title"
              placeholder="Judul tugas"
              required
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />

            <input
              type="date"
              name="dueDate"
              className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <textarea
            name="description"
            placeholder="Deskripsi tugas"
            required
            rows={5}
            className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Target Tugas
              </label>

              <select
                value={targetType}
                onChange={(e) =>
                  setTargetType(
                    e.target.value as
                      | "all"
                      | "division"
                      | "individual"
                  )
                }
                className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              >
                <option value="all">Semua Peserta</option>
                <option value="division">Per Divisi</option>
                <option value="individual">Individu</option>
              </select>
            </div>

            {targetType === "division" ? (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Divisi
                </label>

                <select
                  value={targetDivision}
                  onChange={(e) =>
                    setTargetDivision(e.target.value as DivisionType)
                  }
                  className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                >
                  <option value="PA">PA</option>
                  <option value="TE">TE</option>
                  <option value="TEKNIK">TEKNIK</option>
                </select>
              </div>
            ) : (
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                Target peserta:{" "}
                <span className="font-medium text-foreground">
                  {selectedCount}
                </span>
              </div>
            )}
          </div>

          {targetType === "individual" ? (
            <div className="rounded-3xl border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Pilih peserta</p>
                  <p className="text-xs text-muted-foreground">
                    Hanya peserta aktif yang bisa dipilih.
                  </p>
                </div>

                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {selectedUserIds.length} dipilih
                </div>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((item) => {
                    const checked = selectedUserIds.includes(item.id);

                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border bg-background px-4 py-3 transition-all hover:border-primary/30"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.username} • {item.division ?? "-"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              checked
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {checked ? "Dipilih" : "Pilih"}
                          </span>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectedUser(item.id)}
                            className="h-4 w-4 rounded border-border"
                          />
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                    Tidak ada peserta aktif.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {targetType === "division" ? (
            <div className="rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground">
              Target peserta dalam divisi{" "}
              <span className="font-medium text-foreground">
                {targetDivision}
              </span>
              :{" "}
              <span className="font-medium text-foreground">
                {selectedCount}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
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
              {loading ? "Menyimpan..." : "Simpan Tugas"}
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