export type UserRole = "admin" | "student";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  disabled: boolean | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_path: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_path: string | null;
  thumbnail_path: string | null;
  order_index: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  watched_percentage: number;
  last_position: number;
  updated_at: string;
}

export interface CourseWithProgress extends Course {
  module_count: number;
  completed_count: number;
  progress_percent: number;
}

export interface StudentWithProgress extends Profile {
  enrollments: { course_id: string; course_title: string }[];
  completed_modules: number;
  total_modules: number;
}
