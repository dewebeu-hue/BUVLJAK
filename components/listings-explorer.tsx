"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bell, BookmarkPlus, CheckCircle2, Filter, Plus, Search, X } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { LocalSponsorStrip, type PublicLocalSponsor } from "@/components/local-sponsor-card";
import { useClientMounted } from "@/components/use-client-mounted";
import { api } from "@/convex/_generated/api";
import {
  demoListings,
  fromConvexListing,
  listingTypeFilterOptions,
  type Listing,
  type ListingType
} from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
const PAGE_SIZE = 20;
const savedSearchesEnabled = false;

type FeedFilters = {
  content: ContentType;
  search: string;
  quickFilter: QuickFilterValue;
  type: ListingType | "all";
  city: string;
  category: string;
  maxPrice: string;
  serviceCategory: string;
  serviceAvailability: string;
  serviceDealType: ServiceDealType;
};

type ContentType = "items" | "services";
type ServiceFilterValue = "service_offer" | "service_help";
type ServiceDealType = "all" | "negotiable" | "hourly" | "job" | "free_help";
type QuickFilterValue = ListingType | "all" | ServiceFilterValue;
type SearchParamsReader = {
  get: (name: string) => string | null;
};
type PublicMonetizationSettings = {
  featuredListingsEnabled: boolean;
};
type PublicFeatureFlags = {
  servicesEnabled: boolean;
};

const itemQuickFilterOptions: Array<{ value: QuickFilterValue; label: string }> = [...listingTypeFilterOptions];
const serviceQuickFilterOptions: Array<{ value: QuickFilterValue; label: string }> = [
  { value: "all", label: "Sve" },
  { value: "service_offer", label: "Nudim uslugu" },
  { value: "service_help", label: "Tražim pomoć" }
];
const serviceDealOptions: Array<{ value: ServiceDealType; label: string }> = [
  { value: "all", label: "Sve" },
  { value: "negotiable", label: "Po dogovoru" },
  { value: "hourly", label: "Po satu" },
  { value: "job", label: "Po poslu" },
  { value: "free_help", label: "Besplatna pomoć" }
];

function readFeedFiltersFromParams(params: SearchParamsReader): FeedFilters {
  const content = params.get("content") === "services" ? "services" : "items";
  const typeParam = params.get("type");
  const type =
    typeParam === "sell" ||
    typeParam === "give" ||
    typeParam === "swap" ||
    typeParam === "want"
      ? typeParam
      : "all";
  const serviceQuickFilter = serviceQuickFilterFromParam(params.get("service"));

  return {
    content,
    search: params.get("q") ?? "",
    quickFilter: content === "services" ? serviceQuickFilter : type,
    type,
    city: params.get("city") ?? "",
    category: content === "items" ? params.get("category") ?? "" : "",
    maxPrice: content === "items" ? params.get("maxPrice") ?? "" : "",
    serviceCategory: content === "services" ? params.get("serviceCategory") ?? "" : "",
    serviceAvailability: content === "services" ? params.get("availability") ?? "" : "",
    serviceDealType: content === "services" ? serviceDealTypeFromParam(params.get("dealType")) : "all"
  };
}

export function ListingsExplorer() {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const initialFilters = useMemo(
    () => readFeedFiltersFromParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey]
  );

  if (!hasConvexUrl) {
    return (
      <ListingsExplorerContent
        key={searchParamsKey || "all"}
        initialFilters={initialFilters}
        searchParamsKey={searchParamsKey}
        servicesEnabled={false}
        showFeatured={false}
        isServicesSettingLoading={false}
      />
    );
  }

  return <ConnectedListingsExplorer initialFilters={initialFilters} searchParamsKey={searchParamsKey} />;
}

function ConnectedListingsExplorer({
  initialFilters,
  searchParamsKey
}: {
  initialFilters: FeedFilters;
  searchParamsKey: string;
}) {
  const settings = useQuery(api.monetization.getMonetizationSettings) as
    | PublicMonetizationSettings
    | undefined;
  const featureFlags = useQuery(api.features.getPublicFeatureFlags) as
    | PublicFeatureFlags
    | undefined;

  return (
    <ListingsExplorerContent
      key={searchParamsKey || "all"}
      initialFilters={initialFilters}
      searchParamsKey={searchParamsKey}
      servicesEnabled={Boolean(featureFlags?.servicesEnabled)}
      showFeatured={Boolean(settings?.featuredListingsEnabled)}
      isServicesSettingLoading={featureFlags === undefined}
    />
  );
}

