"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { submitIzin } from "@/actions/peserta/absensi";

interface IzinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const MAX_FILE_SIZE_MB = 5;

export function IzinModal({ open, onClose, onSuccess }: IzinModalProps) {
  const [isPending, startTransition] = useTransition();
  const [keterangan, setKeterangan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const resetForm = () => {
    setKeterangan("");
    setFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (isPending) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError("");

    if (!selected) {
      setFile(null);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (!validTypes.includes(selected.type)) {
      setError("Format file harus JPG, PNG, WEBP, atau PDF.");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB.`);
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (keterangan.trim().length < 5) {
      setError("Keterangan wajib diisi (minimal 5 karakter).");
      return;
    }

    if (!file) {
      setError("File bukti izin wajib diunggah.");
      return;
    }

    const formData = new FormData();
    formData.set("keterangan", keterangan.trim());
    formData.set("file", file);

    startTransition(async () => {
      try {
        const result = await submitIzin(formData);
        toast.success(result.message);
        onSuccess(result.message);
        resetForm();
        onClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal mengajukan izin";
        setError(message);
        toast.error(message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-[22px] border bg-card p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <FileText className="h-3.5 w-3.5" />
              Ajukan Izin
            </div>
            <h3 className="mt-3 text-lg font-semibold">Form Pengajuan Izin</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Isi keterangan dan lampirkan bukti pendukung.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Keterangan
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={4}
              placeholder="Contoh: Sakit demam, tidak bisa hadir ke kantor..."
              className="w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:ring-primary/10"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Bukti (Surat / Foto)
            </label>

            <label
              htmlFor="izin-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors hover:bg-muted/50"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "Klik untuk pilih file"}
              </span>
              <span className="text-xs text-muted-foreground/70">
                JPG, PNG, WEBP, atau PDF — maks {MAX_FILE_SIZE_MB}MB
              </span>
              <input
                ref={fileInputRef}
                id="izin-file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileChange}
                disabled={isPending}
                className="hidden"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border bg-background text-sm font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Izin"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
