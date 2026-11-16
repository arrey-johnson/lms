"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStudentAction,
  deleteStudentAction,
  setStudentDisabledAction,
  updateStudentEnrollmentsAction,
} from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { formatPercent } from "@/lib/utils";
import type { Course, StudentWithProgress } from "@/lib/types";

export function StudentManager({
  courses,
  students,
}: {
  courses: Course[];
  students: StudentWithProgress[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-[color:var(--border)] bg-surface-elevated p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-slate-900 dark:text-white">
          Create student
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Students sign in with the credentials you set. No self-registration.
        </p>

        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          action={(formData) => {
            setError("");
            setMessage("");
            startTransition(async () => {
              const result = await createStudentAction(formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              setMessage("Student account created.");
              router.refresh();
            });
          }}
        >
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" placeholder="Ada Lovelace" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="student@school.edu"
            />
          </div>
          <div>
            <Label htmlFor="password">Temporary password</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={6}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Enroll in courses</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {courses.map((course) => (
                <label
                  key={course.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                >
                  <input
                    type="checkbox"
                    name="course_ids"
                    value={course.id}
                    className="accent-blue-700"
                  />
                  {course.title}
                </label>
              ))}
              {courses.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Create a course first to enroll students.
                </p>
              ) : null}
            </div>
          </div>
          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}
          {message ? (
            <p className="text-sm text-blue-700 md:col-span-2">{message}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create student"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-slate-900 dark:text-white">
          Students
        </h2>
        {students.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
            No students yet.
          </p>
        ) : (
          students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              courses={courses}
            />
          ))
        )}
      </section>
    </div>
  );
}

function StudentCard({
  student,
  courses,
}: {
  student: StudentWithProgress;
  courses: Course[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const enrolled = new Set(student.enrollments.map((e) => e.course_id));
  const progress =
    student.total_modules === 0
      ? 0
      : (student.completed_modules / student.total_modules) * 100;

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-surface-elevated p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {student.full_name || "Unnamed student"}
          </h3>
          <p className="text-sm text-slate-500">{student.email}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Progress: {student.completed_modules}/{student.total_modules} modules (
            {formatPercent(progress)})
            {student.disabled ? (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Disabled
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await setStudentDisabledAction(student.id, !student.disabled);
                router.refresh();
              });
            }}
          >
            {student.disabled ? "Enable" : "Disable"}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (!confirm("Permanently delete this student account?")) return;
              startTransition(async () => {
                await deleteStudentAction(student.id);
                router.refresh();
              });
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <form
        className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"
        action={(formData) => {
          startTransition(async () => {
            await updateStudentEnrollmentsAction(formData);
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="user_id" value={student.id} />
        <Label>Enrollments</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {courses.map((course) => (
            <label
              key={course.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
            >
              <input
                type="checkbox"
                name="course_ids"
                value={course.id}
                defaultChecked={enrolled.has(course.id)}
                className="accent-blue-700"
              />
              {course.title}
            </label>
          ))}
        </div>
        <Button type="submit" size="sm" className="mt-3" disabled={pending}>
          Save enrollments
        </Button>
      </form>
    </div>
  );
}