function ListingsExplorerContent({
  initialFilters,
  searchParamsKey,
  servicesEnabled,
  showFeatured,
  isServicesSettingLoading
}: {
  initialFilters: FeedFilters;
  searchParamsKey: string;
  servicesEnabled: boolean;
  showFeatured: boolean;
  isServicesSettingLoading: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [contentType, setContentType] = useState<ContentType>(initialFilters.content);
  const [search, setSearch] = useState(initialFilters.search);
  const [quickFilter, setQuickFilter] = useState<QuickFilterValue>(initialFilters.quickFilter);
  const [city, setCity] = useState(initialFilters.city);
  const [category, setCategory] = useState(initialFilters.category);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [serviceCategory, setServiceCategory] = useState(initialFilters.serviceCategory);
  const [serviceAvailability, setServiceAvailability] = useState(initialFilters.serviceAvailability);
  const [serviceDealType, setServiceDealType] = useState<ServiceDealType>(initialFilters.serviceDealType);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const isMounted = useClientMounted();
  const type = listingTypeFromQuickFilter(quickFilter);
  const isServicesContent = servicesEnabled && contentType === "services";
  const activeQuickFilterOptions = isServicesContent ? serviceQuickFilterOptions : itemQuickFilterOptions;
  const filterPanelColumns = isServicesContent ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";

  const filters = useMemo<FeedFilters>(
    () => ({
      content: contentType,
      search,
      quickFilter,
      type,
      city,
      category,
      maxPrice,
      serviceCategory,
      serviceAvailability,
      serviceDealType
    }),
    [
      category,
      city,
      contentType,
      maxPrice,
      quickFilter,
      search,
      serviceAvailability,
      serviceCategory,
      serviceDealType,
      type
    ]
  );
  const secondaryFilterCount = countSecondaryFilters(filters);

  useEffect(() => {
    if (isServicesSettingLoading || servicesEnabled || contentType !== "services") {
      return;
    }

    const nextParams = new URLSearchParams(searchParamsKey);
    nextParams.set("content", "items");
    nextParams.delete("type");
    clearServiceFilterParams(nextParams);
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [contentType, isServicesSettingLoading, pathname, router, searchParamsKey, servicesEnabled]);

  function updateContentType(nextContentType: ContentType) {
    if (nextContentType === "services" && !servicesEnabled) {
      return;
    }

    setContentType(nextContentType);
    setQuickFilter("all");
    setLimit(PAGE_SIZE);
    if (nextContentType === "services") {
      setCategory("");
      setMaxPrice("");
    } else {
      setServiceCategory("");
      setServiceAvailability("");
      setServiceDealType("all");
    }

    const nextParams = new URLSearchParams(searchParamsKey);
    nextParams.set("content", nextContentType);
    nextParams.delete("type");
    nextParams.delete("service");
    clearItemFilterParams(nextParams);
    clearServiceFilterParams(nextParams);
    syncTextParam(nextParams, "q", search);
    syncTextParam(nextParams, "city", city);

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  function updateQuickFilter(nextFilter: QuickFilterValue) {
    setQuickFilter(nextFilter);
    setLimit(PAGE_SIZE);

    const nextParams = new URLSearchParams(searchParamsKey);

    syncTextParam(nextParams, "q", search);
    syncTextParam(nextParams, "city", city);

    if (contentType === "services") {
      nextParams.set("content", "services");
      nextParams.delete("type");
      clearItemFilterParams(nextParams);
      syncServiceQuickFilterParam(nextParams, nextFilter);
      syncTextParam(nextParams, "serviceCategory", serviceCategory);
      syncTextParam(nextParams, "availability", serviceAvailability);
      syncServiceDealTypeParam(nextParams, serviceDealType);

      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      return;
    }

    if (nextFilter !== "all" && !isListingTypeFilter(nextFilter)) {
      return;
    }

    nextParams.set("content", "items");
    nextParams.delete("service");
    clearServiceFilterParams(nextParams);
    syncTextParam(nextParams, "category", category);
    syncTextParam(nextParams, "maxPrice", maxPrice);

    if (isListingTypeFilter(nextFilter)) {
      nextParams.set("type", nextFilter);
    } else {
      nextParams.delete("type");
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  function updateSecondaryFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setLimit(PAGE_SIZE);
  }

  function clearSecondaryFilters() {
    setCity("");
    const nextParams = new URLSearchParams(searchParamsKey);
    nextParams.delete("city");

    if (isServicesContent) {
      setServiceCategory("");
      setServiceAvailability("");
      setServiceDealType("all");
      clearServiceFilterParams(nextParams);
    } else {
      setCategory("");
      setMaxPrice("");
      clearItemFilterParams(nextParams);
    }

    setLimit(PAGE_SIZE);

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  return (
    <main className="bg-[#fbfcf7] pb-36">
      <section className="border-b border-ink/8 bg-[#fcf8f3] px-4 pb-5 pt-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-moss/14 bg-white/78 px-3 py-1 text-sm font-black text-mossDark shadow-sm">
                Nova Gradiška i okolica
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Aktivni oglasi</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-relaxed text-ink/64 sm:text-base">
                Razgledaj što se nudi u blizini ili pronađi nešto konkretno.
              </p>
            </div>
            <Link
              href="/novi-oglas"
              className="focus-ring hidden h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark md:inline-flex"
            >
              <Plus aria-hidden="true" size={18} />
              Objavi oglas
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:mt-6">
            <label className="relative block">
              <span className="sr-only">Što tražiš?</span>
              <Search
                aria-hidden="true"
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-moss"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setLimit(PAGE_SIZE);
                }}
                placeholder="Što tražiš?"
                className="focus-ring h-13 w-full rounded-xl border border-ink/12 bg-white py-3 pl-11 pr-4 text-base font-bold text-ink shadow-sm placeholder:text-ink/42"
              />
            </label>

            {servicesEnabled ? (
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-ink/10 bg-white p-1 shadow-sm">
                {[
                  { value: "items" as const, label: "Stvari" },
                  { value: "services" as const, label: "Usluge i pomoć" }
                ].map((option) => {
                  const isActive = option.value === contentType;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateContentType(option.value)}
                      className={`focus-ring min-h-11 rounded-lg px-3 text-sm font-black transition ${
                        isActive
                          ? "bg-moss text-white shadow-sm"
                          : "text-ink/68 hover:bg-field hover:text-ink"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 touch-pan-x sm:mx-0 sm:px-0" aria-label="Brzi filteri">
              {activeQuickFilterOptions.map((filter) => {
                const isActive = filter.value === quickFilter;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      updateQuickFilter(filter.value);
                    }}
                    className={`focus-ring h-12 shrink-0 snap-start rounded-full border px-5 text-sm font-black transition ${
                      isActive
                        ? "border-moss bg-moss text-white shadow-sm"
                        : "border-ink/12 bg-white text-ink/70 shadow-sm hover:bg-field"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-expanded={areFiltersOpen}
                aria-controls="feed-secondary-filters"
                onClick={() => setAreFiltersOpen((current) => !current)}
                className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink shadow-sm transition hover:bg-field"
              >
                {areFiltersOpen ? <X aria-hidden="true" size={16} /> : <Filter aria-hidden="true" size={16} />}
                Filteri
                {secondaryFilterCount > 0 ? (
                  <span className="rounded-full bg-moss px-2 py-0.5 text-xs text-white">{secondaryFilterCount}</span>
                ) : null}
              </button>
              {secondaryFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearSecondaryFilters}
                  className="focus-ring inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-black text-ink/58 transition hover:bg-white"
                >
                  Očisti
                </button>
              ) : null}
            </div>

            <div
              id="feed-secondary-filters"
              className={`${areFiltersOpen ? "grid" : "hidden"} mt-3 gap-3 rounded-xl border border-ink/10 bg-white/84 p-3 shadow-sm md:grid ${filterPanelColumns}`}
            >
              {isServicesContent ? (
                <>
                  <FilterInput
                    label="Grad ili područje"
                    value={city}
                    onChange={(value) => updateSecondaryFilter(setCity, value)}
                    placeholder="npr. Nova Gradiška"
                  />
                  <FilterInput
                    label="Kategorija usluge"
                    value={serviceCategory}
                    onChange={(value) => updateSecondaryFilter(setServiceCategory, value)}
                    placeholder="npr. Košnja, drva, kućni radovi"
                  />
                  <FilterInput
                    label="Kada treba?"
                    value={serviceAvailability}
                    onChange={(value) => updateSecondaryFilter(setServiceAvailability, value)}
                    placeholder="npr. ovaj tjedan"
                  />
                  <FilterSelect
                    label="Način dogovora"
                    value={serviceDealType}
                    onChange={(value) => {
                      setServiceDealType(value);
                      setLimit(PAGE_SIZE);
                    }}
                    options={serviceDealOptions}
                  />
                </>
              ) : (
                <>
                  <FilterInput
                    label="Grad"
                    value={city}
                    onChange={(value) => updateSecondaryFilter(setCity, value)}
                    placeholder="npr. Nova Gradiška"
                  />
                  <FilterInput
                    label="Kategorija"
                    value={category}
                    onChange={(value) => updateSecondaryFilter(setCategory, value)}
                    placeholder="npr. Namještaj"
                  />
                  <FilterInput
                    label="Cijena do"
                    value={maxPrice}
                    onChange={(value) => updateSecondaryFilter(setMaxPrice, value)}
                    placeholder="npr. 100"
                    type="number"
                  />
                </>
              )}
            </div>
          </div>

          {savedSearchesEnabled && contentType === "items" ? <SavedSearchPrompt filters={filters} /> : null}
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          {isServicesContent ? (
            <ServicesEmptyState />
          ) : !hasConvexUrl ? (
            <ListingsResults
              listings={demoListings}
              filters={filters}
              canLoadMore={false}
              isLoading={false}
              onLoadMore={() => undefined}
              showFeatured={false}
              feedSponsors={[]}
            />
          ) : null}
          {hasConvexUrl && !isServicesContent && !isMounted ? <ListingsSkeleton /> : null}
          {hasConvexUrl && !isServicesContent && isMounted ? (
            <ConnectedListingsResults
              filters={filters}
              limit={limit}
              setLimit={setLimit}
              showFeatured={showFeatured}
            />
          ) : null}
        </div>
      </section>

      <Link
        href="/novi-oglas"
        className="focus-ring fixed bottom-[calc(0.875rem+env(safe-area-inset-bottom))] left-4 right-4 z-30 inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-moss px-5 text-base font-black text-white shadow-soft transition hover:bg-mossDark md:hidden"
      >
        <Plus aria-hidden="true" size={20} />
        + Objavi oglas
      </Link>
    </main>
  );
}

function hasSearchIntent(filters: FeedFilters) {
  return Boolean(
    filters.search.trim() ||
      filters.quickFilter !== "all" ||
      filters.city.trim() ||
      (filters.content === "services"
        ? filters.serviceCategory.trim() ||
          filters.serviceAvailability.trim() ||
          filters.serviceDealType !== "all"
        : filters.category.trim() || filters.maxPrice.trim())
  );
}

function isListingTypeFilter(value: QuickFilterValue): value is ListingType {
  return value === "sell" || value === "give" || value === "swap" || value === "want";
}

function isServiceFilter(value: QuickFilterValue): value is ServiceFilterValue {
  return value === "service_offer" || value === "service_help";
}

function listingTypeFromQuickFilter(value: QuickFilterValue): ListingType | "all" {
  if (isListingTypeFilter(value)) {
    return value;
  }

  return "all";
}

function countSecondaryFilters(filters: FeedFilters) {
  const textFilterCount =
    filters.content === "services"
      ? [filters.city, filters.serviceCategory, filters.serviceAvailability].filter((value) => value.trim())
          .length
      : [filters.city, filters.category, filters.maxPrice].filter((value) => value.trim()).length;

  return textFilterCount + (filters.content === "services" && filters.serviceDealType !== "all" ? 1 : 0);
}

function syncTextParam(params: URLSearchParams, key: string, value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue) {
    params.set(key, normalizedValue);
  } else {
    params.delete(key);
  }
}

function clearItemFilterParams(params: URLSearchParams) {
  params.delete("category");
  params.delete("maxPrice");
}

function clearServiceFilterParams(params: URLSearchParams) {
  params.delete("service");
  params.delete("serviceCategory");
  params.delete("availability");
  params.delete("dealType");
}

function serviceQuickFilterFromParam(value: string | null): QuickFilterValue {
  if (value === "offer") {
    return "service_offer";
  }

  if (value === "help") {
    return "service_help";
  }

  return "all";
}

function syncServiceQuickFilterParam(params: URLSearchParams, value: QuickFilterValue) {
  if (value === "service_offer") {
    params.set("service", "offer");
    return;
  }

  if (value === "service_help") {
    params.set("service", "help");
    return;
  }

  params.delete("service");
}

function serviceDealTypeFromParam(value: string | null): ServiceDealType {
  return value === "negotiable" || value === "hourly" || value === "job" || value === "free_help"
    ? value
    : "all";
}

function syncServiceDealTypeParam(params: URLSearchParams, value: ServiceDealType) {
  if (value === "all") {
    params.delete("dealType");
    return;
  }

  params.set("dealType", value);
}

function listingMatchesQuickFilter(listing: Listing, quickFilter: QuickFilterValue) {
  if (quickFilter === "all") {
    return true;
  }

  if (isListingTypeFilter(quickFilter)) {
    return listing.type === quickFilter;
  }

  if (isServiceFilter(quickFilter)) {
    return true;
  }

  return true;
}

function SavedSearchPrompt({ filters }: { filters: FeedFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!hasSearchIntent(filters)) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-moss/14 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-moss/10 text-mossDark">
            <Bell aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-base font-black text-ink">Spremi ovu potragu</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/62">
              Spremi što tražiš, Buvljak ti javi kad se pojavi nešto slično.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          {isOpen ? <X aria-hidden="true" size={17} /> : <BookmarkPlus aria-hidden="true" size={17} />}
          Spremi potragu
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 border-t border-ink/8 pt-4">
          <Show when="signed-out">
            <div className="rounded-lg bg-honey/16 p-4">
              <p className="text-sm font-black text-ink">
                Prijavi se da možeš spremiti potragu i dobiti obavijest.
              </p>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="focus-ring mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
                >
                  Prijava
                </button>
              </SignInButton>
            </div>
          </Show>

          <Show when="signed-in">
            {hasConvexUrl ? (
              <ConnectedSavedSearchForm key={filtersKey(filters)} filters={filters} />
            ) : (
              <div className="rounded-lg bg-honey/16 p-4 text-sm font-semibold text-ink/68">
                Convex još nije povezan, pa spremanje potrage trenutno radi samo u pravoj bazi.
              </div>
            )}
          </Show>
        </div>
      ) : null}
    </div>
  );
}

function ConnectedSavedSearchForm({ filters }: { filters: FeedFilters }) {
  const createSavedSearch = useMutation(api.savedSearches.createSavedSearch);
  const [query, setQuery] = useState(filters.search);
  const [city, setCity] = useState(filters.city || "Nova Gradiška");
  const [category, setCategory] = useState(filters.category);
  const [type, setType] = useState<ListingType | "all">(filters.type);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("");

    const parsedMaxPrice = Number(maxPrice);

    try {
      await createSavedSearch({
        ...(query.trim() ? { query: query.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(category.trim() ? { category: category.trim() } : {}),
        ...(type !== "all" ? { type } : {}),
        ...(maxPrice.trim() && Number.isFinite(parsedMaxPrice) ? { maxPrice: parsedMaxPrice } : {}),
        notifyByEmail,
        isActive: true
      });
      setStatusMessage("Potraga je spremljena. Javit ćemo ti kad se pojavi nešto slično.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Potragu trenutno nije moguće spremiti."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <SavedSearchField label="Naziv/upit potrage" value={query} onChange={setQuery} placeholder="npr. perilica" />
        <SavedSearchField label="Grad" value={city} onChange={setCity} placeholder="Nova Gradiška" />
        <SavedSearchField label="Kategorija" value={category} onChange={setCategory} placeholder="npr. Namještaj" />
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
        <SavedSearchField
          label="Cijena do"
          value={maxPrice}
          onChange={setMaxPrice}
          placeholder="npr. 100"
          type="number"
        />
      </div>

      <label className="flex items-start gap-3 rounded-lg bg-field p-3">
        <input
          type="checkbox"
          checked={notifyByEmail}
          onChange={(event) => setNotifyByEmail(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-ink/20 accent-moss"
        />
        <span>
          <span className="block text-sm font-black text-ink">
            Pošalji mi email kad se pojavi nešto slično
          </span>
          <span className="mt-1 block text-xs font-semibold leading-relaxed text-ink/58">
            Email ne sadrži privatne kontakt podatke oglašivača.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          <BookmarkPlus aria-hidden="true" size={17} />
          {isSaving ? "Spremanje..." : "Spremi potragu"}
        </button>
        {statusMessage ? (
          <p className="inline-flex items-center gap-2 text-sm font-black text-mossDark" aria-live="polite">
            <CheckCircle2 aria-hidden="true" size={17} />
            {statusMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function SavedSearchField({
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

function filtersKey(filters: FeedFilters) {
  return [
    filters.content,
    filters.search,
    filters.type,
    filters.city,
    filters.category,
    filters.maxPrice,
    filters.serviceCategory,
    filters.serviceAvailability,
    filters.serviceDealType
  ].join("|");
}

function ConnectedListingsResults({
  filters,
  limit,
  setLimit,
  showFeatured
}: {
  filters: FeedFilters;
  limit: number;
  setLimit: (next: number | ((current: number) => number)) => void;
  showFeatured: boolean;
}) {
  const maxPriceNumber = Number(filters.maxPrice);
  const queryArgs = {
    limit,
    ...(filters.type !== "all" ? { type: filters.type } : {}),
    ...(filters.city.trim() ? { city: filters.city.trim() } : {}),
    ...(filters.category.trim() ? { category: filters.category.trim() } : {}),
    ...(Number.isFinite(maxPriceNumber) && filters.maxPrice.trim()
      ? { maxPrice: maxPriceNumber }
      : {})
  };
  const convexListings = useQuery(api.listings.listActiveListings, queryArgs);
  const feedSponsors = useQuery(api.monetization.listVisibleLocalSponsors, {
    placement: "feed"
  }) as PublicLocalSponsor[] | undefined;
  const rawListings = useMemo<Listing[]>(
    () => convexListings?.map(fromConvexListing) ?? [],
    [convexListings]
  );

  return (
    <ListingsResults
      listings={rawListings}
      filters={filters}
      isLoading={convexListings === undefined}
      canLoadMore={convexListings !== undefined && rawListings.length >= limit}
      onLoadMore={() => setLimit((current) => current + PAGE_SIZE)}
      showFeatured={showFeatured}
      feedSponsors={feedSponsors ?? []}
    />
  );
}

function ListingsResults({
  listings,
  filters,
  isLoading,
  canLoadMore,
  onLoadMore,
  showFeatured,
  feedSponsors
}: {
  listings: Listing[];
  filters: FeedFilters;
  isLoading: boolean;
  canLoadMore: boolean;
  onLoadMore: () => void;
  showFeatured: boolean;
  feedSponsors: PublicLocalSponsor[];
}) {
  const filteredListings = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const normalizedCity = filters.city.trim().toLowerCase();
    const normalizedCategory = filters.category.trim().toLowerCase();
    const parsedMaxPrice = Number(filters.maxPrice);

    return listings.filter((listing) => {
      const matchesSearch =
        !normalizedSearch ||
        `${listing.title} ${listing.description} ${listing.city} ${listing.category}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesQuickFilter = listingMatchesQuickFilter(listing, filters.quickFilter);
      const matchesCity = !normalizedCity || listing.city.toLowerCase().includes(normalizedCity);
      const matchesCategory =
        !normalizedCategory || listing.category.toLowerCase().includes(normalizedCategory);
      const matchesPrice =
        !filters.maxPrice.trim() ||
        !Number.isFinite(parsedMaxPrice) ||
        listing.price === null ||
        listing.price <= parsedMaxPrice;

      return matchesSearch && matchesQuickFilter && matchesCity && matchesCategory && matchesPrice;
    });
  }, [filters, listings]);

  return (
    <>
      {isLoading ? <ListingsSkeleton /> : null}
      {!isLoading && filteredListings.length > 0 ? (
        <div className="mx-auto grid max-w-xl gap-4 sm:max-w-3xl sm:grid-cols-2 lg:max-w-4xl">
          {filteredListings.map((listing, index) => {
            const sponsorInsertIndex = filteredListings.length >= 4 ? 2 : filteredListings.length - 1;

            return (
              <Fragment key={listing.id}>
                <ListingCard listing={listing} showFeatured={showFeatured} />
                {feedSponsors.length > 0 && index === sponsorInsertIndex ? (
                  <LocalSponsorStrip
                    sponsors={feedSponsors}
                    className="sm:col-span-2"
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      ) : null}
      {!isLoading && filteredListings.length === 0 ? <EmptyListingsState /> : null}

      {!isLoading && filteredListings.length > 0 ? (
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={!canLoadMore}
            className="focus-ring inline-flex h-12 items-center justify-center rounded-lg border border-ink/12 bg-white px-5 text-base font-black text-ink shadow-sm transition hover:bg-field disabled:cursor-not-allowed disabled:text-ink/35"
          >
            {canLoadMore ? "Učitaj još oglasa" : "Sve učitano"}
          </button>
        </div>
      ) : null}
    </>
  );
}

function FilterInput({
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
      <span className="mb-2 inline-flex items-center gap-2 text-sm font-black text-ink">
        <Filter aria-hidden="true" size={16} className="text-moss" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className="focus-ring h-12 w-full rounded-lg border border-ink/12 bg-white px-4 text-sm font-bold text-ink placeholder:text-ink/38"
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: ServiceDealType;
  onChange: (value: ServiceDealType) => void;
  options: Array<{ value: ServiceDealType; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 inline-flex items-center gap-2 text-sm font-black text-ink">
        <Filter aria-hidden="true" size={16} className="text-moss" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ServiceDealType)}
        className="focus-ring h-12 w-full rounded-lg border border-ink/12 bg-white px-4 text-sm font-bold text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListingsSkeleton() {
  return (
    <div className="mx-auto grid max-w-xl gap-4 sm:max-w-3xl sm:grid-cols-2 lg:max-w-4xl" aria-label="Oglasi se učitavaju">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[34rem] animate-pulse rounded-xl border border-ink/10 bg-white shadow-sm"
        >
          <div className="aspect-[4/3] rounded-t-xl bg-ink/8" />
          <div className="space-y-4 p-4">
            <div className="h-7 w-28 rounded-full bg-ink/8" />
            <div className="h-7 w-4/5 rounded bg-ink/8" />
            <div className="h-11 rounded bg-ink/8" />
            <div className="h-11 rounded bg-ink/8" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 rounded-lg bg-ink/8" />
              <div className="h-11 rounded-lg bg-ink/8" />
              <div className="h-11 rounded-lg bg-ink/8" />
              <div className="h-11 rounded-lg bg-ink/8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyListingsState() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-dashed border-moss/24 bg-white p-7 text-center shadow-sm sm:p-8">
      <h2 className="text-xl font-black text-ink">Još nema aktivnih oglasa u tvojoj blizini.</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/64">
        Promijeni filtere ili objavi prvi oglas za svoju ulicu, kvart ili selo.
      </p>
      <Link
        href="/novi-oglas"
        className="focus-ring mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-moss px-5 text-sm font-black text-white transition hover:bg-mossDark"
      >
        <Plus aria-hidden="true" size={18} />
        Objavi prvi oglas
      </Link>
    </div>
  );
}

function ServicesEmptyState() {
  return (
    <div className="mx-auto mb-24 max-w-xl rounded-xl border border-dashed border-moss/24 bg-white p-7 text-center shadow-sm sm:p-8 md:mb-0">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-moss/10 text-mossDark">
        <Filter aria-hidden="true" size={22} />
      </span>
      <h2 className="mt-4 text-xl font-black text-ink">Usluge i pomoć još su u beta pripremi.</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/64">
        Uskoro ćeš ovdje moći pronaći košnju, drva, kućne radove, prijevoz i lokalnu pomoć.
      </p>
      <p className="mx-auto mt-4 max-w-2xl rounded-lg border border-honey/24 bg-honey/14 p-3 text-sm font-bold leading-relaxed text-ink/70">
        Buvljak.hr ne zapošljava, ne posreduje pri zapošljavanju i ne sudjeluje u plaćanju.
        Korisnici se sami dogovaraju oko uvjeta, termina i cijene.
      </p>
      <button
        type="button"
        disabled
        className="mt-5 inline-flex h-12 cursor-not-allowed items-center justify-center rounded-lg border border-ink/12 bg-field px-5 text-sm font-black text-ink/54"
      >
        Objava usluga uskoro
      </button>
    </div>
  );
}
