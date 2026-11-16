"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type CourseSearchResult = {
  id: string;
  title: string;
  description: string | null;
};

export async function searchCoursesAction(
  query: string
): Promise<{ results: CourseSearchResult[]; error?: string }> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return { results: [] };

  // Escape PostgREST filter wildcards / separators
  const safe = q.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim();
  if (safe.length < 2) return { results: [] };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .select("id, title, description")
    .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    .order("title", { ascending: true })
    .limit(8);

  if (error) return { results: [], error: error.message };
  return { results: (data ?? []) as CourseSearchResult[] };
}
