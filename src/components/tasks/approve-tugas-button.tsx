"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { approveTugas } from "@/actions/staff/approve-tugas";

interface ApproveTugasButtonProps {
  taskUserId: string;
  taskId: string;
  role: "admin" | "tl";
  disabled?: boolean;
}

export function ApproveTugasButton({
  taskUserId,
  taskId,
  role,
  disabled,
}: ApproveTugasButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);

    try {
      const result = await approveTugas({
        taskUserId,
        taskId,
        role,
      });

      toast.success(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyelesaikan tugas";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={loading || disabled}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 text-sm font-medium text-emerald-600 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <CheckCircle2 className="h-4 w-4" />
      {loading ? "Menyimpan..." : "Selesaikan"}
    </button>
  );
}