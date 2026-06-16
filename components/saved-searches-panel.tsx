"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Eye,
  Pause,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  UserRound
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice, listingTypeFilterOptions, listingTypeLabels, type ListingType } from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type SavedSearch = {
  id: string;
  query: string;
  city?: string;
  category?: string;
  type?: ListingType;
  maxPrice?: number;
  isActive: boolean;
  notifyByEmail: boolean;
  lastNotifiedAt?: number;
  createdAt: number;
  updatedAt: number;
  matchCount: number;
};

export function SavedSearchesPanel() {
  const { isLoaded, isSignedIn } = useUser();
  const convexAuth = useConvexAuth();

  if (!isLoaded) {
    return <SavedSearchesSkeleton />;
  }

  if (!isSignedIn) {
    return <SavedSearchesLoginRequired />;
  }

  if (!hasConvexUrl) {
    return <LocalSavedSearchesFallback />;
  }

  if (convexAuth.isLoading) {
    return <SavedSearchesSkeleton />;
  }

  if (!convexAuth.isAuthenticated) {
    return (
      <SavedSearchesAuthProblem message="Nismo uspjeli učitati potrage. Provjeri prijavu i pokušaj ponovno." />
    );
  }

  return <ConnectedSavedSearches />;
}

function SavedSearchesLoginRequired() {
  return (
    <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-5">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
          <UserRound aria-hidden="true" size={21} />
        </span>
        <div>
          <h2 className="text-xl font-black text-ink">Prijavi se za spremljene potrage</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
            Prijavi se da možeš spremati i pratiti potrage.
          </p>
          <Link
            href="/sign-in"
            className="focus-ring mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
          >
            Prijava
          </Link>
        </div>
      </div>
    </section>
  );
}

function SavedSearchesAuthProblem({ message }: { message: string }) {
  return (
    <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-5">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
          <UserRound aria-hidden="true" size={21} />
        </span>
        <div>
          <h2 className="text-xl font-black text-ink">Potrage trenutno nisu dostupne</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">{message}</p>
        </div>
      </div>
    </section>
  );
}

