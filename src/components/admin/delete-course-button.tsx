"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCourseAction } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";

export function DeleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this course and all modules/slides?")) return;
        startTransition(async () => {
          await deleteCourseAction(courseId);
          router.push("/admin/courses");
          router.refresh();
        });
      }}
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
