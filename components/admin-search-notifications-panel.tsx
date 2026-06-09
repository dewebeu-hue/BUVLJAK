"use client";

import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { AlertTriangle, BellRing, Play, SearchCheck, Send } from "lucide-react";
import { api } from "@/convex/_generated/api";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type NotificationStats = {
  totalSearches: number;
  activeSearches: number;
  sent: number;
  failedOrSkipped: number;
};

type RunResult = {
  checkedSearches: number;
  attemptedEmails: number;
  sent: number;
  skipped: number;
  failed: number;
};

const emptyStats: NotificationStats = {
  totalSearches: 0,
  activeSearches: 0,
  sent: 0,
  failedOrSkipped: 0
};

export function AdminSearchNotificationsPanel() {
  if (!hasConvexUrl) {
    return (
      <SearchNotificationsShell
        stats={emptyStats}
        isDisabled
        statusMessage="Convex nije spojen, pa se provjera spremljenih potraga ne može pokrenuti."
      />
    );
  }

  return <ConnectedAdminSearchNotificationsPanel />;
}

function ConnectedAdminSearchNotificationsPanel() {
  const stats = useQuery(api.savedSearches.getSavedSearchNotificationStats) as
    | NotificationStats
    | undefined;
  const runNow = useAction(api.savedSearches.runSavedSearchNotificationsNow);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleRunNow() {
    setIsRunning(true);
    setStatusMessage("");

    try {
      const result = (await runNow({ maxEmails: 50 })) as RunResult;
      setStatusMessage(
        `Provjereno ${result.checkedSearches} potraga. Pokušano ${result.attemptedEmails} emailova: poslano ${result.sent}, preskočeno ${result.skipped}, neuspjelo ${result.failed}.`
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Samo admin može pokrenuti provjeru spremljenih potraga."
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <SearchNotificationsShell
      stats={stats ?? emptyStats}
      isLoading={stats === undefined}
      isRunning={isRunning}
      statusMessage={statusMessage}
      onRunNow={handleRunNow}
    />
  );
}

function SearchNotificationsShell({
  stats,
  isLoading = false,
  isDisabled = false,
  isRunning = false,
  statusMessage,
  onRunNow
}: {
  stats: NotificationStats;
  isLoading?: boolean;
  isDisabled?: boolean;
  isRunning?: boolean;
  statusMessage?: string;
  onRunNow?: () => void;
}) {
  const metricItems = [
    { label: "Spremljene potrage", value: stats.totalSearches, icon: SearchCheck },
    { label: "Aktivne potrage", value: stats.activeSearches, icon: BellRing },
    { label: "Emailovi poslani", value: stats.sent, icon: Send },
    { label: "Failed/skipped", value: stats.failedOrSkipped, icon: AlertTriangle }
  ];

  return (
    <section className="mt-7 rounded-lg border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">Potrage i obavijesti</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-ink/64">
            Ručna beta provjera aktivnih spremljenih potraga. TODO: spojiti dnevni Convex cron kad email flow bude potvrđen u produkciji.
          </p>
        </div>
        <button
          type="button"
          onClick={onRunNow}
          disabled={isDisabled || isLoading || isRunning}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          <Play aria-hidden="true" size={17} />
          {isRunning ? "Provjera..." : "Pokreni provjeru potraga sada"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-ink/10 bg-field/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-mossDark">
                  <Icon aria-hidden="true" size={19} />
                </span>
                <span className="text-2xl font-black text-ink">{isLoading ? "..." : item.value}</span>
              </div>
              <p className="mt-3 text-sm font-black text-ink/62">{item.label}</p>
            </div>
          );
        })}
      </div>

      {statusMessage ? (
        <p className="mt-4 rounded-lg bg-field p-3 text-sm font-black text-mossDark" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