function ConnectedSavedSearches() {
  const searches = useQuery(api.savedSearches.listMySavedSearches) as SavedSearch[] | undefined;
  const updateSavedSearch = useMutation(api.savedSearches.updateSavedSearch);
  const deleteSavedSearch = useMutation(api.savedSearches.deleteSavedSearch);
  const toggleSavedSearchActive = useMutation(api.savedSearches.toggleSavedSearchActive);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  async function runAction(search: SavedSearch, action: () => Promise<unknown>, success: string) {
    setPendingId(search.id);
    setStatusMessage("");

    try {
      await action();
      setStatusMessage(success);
    } catch {
      setStatusMessage("Za ovu akciju moraš biti prijavljen/a.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(search: SavedSearch) {
    if (!window.confirm("Obrisati ovu spremljenu potragu?")) {
      return;
    }

    await runAction(
      search,
      () => deleteSavedSearch({ id: search.id as Id<"savedSearches"> }),
      "Potraga je obrisana."
    );
  }

  if (searches === undefined) {
    return <SavedSearchesSkeleton />;
  }

  if (searches.length === 0) {
    return <EmptySavedSearches />;
  }

  return (
    <section className="mt-7">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black text-ink/60">
          {searches.length} spremljenih potraga
        </p>
        {statusMessage ? (
          <p className="inline-flex items-center gap-2 text-sm font-black text-mossDark" aria-live="polite">
            <CheckCircle2 aria-hidden="true" size={17} />
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4">
        {searches.map((search) => (
          <SavedSearchCard
            key={search.id}
            search={search}
            isPending={pendingId === search.id}
            isEditing={editingId === search.id}
            onToggleActive={() =>
              runAction(
                search,
                () =>
                  toggleSavedSearchActive({
                    id: search.id as Id<"savedSearches">,
                    isActive: !search.isActive
                  }),
                search.isActive ? "Potraga je pauzirana." : "Potraga je aktivirana."
              )
            }
            onToggleEmail={() =>
              runAction(
                search,
                () =>
                  updateSavedSearch({
                    id: search.id as Id<"savedSearches">,
                    notifyByEmail: !search.notifyByEmail
                  }),
                search.notifyByEmail ? "Email obavijesti su isključene." : "Email obavijesti su uključene."
              )
            }
            onDelete={() => handleDelete(search)}
            onEdit={() => setEditingId(editingId === search.id ? null : search.id)}
            onSaveEdit={(values) =>
              runAction(
                search,
                () =>
                  updateSavedSearch({
                    id: search.id as Id<"savedSearches">,
                    ...values
                  }),
                "Potraga je ažurirana."
              ).then(() => setEditingId(null))
            }
          />
        ))}
      </div>
    </section>
  );
}

function LocalSavedSearchesFallback() {
  return (
    <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-5">
      <h2 className="text-xl font-black text-ink">Spremljene potrage trenutno nisu dostupne</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
        Pokušaj ponovno za nekoliko trenutaka.
      </p>
    </section>
  );
}

function SavedSearchCard({
  search,
  isPending,
  isEditing,
  onToggleActive,
  onToggleEmail,
  onDelete,
  onEdit,
  onSaveEdit
}: {
  search: SavedSearch;
  isPending: boolean;
  isEditing: boolean;
  onToggleActive: () => void;
  onToggleEmail: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSaveEdit: (values: {
    query?: string;
    city?: string;
    category?: string;
    type?: ListingType;
    maxPrice?: number;
    notifyByEmail: boolean;
    isActive: boolean;
  }) => Promise<void>;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                search.isActive ? "bg-moss/10 text-mossDark" : "bg-ink/8 text-ink/52"
              }`}
            >
              {search.isActive ? "Aktivno" : "Pauzirano"}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                search.notifyByEmail ? "bg-honey/18 text-[#72520d]" : "bg-ink/8 text-ink/52"
              }`}
            >
              {search.notifyByEmail ? <Bell aria-hidden="true" size={13} /> : <BellOff aria-hidden="true" size={13} />}
              {search.notifyByEmail ? "Email uključen" : "Email isključen"}
            </span>
            <span className="rounded-full bg-field px-3 py-1 text-xs font-black text-ink/62">
              {search.matchCount} rezultata sada
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-ink">{searchTitle(search)}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-ink/62">
            {search.query ? <SearchPill label={`Upit: ${search.query}`} /> : null}
            {search.city ? <SearchPill label={search.city} /> : null}
            {search.category ? <SearchPill label={search.category} /> : null}
            {search.type ? <SearchPill label={listingTypeLabels[search.type]} /> : null}
            {typeof search.maxPrice === "number" ? (
              <SearchPill label={`Do ${formatPrice(search.maxPrice)}`} />
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[28rem]">
          <Link
            href={resultsHref(search)}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark"
          >
            <Eye aria-hidden="true" size={16} />
            Pogledaj rezultate
          </Link>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={isPending}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:text-ink/35"
          >
            {search.isActive ? <Pause aria-hidden="true" size={16} /> : <RotateCcw aria-hidden="true" size={16} />}
            {search.isActive ? "Pauziraj" : "Aktiviraj"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={isPending}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:text-ink/35"
          >
            <Pencil aria-hidden="true" size={16} />
            Uredi
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-clay/20 bg-clay/8 px-3 text-sm font-black text-clay transition hover:bg-clay/12 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 aria-hidden="true" size={16} />
            Obriši
          </button>
          <button
            type="button"
            onClick={onToggleEmail}
            disabled={isPending}
            className="focus-ring sm:col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-honey/28 bg-honey/14 px-3 text-sm font-black text-[#72520d] transition hover:bg-honey/22 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {search.notifyByEmail ? <BellOff aria-hidden="true" size={16} /> : <Bell aria-hidden="true" size={16} />}
            {search.notifyByEmail ? "Isključi email obavijesti" : "Uključi email obavijesti"}
          </button>
        </div>
      </div>

      {isEditing ? (
        <EditSavedSearchForm
          key={search.id}
          search={search}
          onSave={onSaveEdit}
          isSaving={isPending}
        />
      ) : null}
    </article>
  );
}

function EditSavedSearchForm({
  search,
  onSave,
  isSaving
}: {
  search: SavedSearch;
  onSave: (values: {
    query?: string;
    city?: string;
    category?: string;
    type?: ListingType;
    maxPrice?: number;
    notifyByEmail: boolean;
    isActive: boolean;
  }) => Promise<void>;
  isSaving: boolean;
}) {
  const [query, setQuery] = useState(search.query);
  const [city, setCity] = useState(search.city ?? "Nova Gradiška");
  const [category, setCategory] = useState(search.category ?? "");
  const [type, setType] = useState<ListingType | "all">(search.type ?? "all");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice?.toString() ?? "");
  const [notifyByEmail, setNotifyByEmail] = useState(search.notifyByEmail);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedMaxPrice = Number(maxPrice);

    await onSave({
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(type !== "all" ? { type } : {}),
      ...(maxPrice.trim() && Number.isFinite(parsedMaxPrice) ? { maxPrice: parsedMaxPrice } : {}),
      notifyByEmail,
      isActive: search.isActive
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border-t border-ink/8 pt-5">
      <div className="grid gap-3 md:grid-cols-2">
        <SearchInput label="Upit" value={query} onChange={setQuery} placeholder="npr. perilica" />
        <SearchInput label="Grad" value={city} onChange={setCity} placeholder="Nova Gradiška" />
        <SearchInput label="Kategorija" value={category} onChange={setCategory} placeholder="npr. Namještaj" />
        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink">Tip</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ListingType | "all")}
            className="focus-ring h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-bold text-ink"
          >
            {listingTypeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "all" ? "Svi tipovi" : option.label}
              </option>
            ))}
          </select>
        </label>
        <SearchInput label="Cijena do" value={maxPrice} onChange={setMaxPrice} placeholder="npr. 100" type="number" />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-lg bg-field p-3">
        <input
          type="checkbox"
          checked={notifyByEmail}
          onChange={(event) => setNotifyByEmail(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-ink/20 accent-moss"
        />
        <span className="text-sm font-black text-ink">
          Pošalji mi email kad se pojavi nešto slično
        </span>
      </label>

      <button
        type="submit"
        disabled={isSaving}
        className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        <CheckCircle2 aria-hidden="true" size={17} />
        {isSaving ? "Spremanje..." : "Spremi izmjene"}
      </button>
    </form>
  );
}

function SearchInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className="focus-ring h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-bold text-ink placeholder:text-ink/38"
      />
    </label>
  );
}

function SearchPill({ label }: { label: string }) {
  return <span className="rounded-full bg-field px-3 py-1">{label}</span>;
}

function EmptySavedSearches() {
  return (
    <section className="mt-7 rounded-lg border border-dashed border-ink/18 bg-white p-6">
      <h2 className="text-xl font-black text-ink">Još nemaš spremljenih potraga.</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/64">
        Kreni od oglasa, upiši što tražiš i spremi potragu jednim klikom.
      </p>
      <Link
        href="/oglasi"
        className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
      >
        <Search aria-hidden="true" size={18} />
        Pogledaj oglase
      </Link>
    </section>
  );
}

function SavedSearchesSkeleton() {
  return (
    <div className="mt-7 grid gap-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-lg border border-ink/10 bg-white" />
      ))}
    </div>
  );
}

function searchTitle(search: SavedSearch) {
  if (search.query) {
    return search.query;
  }

  if (search.category) {
    return search.category;
  }

  if (search.type) {
    return listingTypeLabels[search.type];
  }

  return "Spremljena potraga";
}

function resultsHref(search: SavedSearch) {
  const params = new URLSearchParams();

  if (search.query) {
    params.set("q", search.query);
  }
  if (search.city) {
    params.set("city", search.city);
  }
  if (search.category) {
    params.set("category", search.category);
  }
  if (search.type) {
    params.set("type", search.type);
  }
  if (typeof search.maxPrice === "number") {
    params.set("maxPrice", String(search.maxPrice));
  }

  return `/oglasi${params.toString() ? `?${params.toString()}` : ""}`;
}
