"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deletePengumumanAdmin } from "@/actions/admin/delete-pengumuman";
import { deletePengumumanTL } from "@/actions/tl/delete-pengumuman";

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

type RoleType = "admin" | "tl";

interface DeletePengumumanDialogProps {
  role: RoleType;
  id: string;
  title: string;
}

export function DeletePengumumanDialog({
  role,
  id,
  title,
}: DeletePengumumanDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    try {
      const result =
        role === "admin"
          ? await deletePengumumanAdmin(id)
          : await deletePengumumanTL(id);

      toast.success(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus pengumuman";

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
          <AlertDialogTitle>Hapus pengumuman?</AlertDialogTitle>
          <AlertDialogDescription>
            Pengumuman <strong>{title}</strong> akan dihapus permanen dan tidak
            bisa dikembalikan.
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