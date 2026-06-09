import Link from "next/link";
import { AdminMonetizationPanel } from "@/components/admin-monetization-panel";
import {
  Activity,
  BarChart3,
  Eye,
  type LucideIcon,
  MousePointerClick,
  Pause,
  ShieldAlert,
  Trash2
} from "lucide-react";
import {
  adminListings,
  formatPrice,
  listingTypeLabels,
  ListingStatus
} from "@/lib/listings";

const metrics = [
  { label: "Aktivni oglasi", value: "42", icon: Activity, tone: "bg-moss/10 text-mossDark" },
  { label: "Riješeni oglasi", value: "13", icon: BarChart3, tone: "bg-honey/22 text-[#72520d]" },
  { label: "Kontakt klikovi", value: "128", icon: MousePointerClick, tone: "bg-plum/10 text-plum" },
  { label: "Prijavljeni oglasi", value: "3", icon: ShieldAlert, tone: "bg-clay/10 text-clay" }
];

const statusTone: Record<ListingStatus, string> = {
  active: "bg-moss/10 text-mossDark",
  paused: "bg-honey/22 text-[#72520d]",
  resolved: "bg-skywash text-mossDark",
  removed: "bg-clay/10 text-clay"
};

export default function AdminPage() {
  // TODO: Protect this route with Clerk auth and the Convex admin role before using real admin data.
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-ink px-3 py-1 text-sm font-black text-white">
              Admin
            </span>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink">Pregled oglasa</h1>
          </div>
          <Link
            href="/oglasi"
            className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
          >
            Otvori feed
          </Link>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-lg ${metric.tone}`}>
                    <Icon aria-hidden="true" size={21} />
                  </span>
                  <span className="text-3xl font-black text-ink">{metric.value}</span>
                </div>
                <p className="mt-4 text-sm font-black text-ink/62">{metric.label}</p>
              </div>
            );
          })}
        </section>

        <AdminMonetizationPanel />

        <section className="mt-7 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="border-b border-ink/8 p-4 sm:p-5">
            <h2 className="text-xl font-black text-ink">Demo oglasi</h2>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-field text-sm font-black text-ink/62">
                <tr>
                  <th className="px-5 py-3">Oglas</th>
                  <th className="px-5 py-3">Tip</th>
                  <th className="px-5 py-3">Grad</th>
                  <th className="px-5 py-3">Cijena</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {adminListings.map((listing) => (
                  <tr key={listing.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-black text-ink">{listing.title}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-ink/58">{listing.description}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-ink/70">{listingTypeLabels[listing.type]}</td>
                    <td className="px-5 py-4 font-bold text-ink/70">{listing.city}</td>
                    <td className="px-5 py-4 font-black text-ink">{formatPrice(listing.price, listing.type)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone[listing.status]}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AdminAction icon={Eye} label="Pregledaj" />
                        <AdminAction icon={Pause} label="Pauziraj" />
                        <AdminAction icon={BarChart3} label="Označi riješeno" />
                        <AdminAction icon={Trash2} label="Ukloni" danger />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {adminListings.map((listing) => (
              <article key={listing.id} className="rounded-lg border border-ink/10 bg-field p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black text-ink">{listing.title}</h2>
                    <p className="mt-1 text-sm font-bold text-ink/60">
                      {listingTypeLabels[listing.type]} · {listing.city}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusTone[listing.status]}`}>
                    {listing.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/64">{listing.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <AdminAction icon={Eye} label="Pregledaj" />
                  <AdminAction icon={Pause} label="Pauziraj" />
                  <AdminAction icon={BarChart3} label="Označi riješeno" />
                  <AdminAction icon={Trash2} label="Ukloni" danger />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminAction({
  icon: Icon,
  label,
  danger = false
}: {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`focus-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-black transition ${
        danger
          ? "border-clay/20 bg-clay/8 text-clay hover:bg-clay/12"
          : "border-ink/12 bg-white text-ink hover:bg-field"
      }`}
    >
      <Icon aria-hidden="true" size={14} />
      {label}
    </button>
  );
}
