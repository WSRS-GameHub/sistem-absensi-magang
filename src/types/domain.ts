export type UserRole = "admin" | "tl" | "peserta" | "manager";
export type DivisionType = "PA" | "TE" | "TEKNIK";
export type TaskTargetType = "all" | "division" | "individual";
export type TaskStatus = "pending" | "submitted" | "selesai";
export type NotificationType = "task" | "announcement" | "system";

export type TaskAssignType = "all" | "division" | "individual";

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  nama: string;
  jurusan: string | null;
  instansi: string | null;
  mulai_magang: string | null;
  akhir_magang: string | null;
  role: UserRole;
  division: DivisionType | null;
  first_login: boolean;
  must_change_password: boolean;
  is_active: boolean;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tugas {
  id: string;
  title: string;
  description: string;
  assign_type: TaskAssignType;
  division: DivisionType | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TugasUser {
  id: string;
  tugas_id: string;
  user_id: string;
  status: TaskStatus;
  submitted_at: string | null;
  submitted_note: string | null;
  created_at: string;
  updated_at: string;
}