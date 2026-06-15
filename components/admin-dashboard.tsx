"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  Eye,
  Flag,
  Loader2,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  Users,
  Wrench
} from "lucide-react";
import { AdminMonetizationPanel } from "@/components/admin-monetization-panel";
import { AdminSearchNotificationsPanel } from "@/components/admin-search-notifications-panel";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  formatPrice,
  listingStatusLabels,
  listingTypeFilterOptions,
  listingTypeLabels,
  type ListingStatus,
  type ListingType
} from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type AdminTab = "overview" | "listings" | "reports" | "users" | "searches" | "monetization" | "readiness";
type AdminListing = {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  city: string;
  category: string;
  price?: number;
  priceType: string;
  status: ListingStatus;
  viewCount: number;
  contactClickCount: number;
  shareCount: number;
  saveCount: number;
  isFeatured: boolean;
  featuredLabel?: string;
  isDemo: boolean;
  removedReason?: string;
  createdAt: number;
  ownerDisplayName?: string;
  ownerEmail?: string;
  reportCount: number;
};
type AdminReport = {
  id: string;
  reason: string;
  status: "new" | "reviewed" | "dismissed" | "action_taken";
  createdAt: number;
  listing: {
    id: string;
    title: string;
    status: ListingStatus;
    city: string;
    category: string;
    removedReason?: string;
  } | null;
  reporter: {
    displayName: string;
    email?: string;
  } | null;
};
type AdminUser = {
  id: string;
  displayName: string;
  email?: string;
  city?: string;
  role: "user" | "admin";
  isBlocked: boolean;
  blockedReason?: string;
  listingsCount: number;
  activeListingsCount: number;
  createdAt: number;
};
type AdminServicesSettings = {
  servicesEnabled: boolean;
  updatedAt?: number;
};

const tabs: Array<{ id: AdminTab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Pregled", icon: BarChart3 },
  { id: "listings", label: "Oglasi", icon: Activity },
  { id: "reports", label: "Prijave", icon: Flag },
  { id: "users", label: "Korisnici", icon: Users },
  { id: "searches", label: "Potrage", icon: BellRing },
  { id: "monetization", label: "Monetizacija", icon: Sparkles },
  { id: "readiness", label: "Beta readiness", icon: ShieldCheck }
];

const removalReasons = [
  "Spam",
  "Prevara",
  "Neprimjeren sadržaj",
  "Duplikat",
  "Oglas nije lokalno relevantan",
  "Drugo"
];

