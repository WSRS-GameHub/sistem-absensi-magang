"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updatePesertaProfile } from "@/actions/peserta/update-profile";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid").or(z.literal("")),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type EditProfileFormProps = {
  nama: string;
  email: string;
  phone: string;
};

export function EditProfileForm({
  nama,
  email,
  phone,
}: EditProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama,
      email,
      phone,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
      const result = await updatePesertaProfile({
        nama: values.nama,
        email: values.email,
        phone: values.phone ?? "",
      });

      toast.success(result.message);
      router.refresh();
      router.push("/peserta/profile");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">Nama Lengkap</label>
        <input
          {...form.register("nama")}
          className="h-11 w-full rounded-2xl border bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
          placeholder="Nama lengkap"
        />
        {form.formState.errors.nama ? (
          <p className="mt-2 text-sm text-red-500">
            {form.formState.errors.nama.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <input
          {...form.register("email")}
          className="h-11 w-full rounded-2xl border bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
          placeholder="contoh@email.com"
        />
        {form.formState.errors.email ? (
          <p className="mt-2 text-sm text-red-500">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Nomor Telepon
        </label>
        <input
          {...form.register("phone")}
          className="h-11 w-full rounded-2xl border bg-background px-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
          placeholder="08xxxxxxxxxx"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}