"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { attachModuleVideoAction } from "@/lib/actions/media";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ModuleUpload({
  moduleId,
  courseId,
  hasVideo,
}: {
  moduleId: string;
  courseId: string;
  hasVideo: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onFileChange(file: File | null) {
    if (!file) return;
    setError("");
    setPending(true);
    setProgress(`Uploading video… (${formatBytes(file.size)})`);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${courseId}/${moduleId}/video-${Date.now()}.${ext}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("course-videos")
        .upload(path, file, {
          contentType: file.type || "video/mp4",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      setProgress("Saving…");
      const result = await attachModuleVideoAction({
        courseId,
        moduleId,
        path,
      });
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
      <div>
        <Label>Video file</Label>
        <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600 transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950">
          <Upload className="h-4 w-4" />
          {hasVideo ? "Replace video" : "Upload video"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={pending}
            onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {progress ? (
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          {progress}
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {pending ? (
        <Button type="button" disabled variant="outline" size="sm">
          Working…
        </Button>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
