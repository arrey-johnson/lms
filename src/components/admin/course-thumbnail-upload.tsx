"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { attachCourseThumbnailAction } from "@/lib/actions/media";
import { Label } from "@/components/ui/label";

export function CourseThumbnailUpload({
  courseId,
  thumbnailUrl,
}: {
  courseId: string;
  thumbnailUrl?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onFileChange(file: File | null) {
    if (!file) return;
    setError("");
    setPending(true);
    setProgress("Uploading thumbnail…");

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${courseId}/course-thumbnail-${Date.now()}.${ext}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("course-videos")
        .upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await attachCourseThumbnailAction({ courseId, path });
      if (result?.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setPending(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3">
      <Label>Course thumbnail</Label>
      {thumbnailUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt="Course thumbnail"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600 transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950">
        <ImageIcon className="h-4 w-4" />
        {thumbnailUrl ? "Replace thumbnail" : "Upload course thumbnail"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={pending}
          onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {progress ? (
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          {progress}
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
