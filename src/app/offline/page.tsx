export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-2 bg-(--color-bg) p-6 text-center">
      <p className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.16em] text-(--color-accent-700) uppercase">
        No connection
      </p>
      <h1 className="font-(family-name:--font-heading) text-[21px] font-semibold">
        You&apos;re offline
      </h1>
      <p className="max-w-[260px] text-[13px] text-(--color-text-62)">
        The video room needs a connection to load shifts, hours, and tasks. Reconnect and reopen the app.
      </p>
    </div>
  );
}