export function AdminDashboard() {
  if (!hasConvexUrl) {
    return (
      <AdminShell>
        <section className="rounded-lg border border-honey/30 bg-honey/16 p-5">
          <h1 className="text-2xl font-black text-ink">Admin traži Convex</h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/66">
            Postavi `NEXT_PUBLIC_CONVEX_URL` da bi admin guard i moderacija radili nad stvarnom bazom.
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <AdminShell>
          <section className="rounded-lg border border-honey/30 bg-honey/16 p-5">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
                <Lock aria-hidden="true" size={21} />
              </span>
              <div>
                <h1 className="text-2xl font-black text-ink">Prijava je obavezna</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
                  Prijavi se admin računom da bi vidio dashboard.
                </p>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="focus-ring mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
                  >
                    Prijava
                  </button>
                </SignInButton>
              </div>
            </div>
          </section>
        </AdminShell>
      </Show>

      <Show when="signed-in">
        <ConnectedAdminDashboard />
      </Show>
    </>
  );
}

function ConnectedAdminDashboard() {
  const access = useQuery(api.admin.getAdminAccess);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [listingOwnerFilter, setListingOwnerFilter] = useState<string | null>(null);

  if (access === undefined) {
    return (
      <AdminShell>
        <div className="h-48 animate-pulse rounded-lg border border-ink/10 bg-white" />
      </AdminShell>
    );
  }

  if (!access.isAdmin) {
    return (
      <AdminShell>
        <section className="rounded-lg border border-clay/20 bg-clay/8 p-5">
          <h1 className="text-2xl font-black text-ink">Nemaš pristup ovoj stranici.</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/66">
            Admin pristup je dopušten samo vlasničkom računu.
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-ink px-3 py-1 text-sm font-black text-white">
            Admin
          </span>
          <h1 className="mt-3 text-4xl font-black leading-tight text-ink">Beta kontrola</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-ink/64">
            Pregled, moderacija i spremnost Buvljaka za zatvorenu lokalnu betu.
          </p>
        </div>
        <Link
          href="/oglasi"
          className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
        >
          Otvori feed
        </Link>
      </div>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Admin sekcije">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-black transition ${
                isActive
                  ? "border-moss bg-moss text-white"
                  : "border-ink/12 bg-white text-ink/68 hover:bg-field hover:text-ink"
              }`}
            >
              <Icon aria-hidden="true" size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" ? <AdminOverview /> : null}
      {activeTab === "listings" ? (
        <AdminListingsSection ownerFilterId={listingOwnerFilter} onClearOwnerFilter={() => setListingOwnerFilter(null)} />
      ) : null}
      {activeTab === "reports" ? <AdminReportsSection /> : null}
      {activeTab === "users" ? (
        <AdminUsersSection
          onViewListings={(userId) => {
            setListingOwnerFilter(userId);
            setActiveTab("listings");
          }}
        />
      ) : null}
      {activeTab === "searches" ? <AdminSearchNotificationsPanel /> : null}
      {activeTab === "monetization" ? (
        <>
          <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-4">
            <p className="text-sm font-black text-ink">
              Monetizacija je skrivena korisnicima dok je ovdje ne uključiš.
            </p>
          </section>
          <AdminMonetizationPanel />
        </>
      ) : null}
      {activeTab === "readiness" ? <AdminReadinessSection /> : null}
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

function AdminOverview() {
  const stats = useQuery(api.admin.getAdminStats);

  const items = [
    { label: "Ukupno oglasa", value: stats?.totalListings, icon: Activity },
    { label: "Aktivni", value: stats?.activeListings, icon: Play },
    { label: "Pauzirani", value: stats?.pausedListings, icon: Pause },
    { label: "Riješeni", value: stats?.resolvedListings, icon: CheckCircle2 },
    { label: "Uklonjeni", value: stats?.removedListings, icon: Trash2 },
    { label: "Prijavljeni", value: stats?.reportedListings, icon: Flag },
    { label: "Korisnici", value: stats?.users, icon: Users },
    { label: "Kontakt klikovi", value: stats?.contactClicks, icon: Eye },
    { label: "Dijeljenja", value: stats?.shares, icon: RotateCcw },
    { label: "Spremljene potrage", value: stats?.savedSearches, icon: Search },
    { label: "Email poslano", value: stats?.sentEmailNotifications, icon: BellRing },
    { label: "Email failed/skipped", value: stats?.failedOrSkippedEmailNotifications, icon: AlertTriangle },
    { label: "Oglasi 7 dana", value: stats?.listingsLast7Days, icon: BarChart3 },
    { label: "Kontakt 7 dana", value: stats?.contactClicksLast7Days, icon: Eye }
  ];

  return (
    <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-moss/10 text-mossDark">
                <Icon aria-hidden="true" size={21} />
              </span>
              <span className="text-3xl font-black text-ink">
                {stats === undefined ? "..." : item.value ?? 0}
              </span>
            </div>
            <p className="mt-4 text-sm font-black text-ink/62">{item.label}</p>
          </div>
        );
      })}
    </section>
  );
}

function AdminListingsSection({
  ownerFilterId,
  onClearOwnerFilter
}: {
  ownerFilterId: string | null;
  onClearOwnerFilter: () => void;
}) {
  const [status, setStatus] = useState<ListingStatus | "all">("all");
  const [type, setType] = useState<ListingType | "all">("all");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [limit, setLimit] = useState(50);
  const [message, setMessage] = useState("");
  const listings = useQuery(api.admin.listAdminListings, {
    ...(status !== "all" ? { status } : {}),
    ...(type !== "all" ? { type } : {}),
    ...(city.trim() ? { city: city.trim() } : {}),
    ...(category.trim() ? { category: category.trim() } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(ownerFilterId ? { ownerId: ownerFilterId as Id<"users"> } : {}),
    reportedOnly,
    limit
  }) as AdminListing[] | undefined;
  const updateStatus = useMutation(api.admin.adminUpdateListingStatus);
  const setFeatured = useMutation(api.admin.adminSetListingFeatured);

  async function runListingAction(action: () => Promise<unknown>, success: string) {
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch {
      setMessage("Akcija nije uspjela. Pokušaj ponovno.");
    }
  }

  async function removeListing(listing: AdminListing) {
    const reason = window.prompt(
      `Razlog uklanjanja: ${removalReasons.join(", ")}`,
      listing.removedReason ?? "Spam"
    );

    if (!reason) {
      return;
    }

    await runListingAction(
      () =>
        updateStatus({
          id: listing.id as Id<"listings">,
          status: "removed",
          removedReason: reason
        }),
      "Oglas je uklonjen."
    );
  }

  return (
    <section className="mt-7">
      <AdminSectionHeader title="Oglasi" description="Moderacija svih oglasa u bazi, s limitom i filterima." />
      {ownerFilterId ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-moss/16 bg-moss/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-mossDark">Prikazujem oglase od odabranog korisnika.</p>
          <button
            type="button"
            onClick={onClearOwnerFilter}
            className="focus-ring inline-flex h-10 items-center justify-center rounded-lg border border-moss/18 bg-white px-3 text-sm font-black text-mossDark"
          >
            Makni filter korisnika
          </button>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 rounded-lg border border-ink/10 bg-white p-4 shadow-sm md:grid-cols-3">
        <AdminSelect label="Status" value={status} onChange={(value) => setStatus(value as ListingStatus | "all")}>
          <option value="all">Svi statusi</option>
          {Object.entries(listingStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect label="Tip" value={type} onChange={(value) => setType(value as ListingType | "all")}>
          {listingTypeFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === "all" ? "Svi tipovi" : option.label}
            </option>
          ))}
        </AdminSelect>
        <AdminInput label="Search" value={search} onChange={setSearch} placeholder="Naslov ili opis" />
        <AdminInput label="Grad" value={city} onChange={setCity} placeholder="npr. Nova Gradiška" />
        <AdminInput label="Kategorija" value={category} onChange={setCategory} placeholder="npr. Namještaj" />
        <label className="flex items-end gap-2 text-sm font-black text-ink">
          <input
            type="checkbox"
            checked={reportedOnly}
            onChange={(event) => setReportedOnly(event.target.checked)}
            className="mb-3 h-4 w-4 accent-moss"
          />
          <span className="pb-2">Samo prijavljeni</span>
        </label>
      </div>
      {message ? <AdminMessage>{message}</AdminMessage> : null}
      <div className="mt-4 grid gap-4">
        {listings === undefined ? <AdminLoading /> : null}
        {listings?.length === 0 ? <AdminEmpty>Nema oglasa za ovaj odabir.</AdminEmpty> : null}
        {listings?.map((listing) => (
          <article key={listing.id} className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{listingTypeLabels[listing.type]}</Badge>
                  <Badge>{listingStatusLabels[listing.status]}</Badge>
                  {listing.reportCount > 0 ? <Badge tone="danger">{listing.reportCount} prijava</Badge> : null}
                  {listing.isFeatured ? <Badge tone="warm">{listing.featuredLabel ?? "Istaknuto"}</Badge> : null}
                  {listing.isDemo ? <Badge tone="muted">Demo</Badge> : null}
                </div>
                <h3 className="mt-3 text-xl font-black text-ink">{listing.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-ink/64">
                  {listing.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-ink/58">
                  <span>{listing.city}</span>
                  <span>{listing.category}</span>
                  <span>{formatAdminPrice(listing)}</span>
                  <span>{listing.ownerDisplayName ?? "Bez vlasnika"}</span>
                  <span>{formatDate(listing.createdAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-ink/58">
                  <span>{listing.viewCount} pregleda</span>
                  <span>{listing.contactClickCount} kontakata</span>
                  <span>{listing.shareCount} dijeljenja</span>
                  <span>{listing.saveCount} spremanja</span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[28rem]">
                <AdminLinkButton href={`/oglasi/${listing.id}`} icon={<Eye aria-hidden="true" size={15} />}>
                  Pregledaj
                </AdminLinkButton>
                <AdminActionButton
                  onClick={() => runListingAction(() => updateStatus({ id: listing.id as Id<"listings">, status: "paused" }), "Oglas je pauziran.")}
                  icon={<Pause aria-hidden="true" size={15} />}
                >
                  Pauziraj
                </AdminActionButton>
                <AdminActionButton
                  onClick={() => runListingAction(() => updateStatus({ id: listing.id as Id<"listings">, status: "resolved" }), "Oglas je označen riješenim.")}
                  icon={<CheckCircle2 aria-hidden="true" size={15} />}
                >
                  Riješeno
                </AdminActionButton>
                <AdminActionButton
                  onClick={() => runListingAction(() => updateStatus({ id: listing.id as Id<"listings">, status: "active" }), "Oglas je vraćen u aktivno.")}
                  icon={<RotateCcw aria-hidden="true" size={15} />}
                >
                  Vrati aktivno
                </AdminActionButton>
                <AdminActionButton onClick={() => removeListing(listing)} danger icon={<Trash2 aria-hidden="true" size={15} />}>
                  Ukloni
                </AdminActionButton>
                <AdminActionButton
                  onClick={() =>
                    runListingAction(
                      () =>
                        setFeatured({
                          id: listing.id as Id<"listings">,
                          isFeatured: !listing.isFeatured,
                          featuredLabel: "Istaknuto"
                        }),
                      listing.isFeatured ? "Isticanje je isključeno." : "Oglas je istaknut."
                    )
                  }
                  icon={<Sparkles aria-hidden="true" size={15} />}
                >
                  {listing.isFeatured ? "Makni isticanje" : "Istakni"}
                </AdminActionButton>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setLimit((current) => current + 50)}
          className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
        >
          Učitaj još
        </button>
      </div>
    </section>
  );
}

function AdminReportsSection() {
  const [status, setStatus] = useState<AdminReport["status"] | "all">("new");
  const reports = useQuery(api.admin.listReports, {
    ...(status !== "all" ? { status } : {}),
    limit: 50
  }) as AdminReport[] | undefined;
  const updateReportStatus = useMutation(api.admin.updateReportStatus);
  const removeFromReport = useMutation(api.admin.adminRemoveListingFromReport);
  const restoreFromReport = useMutation(api.admin.adminRestoreListingFromReport);
  const [message, setMessage] = useState("");

  async function run(action: () => Promise<unknown>, success: string) {
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch {
      setMessage("Akcija nije uspjela. Pokušaj ponovno.");
    }
  }

  return (
    <section className="mt-7">
      <AdminSectionHeader title="Prijave" description="Pregled i rješavanje prijavljenih oglasa." />
      <div className="mt-4 max-w-xs">
        <AdminSelect label="Status prijave" value={status} onChange={(value) => setStatus(value as AdminReport["status"] | "all")}>
          <option value="all">Sve prijave</option>
          <option value="new">Nove</option>
          <option value="reviewed">Pregledane</option>
          <option value="dismissed">Odbačene</option>
          <option value="action_taken">Riješene akcijom</option>
        </AdminSelect>
      </div>
      {message ? <AdminMessage>{message}</AdminMessage> : null}
      <div className="mt-4 grid gap-4">
        {reports === undefined ? <AdminLoading /> : null}
        {reports?.length === 0 ? <AdminEmpty>Nema novih prijava.</AdminEmpty> : null}
        {reports?.map((report) => (
          <article key={report.id} className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={report.status === "new" ? "danger" : "muted"}>{report.status}</Badge>
                  <Badge>{formatDate(report.createdAt)}</Badge>
                </div>
                <h3 className="mt-3 text-xl font-black text-ink">{report.reason}</h3>
                <p className="mt-2 text-sm font-semibold text-ink/64">
                  Oglas: {report.listing?.title ?? "Oglas nije pronađen"}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink/64">
                  Reporter: {report.reporter?.displayName ?? "Anonimno"} {report.reporter?.email ? `· ${report.reporter.email}` : ""}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[28rem]">
                {report.listing ? (
                  <AdminLinkButton href={`/oglasi/${report.listing.id}`} icon={<Eye aria-hidden="true" size={15} />}>
                    Pregledaj oglas
                  </AdminLinkButton>
                ) : null}
                <AdminActionButton
                  onClick={() => run(() => updateReportStatus({ id: report.id as Id<"reports">, status: "dismissed" }), "Prijava je odbačena.")}
                >
                  Odbaci prijavu
                </AdminActionButton>
                <AdminActionButton
                  onClick={() => run(() => updateReportStatus({ id: report.id as Id<"reports">, status: "reviewed" }), "Prijava je označena pregledanom.")}
                >
                  Označi pregledano
                </AdminActionButton>
                <AdminActionButton
                  onClick={() =>
                    run(
                      () => removeFromReport({ reportId: report.id as Id<"reports">, removedReason: report.reason }),
                      "Oglas je uklonjen i prijava je riješena."
                    )
                  }
                  danger
                >
                  Ukloni oglas
                </AdminActionButton>
                <AdminActionButton
                  onClick={() => run(() => restoreFromReport({ reportId: report.id as Id<"reports"> }), "Oglas je vraćen u aktivno.")}
                  icon={<RotateCcw aria-hidden="true" size={15} />}
                >
                  Vrati oglas
                </AdminActionButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminUsersSection({ onViewListings }: { onViewListings: (userId: string) => void }) {
  const [search, setSearch] = useState("");
  const users = useQuery(api.admin.listUsers, {
    ...(search.trim() ? { search: search.trim() } : {}),
    limit: 50
  }) as AdminUser[] | undefined;
  const updateRole = useMutation(api.admin.adminUpdateUserRole);
  const updateBlock = useMutation(api.admin.adminUpdateUserBlock);
  const [message, setMessage] = useState("");

  async function run(action: () => Promise<unknown>, success: string) {
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch {
      setMessage("Akcija nije uspjela. Pokušaj ponovno.");
    }
  }

  return (
    <section className="mt-7">
      <AdminSectionHeader title="Korisnici" description="Osnovni pregled korisnika, role i sigurnosnih blokada." />
      <div className="mt-4 max-w-md">
        <AdminInput label="Search" value={search} onChange={setSearch} placeholder="Ime, email ili grad" />
      </div>
      {message ? <AdminMessage>{message}</AdminMessage> : null}
      <div className="mt-4 grid gap-4">
        {users === undefined ? <AdminLoading /> : null}
        {users?.length === 0 ? <AdminEmpty>Još nema korisnika.</AdminEmpty> : null}
        {users?.map((user) => (
          <article key={user.id} className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={user.role === "admin" ? "warm" : "muted"}>{user.role}</Badge>
                  {user.isBlocked ? <Badge tone="danger">Blokiran</Badge> : null}
                </div>
                <h3 className="mt-3 text-xl font-black text-ink">{user.displayName}</h3>
                <p className="mt-1 text-sm font-semibold text-ink/64">{user.email ?? "Bez emaila"}</p>
                <p className="mt-1 text-sm font-semibold text-ink/64">
                  {user.city ?? "Bez grada"} · {user.listingsCount} oglasa · {user.activeListingsCount} aktivnih
                </p>
                <p className="mt-1 text-xs font-bold text-ink/48">Kreiran: {formatDate(user.createdAt)}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[24rem]">
                <AdminActionButton onClick={() => onViewListings(user.id)} icon={<Search aria-hidden="true" size={15} />}>
                  Korisnikovi oglasi
                </AdminActionButton>
                <AdminActionButton
                  onClick={() =>
                    run(
                      () =>
                        updateRole({
                          id: user.id as Id<"users">,
                          role: user.role === "admin" ? "user" : "admin"
                        }),
                      "Role je promijenjen."
                    )
                  }
                  icon={<UserCog aria-hidden="true" size={15} />}
                >
                  {user.role === "admin" ? "Vrati u user" : "Postavi admin"}
                </AdminActionButton>
                <AdminActionButton
                  onClick={() => {
                    const reason = user.isBlocked
                      ? undefined
                      : window.prompt("Razlog blokade", user.blockedReason ?? "Spam") ?? undefined;
                    if (!user.isBlocked && !reason) return;
                    void run(
                      () =>
                        updateBlock({
                          id: user.id as Id<"users">,
                          isBlocked: !user.isBlocked,
                          ...(reason ? { blockedReason: reason } : {})
                        }),
                      user.isBlocked ? "Korisnik je odblokiran." : "Korisnik je blokiran."
                    );
                  }}
                  danger={!user.isBlocked}
                  icon={<Lock aria-hidden="true" size={15} />}
                >
                  {user.isBlocked ? "Odblokiraj" : "Blokiraj"}
                </AdminActionButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminReadinessSection() {
  const readiness = useQuery(api.admin.getBetaReadiness) as
    | { status: string; checks: Array<{ label: string; status: "pass" | "manual" | "fail" }> }
    | undefined;
  const seedDemo = useMutation(api.admin.adminSeedDemoListings);
  const hideDemo = useMutation(api.admin.adminHideDemoListings);
  const deleteDemo = useMutation(api.admin.adminDeleteDemoListings);
  const [message, setMessage] = useState("");
  const sortedChecks = useMemo(
    () =>
      readiness?.checks ?? [
        { label: "Učitavanje checkliste", status: "manual" as const }
      ],
    [readiness]
  );

  async function run(action: () => Promise<unknown>, success: string) {
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch {
      setMessage("Akcija nije uspjela. Pokušaj ponovno.");
    }
  }

  return (
    <section className="mt-7">
      <AdminSectionHeader title="Beta readiness" description="Jednostavna checklist provjera prije zatvorene bete." />
      <AdminServicesToggleCard />
      <div className="mt-4 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-ink/58">Status</p>
            <h2 className="mt-1 text-3xl font-black text-ink">{readiness?.status ?? "Provjera..."}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminActionButton onClick={() => run(() => seedDemo({}), "Demo oglasi su dodani ili već postoje.")}>
              Seed demo oglase
            </AdminActionButton>
            <AdminActionButton onClick={() => run(() => hideDemo({}), "Demo oglasi su sakriveni.")}>
              Sakrij demo oglase
            </AdminActionButton>
            <AdminActionButton
              danger
              onClick={() => {
                if (!window.confirm("Obrisati samo oglase označene kao demo?")) return;
                void run(() => deleteDemo({}), "Demo oglasi su obrisani.");
              }}
            >
              Obriši demo oglase
            </AdminActionButton>
          </div>
        </div>
        {message ? <AdminMessage>{message}</AdminMessage> : null}
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {sortedChecks.map((check) => (
            <div key={check.label} className="flex items-center gap-3 rounded-lg bg-field p-3">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  check.status === "pass"
                    ? "bg-moss/10 text-mossDark"
                    : check.status === "fail"
                      ? "bg-clay/10 text-clay"
                      : "bg-honey/20 text-[#72520d]"
                }`}
              >
                {check.status === "pass" ? (
                  <CheckCircle2 aria-hidden="true" size={17} />
                ) : check.status === "fail" ? (
                  <AlertTriangle aria-hidden="true" size={17} />
                ) : (
                  <Loader2 aria-hidden="true" size={17} />
                )}
              </span>
              <span className="text-sm font-black text-ink">{check.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminServicesToggleCard() {
  const settings = useQuery(api.monetization.getMonetizationSettings) as
    | AdminServicesSettings
    | undefined;
  const updateSettings = useMutation(api.monetization.updateMonetizationSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const isEnabled = Boolean(settings?.servicesEnabled);

  async function toggleServices() {
    if (!settings || isSaving) {
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    try {
      await updateSettings({ servicesEnabled: !isEnabled });
      setStatusMessage("Postavka za Usluge i pomoć je spremljena.");
    } catch {
      setStatusMessage("Samo admin može mijenjati beta module.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-moss/16 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-moss/10 text-mossDark">
            <Wrench aria-hidden="true" size={21} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-ink">Prikaži Usluge i pomoć</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-black ${
                  isEnabled ? "bg-moss/10 text-mossDark" : "bg-ink/8 text-ink/52"
                }`}
              >
                {isEnabled ? "Uključeno" : "Skriveno"}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-ink/64">
              Kada je uključeno, korisnici na oglasniku vide preklopnik Stvari / Usluge i pomoć.
              Modul je beta i ne predstavlja posredovanje pri zapošljavanju.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={toggleServices}
          disabled={settings === undefined || isSaving}
          className={`focus-ring relative h-8 w-14 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-55 ${
            isEnabled ? "border-moss bg-moss" : "border-ink/14 bg-white"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
              isEnabled ? "left-7" : "left-1"
            }`}
          />
          <span className="sr-only">
            {isEnabled ? "Isključi" : "Uključi"} Usluge i pomoć
          </span>
        </button>
      </div>
      {statusMessage ? (
        <p className="mt-3 text-sm font-black text-mossDark" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
      {settings === undefined ? (
        <p className="mt-3 text-xs font-black text-ink/52">Učitavanje postavke...</p>
      ) : null}
    </div>
  );
}

function AdminSectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-ink/64">{description}</p>
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="focus-ring h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-bold text-ink placeholder:text-ink/38"
      />
    </label>
  );
}

function AdminSelect({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-bold text-ink"
      >
        {children}
      </select>
    </label>
  );
}

function AdminActionButton({
  children,
  onClick,
  icon,
  danger = false
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-black transition ${
        danger
          ? "border-clay/20 bg-clay/8 text-clay hover:bg-clay/12"
          : "border-ink/12 bg-white text-ink hover:bg-field"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function AdminLinkButton({
  href,
  children,
  icon
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark"
    >
      {icon}
      {children}
    </Link>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "danger" | "warm" | "muted" }) {
  const className =
    tone === "danger"
      ? "bg-clay/10 text-clay"
      : tone === "warm"
        ? "bg-honey/18 text-[#72520d]"
        : tone === "muted"
          ? "bg-ink/8 text-ink/52"
          : "bg-moss/10 text-mossDark";

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function AdminMessage({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-lg bg-field p-3 text-sm font-black text-mossDark">{children}</p>;
}

function AdminEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-ink/18 bg-white p-5 text-sm font-black text-ink/58">
      {children}
    </div>
  );
}

function AdminLoading() {
  return <div className="h-28 animate-pulse rounded-lg border border-ink/10 bg-white" />;
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatAdminPrice(listing: Pick<AdminListing, "price" | "type">) {
  return typeof listing.price === "number" ? formatPrice(listing.price, listing.type) : formatPrice(null, listing.type);
}
