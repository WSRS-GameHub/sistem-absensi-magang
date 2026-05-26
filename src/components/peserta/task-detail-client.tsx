"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, CircleCheckBig, Play, Send } from "lucide-react";
import { toast } from "sonner";

import { startTugas } from "@/actions/peserta/start-tugas";
import { submitTugas } from "@/actions/peserta/submit-tugas";

type TaskStatus = "pending" | "in_progress" | "submitted" | "selesai";

interface TaskDetailClientProps {
  taskId: string;
  taskTitle: string;
  status: TaskStatus;
  dueDate: string | null;
  submittedAt: string | null;
  selesaiAt: string | null;
  submissionText: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: TaskStatus) {
  if (status === "in_progress") return "bg-blue-500/10 text-blue-600";
  if (status === "submitted") return "bg-violet-500/10 text-violet-600";
  if (status === "selesai") return "bg-emerald-500/10 text-emerald-600";
  return "bg-amber-500/10 text-amber-600";
}

function getStatusLabel(status: TaskStatus) {
  if (status === "in_progress") return "Sedang Dikerjakan";
  if (status === "submitted") return "Sudah Dikirim";
  if (status === "selesai") return "Selesai";
  return "Belum Dimulai";
}

export function TaskDetailClient({
  taskId,
  taskTitle,
  status,
  dueDate,
  submittedAt,
  selesaiAt,
  submissionText,
}: TaskDetailClientProps) {
  const router = useRouter();
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [note, setNote] = useState(submissionText ?? "");

  async function handleStart() {
    setLoadingStart(true);

    try {
      const result = await startTugas(taskId);
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memulai tugas";
      toast.error(message);
    } finally {
      setLoadingStart(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoadingSubmit(true);

    try {
      const result = await submitTugas({
        taskId,
        submissionText: note,
      });

      toast.success(result.message);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim tugas";
      toast.error(message);
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Status Tugas
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {taskTitle}
            </h2>
          </div>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
              status
            )}`}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className="mt-1 text-sm font-medium">{formatDate(dueDate)}</p>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Dikirim</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateTime(submittedAt)}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Selesai</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateTime(selesaiAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border bg-card p-6 shadow-sm">
        {status === "pending" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Belum Dimulai</h3>
                <p className="text-sm text-muted-foreground">
                  Klik tombol di bawah untuk menandai tugas sedang dikerjakan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={loadingStart}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {loadingStart ? "Memproses..." : "Mulai Kerjakan"}
            </button>
          </div>
        ) : status === "in_progress" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
                <CircleCheckBig className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Sedang Dikerjakan</h3>
                <p className="text-sm text-muted-foreground">
                  Isi catatan lalu kirim tugas ketika sudah selesai.
                </p>
              </div>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              placeholder="Tulis catatan singkat, progress, atau hasil pekerjaan..."
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />

            <button
              type="submit"
              disabled={loadingSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {loadingSubmit ? "Mengirim..." : "Submit Tugas"}
            </button>
          </form>
        ) : status === "submitted" ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-violet-500/10 p-4 text-violet-600">
              Tugas sudah dikirim dan menunggu pengecekan.
            </div>

            {submissionText ? (
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Catatan Submit
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7">
                  {submissionText}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-600">
            Tugas sudah selesai.
          </div>
        )}
      </div>
    </div>
  );
}