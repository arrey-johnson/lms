export function SiteFooter() {
  return (
    <footer className="border-t border-blue-100/80 bg-white/80 py-5 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
        <a
          href="https://promptstacktechnologies.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium tracking-wide text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300"
        >
          Powered by{" "}
          <span className="text-blue-700 dark:text-blue-400">
            Promptstack Technologies
          </span>
        </a>
      </div>
    </footer>
  );
}
