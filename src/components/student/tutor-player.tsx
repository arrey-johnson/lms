"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Lock, Mic, RotateCcw, Send, X } from "lucide-react";
import {
  restartTutorTopicAction,
  sendTutorMessageAction,
  sendTutorVoiceNoteAction,
} from "@/lib/actions/tutor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TutorMessage } from "@/lib/types";

export type TutorLessonNav = {
  id: string;
  label: string;
  title: string;
};

export function TutorPlayer({
  courseId,
  courseTitle,
  courseDescription,
  lessons,
  initialMessages,
  initialLessonIndex,
  initialCompleted,
  previewMode = false,
  backHref = "/dashboard",
  backLabel = "← Back to courses",
}: {
  courseId: string;
  courseTitle: string;
  courseDescription: string | null;
  lessons: TutorLessonNav[];
  initialMessages: TutorMessage[];
  initialLessonIndex: number;
  initialCompleted: boolean;
  previewMode?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [lessonIndex, setLessonIndex] = useState(initialLessonIndex);
  const [completed, setCompleted] = useState(initialCompleted);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [activity, setActivity] = useState<
    "hearing" | "reasoning" | "typing" | null
  >(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const threadRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voiceIntent = useRef(false);
  const stoppingRecording = useRef(false);
  const meterRef = useRef<{
    audio: AudioContext;
    source: MediaStreamAudioSourceNode;
  } | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    if (!pending) {
      setActivity(null);
      voiceIntent.current = false;
      return;
    }
    if (voiceIntent.current) {
      setActivity("hearing");
      const reasoning = window.setTimeout(() => setActivity("reasoning"), 1400);
      const typing = window.setTimeout(() => setActivity("typing"), 3000);
      return () => {
        window.clearTimeout(reasoning);
        window.clearTimeout(typing);
      };
    }
    setActivity("reasoning");
    const timer = window.setTimeout(() => setActivity("typing"), 1600);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setRecordSeconds((seconds) => {
        if (seconds >= 89) {
          window.setTimeout(() => finishRecording(true), 0);
          return 90;
        }
        return seconds + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // finishRecording is stable enough for this timer: it reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const meter = meterRef.current;
      meterRef.current = null;
      meter?.source.disconnect();
      void meter?.audio.close();
    };
  }, []);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    const sent = node.querySelectorAll<HTMLElement>("[data-tutor-role='learner']");
    const last = sent[sent.length - 1];
    if (!last) {
      node.scrollTop = 0;
      return;
    }
    const top =
      last.getBoundingClientRect().top -
      node.getBoundingClientRect().top +
      node.scrollTop;
    node.scrollTop = Math.max(0, top - 12);
  }, [messages, pending]);

  function restartTopic() {
    const lesson = lessons[lessonIndex];
    const label = lesson ? `${lesson.label} ${lesson.title}` : "this topic";
    if (
      !window.confirm(
        `Clear this chat and restart ${label}? Earlier lessons stay completed.`
      )
    ) {
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await restartTutorTopicAction(courseId);
      if (result.error && result.messages.length === 0) {
        setError(result.error);
        return;
      }
      setMessages(result.messages);
      setLessonIndex(result.lessonIndex);
      setCompleted(result.completed);
      setDraft("");
      setError(result.error ?? "");
    });
  }

  function applyTurn(result: {
    messages: TutorMessage[];
    lessonIndex: number;
    completed: boolean;
    error?: string;
  }) {
    if (result.error && result.messages.length === 0) {
      setError(result.error);
      return;
    }
    setMessages(result.messages);
    setLessonIndex(result.lessonIndex);
    setCompleted(result.completed);
    setError(result.error ?? "");
    if (!result.error) setDraft("");
  }

  function releaseMeter() {
    const meter = meterRef.current;
    meterRef.current = null;
    try {
      meter?.source.disconnect();
    } catch {
      // The source is already disconnected when the mic track stops.
    }
    void meter?.audio.close();
    setAnalyser(null);
  }

  function finishRecording(send: boolean) {
    const recorder = recorderRef.current;
    const stream = streamRef.current;
    if (!recorder || stoppingRecording.current) return;
    stoppingRecording.current = true;
    recorder.onstop = () => {
      releaseMeter();
      stream?.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      chunksRef.current = [];
      recorderRef.current = null;
      streamRef.current = null;
      stoppingRecording.current = false;
      setRecording(false);
      setRecordSeconds(0);
      if (send) submitVoice(blob);
    };
    if (recorder.state !== "inactive") recorder.stop();
    else releaseMeter();
  }

  async function startRecording() {
    if (pending || completed || recording) return;
    setError("");
    const audio = new AudioContext();
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audio.createMediaStreamSource(stream);
      const node = audio.createAnalyser();
      node.fftSize = 1024;
      node.smoothingTimeConstant = 0.65;
      source.connect(node);
      await audio.resume();
      meterRef.current = { audio, source };
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      stoppingRecording.current = false;
      recorder.start();
      setAnalyser(node);
      setRecordSeconds(0);
      setRecording(true);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      meterRef.current = null;
      void audio.close();
      setAnalyser(null);
      setError("Allow the microphone to send a voice note.");
    }
  }

  function submitVoice(blob: Blob) {
    const type = blob.type || "audio/webm";
    const extension = type.includes("mp4")
      ? "m4a"
      : type.includes("ogg")
        ? "ogg"
        : type.includes("wav")
          ? "wav"
          : "webm";
    const formData = new FormData();
    formData.set("courseId", courseId);
    formData.set("audio", new File([blob], `voice-note.${extension}`, { type }));
    voiceIntent.current = true;
    setError("");
    startTransition(async () => {
      applyTurn(await sendTutorVoiceNoteAction(formData));
    });
  }

  function submit() {
    const text = draft.trim();
    if (!text || pending || completed) return;
    setError("");
    voiceIntent.current = false;
    startTransition(async () => {
      applyTurn(await sendTutorMessageAction(courseId, text));
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex h-[calc(100dvh-10.5rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated shadow-sm sm:h-[calc(100dvh-9.5rem)] lg:h-[calc(100dvh-6rem)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <p className="min-w-0 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {lessons[lessonIndex]
                ? `${lessons[lessonIndex].label} · ${lessons[lessonIndex].title}`
                : "Topic"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={restartTopic}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restart topic
            </Button>
          </div>
          <div
            ref={threadRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
          >
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const showDivider = !previous || previous.lessonId !== message.lessonId;
              const lesson = lessons.find((item) => item.id === message.lessonId);
              return (
                <div key={`${message.lessonId}-${index}`} data-tutor-role={message.role}>
                  {showDivider && lesson ? (
                    <p className="mb-2 mt-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {lesson.label} · {lesson.title}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      "flex items-start gap-2.5",
                      message.role === "learner" && "flex-row-reverse"
                    )}
                  >
                    {message.role === "tutor" ? <TutorAvatar /> : null}
                    <div
                      className={cn(
                        "max-w-[min(100%,42rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-snug shadow-sm",
                        message.role === "learner"
                          ? "rounded-br-md bg-[#0070F8] text-white"
                          : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      )}
                    >
                      {message.role === "tutor" ? (
                        <p className="mb-1 text-[11px] font-semibold tracking-wide text-blue-700 dark:text-blue-300">
                          Tutor
                        </p>
                      ) : null}
                      {message.via === "voice" ? (
                        <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-blue-100">
                          <Mic className="h-3 w-3" />
                          Voice note
                        </p>
                      ) : null}
                      <div className="space-y-2">
                        {messageParagraphs(message.content).map((paragraph, paragraphIndex) => (
                          <p key={paragraphIndex}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {activity ? <TutorActivity phase={activity} /> : null}
            {completed ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                Module 1 is complete. You can go back to your courses.
              </div>
            ) : null}
          </div>

          <form
            className="shrink-0 border-t border-slate-100 bg-surface-elevated p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="sr-only" htmlFor="tutor-reply">
              Your reply
            </label>
            <div className="relative rounded-xl border border-[color:var(--border)] bg-surface transition focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950">
              {recording ? (
                <div className="flex h-[5.25rem] items-center gap-3 px-3.5">
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
                    </span>
                    <p
                      className="text-sm font-medium tabular-nums text-rose-600"
                      title="Stops at 1:30"
                    >
                      {formatClock(recordSeconds)}
                    </p>
                  </div>
                  {analyser ? <VoiceWave analyser={analyser} /> : <div className="min-w-0 flex-1" />}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => finishRecording(false)}
                      aria-label="Discard voice note"
                      title="Discard"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => finishRecording(true)}
                      aria-label="Send voice note"
                      title="Send voice note"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#0070F8] text-white transition hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    id="tutor-reply"
                    value={draft}
                    disabled={pending || completed}
                    rows={2}
                    placeholder={
                      completed
                        ? "This module is complete."
                        : "Answer in your own words…"
                    }
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        submit();
                      }
                    }}
                    className="w-full resize-none bg-transparent px-3.5 py-2.5 pr-24 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100"
                  />
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pending || completed}
                      onClick={startRecording}
                      aria-label="Record a voice note"
                      title="Voice note"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={pending || completed || !draft.trim()}
                      aria-label="Send reply"
                      title="Send"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#0070F8] text-white transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
            {!recording ? (
              <p className="mt-2 text-xs text-slate-400">
                Enter to send · Shift+Enter for a new line
              </p>
            ) : null}
          </form>
        </div>

        <aside className="hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated p-3 shadow-sm lg:block dark:border-slate-800 dark:bg-slate-900">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Lessons
          </p>
          <ul className="space-y-1">
            {lessons.map((lesson, index) => {
              const status = lessonStatus(index, lessonIndex, completed);
              return (
                <li key={lesson.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-xl px-3 py-3",
                      status === "current" &&
                        "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
                      status === "locked" && "opacity-55"
                    )}
                  >
                    <LessonIcon status={status} />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {lesson.label}
                      </span>
                      <span className="block text-sm font-medium">{lesson.title}</span>
                      <span className="block text-xs text-slate-500">
                        {status === "done"
                          ? "Understood"
                          : status === "current"
                            ? "In progress"
                            : "Locked"}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <div className="lg:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {lessons.map((lesson, index) => (
            <LessonChip
              key={lesson.id}
              lesson={lesson}
              index={index}
              lessonIndex={lessonIndex}
              completed={completed}
            />
          ))}
        </div>
      </div>

      {previewMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Admin preview — you are in the live student tutor. This conversation
          is saved on your admin account so you can resume, and it is not stored
          as student progress.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 sm:p-5">
          <Link
            href={backHref}
            className="text-sm text-blue-700 hover:underline dark:text-blue-400"
          >
            {backLabel}
          </Link>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words font-[family-name:var(--font-display)] text-xl text-slate-900 sm:text-2xl md:text-3xl dark:text-white">
                {courseTitle}
              </h1>
              {courseDescription ? (
                <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
                  {courseDescription}
                </p>
              ) : null}
            </div>
            <p className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              {completed
                ? "Module complete"
                : `Lesson ${lessons[lessonIndex]?.label ?? ""}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function messageParagraphs(content: string) {
  const parts = content
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((part) => part.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [content.trim()];
}

function TutorAvatar() {
  return (
    <span className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-blue-100 dark:bg-slate-950 dark:ring-blue-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icon.png" alt="" className="h-full w-full object-cover" />
    </span>
  );
}

function TutorActivity({
  phase,
}: {
  phase: "hearing" | "reasoning" | "typing";
}) {
  return (
    <div className="flex items-start gap-2.5">
      <TutorAvatar />
      <div className="rounded-2xl rounded-bl-md border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="mb-1 text-[11px] font-semibold tracking-wide text-blue-700 dark:text-blue-300">
          Tutor
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
          {phase === "hearing"
            ? "Hearing your voice note"
            : phase === "reasoning"
              ? "Tutor is reasoning"
              : "Tutor is typing"}
          <span className="flex items-center gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
          </span>
        </p>
      </div>
    </div>
  );
}

function VoiceWave({ analyser }: { analyser: AnalyserNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cue, setCue] = useState<"listening" | "quiet" | "clear">("listening");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const samples = new Uint8Array(analyser.fftSize);
    const bars = 40;
    const history = new Array<number>(bars).fill(0);
    let frame = 0;
    let lastSample = 0;
    let quietFrames = 0;
    let clearFrames = 0;
    let cueNow: "listening" | "quiet" | "clear" = "listening";

    const draw = (now: number) => {
      frame = window.requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (let index = 0; index < samples.length; index += 1) {
        const sample = (samples[index] - 128) / 128;
        sum += sample * sample;
      }
      const level = Math.min(1, Math.sqrt(sum / samples.length) * 7);

      if (now - lastSample > 70) {
        history.push(level);
        history.shift();
        lastSample = now;
      } else {
        history[history.length - 1] = level;
      }

      if (level < 0.1) {
        quietFrames += 1;
        clearFrames = 0;
      } else {
        clearFrames += 1;
        quietFrames = 0;
      }
      const next =
        clearFrames > 6 ? "clear" : quietFrames > 36 ? "quiet" : cueNow;
      if (next !== cueNow) {
        cueNow = next;
        setCue(next);
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      const pixelWidth = Math.floor(width * dpr);
      const pixelHeight = Math.floor(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const gap = 3;
      const barWidth = Math.max(2, (width - gap * (bars - 1)) / bars);
      for (let index = 0; index < bars; index += 1) {
        const value = history[index];
        const barHeight = Math.max(3, value * (height - 2));
        const x = index * (barWidth + gap);
        const y = (height - barHeight) / 2;
        ctx.fillStyle = value > 0.1 ? "#0070F8" : "rgba(148, 163, 184, 0.5)";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 999);
        ctx.fill();
      }
    };

    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [analyser]);

  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center">
      <canvas
        ref={canvasRef}
        className="h-8 w-full"
        role="img"
        aria-label={
          cue === "quiet"
            ? "Voice is too quiet"
            : cue === "clear"
              ? "Voice is being picked up"
              : "Listening for your voice"
        }
      />
      <p
        className={cn(
          "truncate text-[11px] leading-4",
          cue === "quiet" ? "text-amber-500" : "text-slate-400"
        )}
        aria-live="polite"
      >
        {cue === "quiet"
          ? "Too quiet — speak closer or a little louder"
          : cue === "clear"
            ? "Voice is coming through"
            : "Listening…"}
      </p>
    </div>
  );
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function lessonStatus(
  index: number,
  lessonIndex: number,
  completed: boolean
): "done" | "current" | "locked" {
  if (completed || index < lessonIndex) return "done";
  if (index === lessonIndex) return "current";
  return "locked";
}

function LessonIcon({ status }: { status: "done" | "current" | "locked" }) {
  if (status === "locked") return <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />;
  if (status === "done") {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />;
  }
  return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />;
}

function LessonChip({
  lesson,
  index,
  lessonIndex,
  completed,
}: {
  lesson: TutorLessonNav;
  index: number;
  lessonIndex: number;
  completed: boolean;
}) {
  const status = lessonStatus(index, lessonIndex, completed);
  return (
    <div
      className={cn(
        "min-w-[9.5rem] shrink-0 rounded-xl border px-3 py-2",
        status === "current"
          ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
          : "border-[color:var(--border)] bg-surface-elevated dark:border-slate-800 dark:bg-slate-900",
        status === "locked" && "opacity-55"
      )}
    >
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {lesson.label}
      </span>
      <span className="block truncate text-sm font-medium">{lesson.title}</span>
    </div>
  );
}
