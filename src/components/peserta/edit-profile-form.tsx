"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserRound } from "lucide-react";

import { updatePesertaProfile } from "@/actions/peserta/update-profile";
import { updatePesertaAvatar } from "@/actions/peserta/update-avatar";

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
  avatarUrl?: string | null;
};

export function EditProfileForm({
  nama,
  email,
  phone,
  avatarUrl,
}: EditProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // State khusus untuk foto profil, terpisah dari form nama/email/phone
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleUploadAvatar() {
    if (!selectedFile) {
      toast.error("Pilih foto terlebih dahulu.");
      return;
    }

    setAvatarLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const result = await updatePesertaAvatar(formData);

      toast.success(result.message);
      setSelectedFile(null);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengunggah foto";
      toast.error(message);
    } finally {
      setAvatarLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload Foto Profil — terpisah dari form nama/email/phone */}
      <div>
        <label className="mb-2 block text-sm font-medium">Foto Profil</label>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview foto profil"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            <button
              type="button"
              onClick={handleUploadAvatar}
              disabled={avatarLoading || !selectedFile}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {avatarLoading ? "Mengunggah..." : "Unggah Foto"}
            </button>
          </div>
        </div>
      </div>

      {/* Form nama / email / phone — tidak diubah dari versi sebelumnya */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Nama Lengkap
          </label>
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
    </div>
  );
}