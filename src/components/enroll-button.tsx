"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollInCourseAction } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";

export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError("");
          startTransition(async () => {
            const result = await enrollInCourseAction(courseId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.push(`/course/${courseId}`);
            router.refresh();
          });
        }}
      >
        {pending ? "Enrolling…" : "Enroll free"}
      </Button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
