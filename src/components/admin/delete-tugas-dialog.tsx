"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteTugas } from "@/actions/admin/delete-tugas";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteTugasDialogProps {
  id: string;
  title: string;
}

export function DeleteTugasDialog({ id, title }: DeleteTugasDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);

    try {
      const result = await deleteTugas(id);
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus tugas";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-medium text-red-600 hover:bg-red-500/15">
          <Trash2 className="h-4 w-4" />
          Hapus
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-[30px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus tugas?</AlertDialogTitle>
          <AlertDialogDescription>
            Tugas <strong>{title}</strong> akan dihapus beserta relasinya ke peserta. Aksi ini tidak bisa dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? "Menghapus..." : "Ya, hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}