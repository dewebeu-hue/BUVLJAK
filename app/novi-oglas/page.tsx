import { Camera, ChevronDown, FileText, ImagePlus, Send } from "lucide-react";
import { contactMethodLabels, listingTypeLabels } from "@/lib/listings";

const listingTypes = [
  { value: "sell", label: listingTypeLabels.sell },
  { value: "give", label: listingTypeLabels.give },
  { value: "swap", label: listingTypeLabels.swap },
  { value: "want", label: listingTypeLabels.want }
];

const contactMethods = [
  { value: "whatsapp", label: contactMethodLabels.whatsapp },
  { value: "email", label: contactMethodLabels.email },
  { value: "facebook", label: contactMethodLabels.facebook },
  { value: "none", label: "Bez kontakta, samo želim tekst za objavu" }
];

export default function NewListingPage() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section>
          <span className="inline-flex rounded-full bg-honey/24 px-3 py-1 text-sm font-black text-[#72520d]">
            Novi oglas
          </span>
          <h1 className="mt-3 text-4xl font-black leading-tight text-ink">Objavi nešto za susjedstvo</h1>

          <form className="mt-6 space-y-6 rounded-lg border border-ink/10 bg-white p-4 shadow-sm sm:p-6">
            <fieldset>
              <legend className="text-sm font-black text-ink">Tip oglasa</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {listingTypes.map((type, index) => (
                  <label
                    key={type.value}
                    className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-moss"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      defaultChecked={index === 0}
                      className="peer sr-only"
                    />
                    <span className="grid h-12 cursor-pointer place-items-center rounded-lg border border-ink/12 bg-field px-3 text-sm font-black text-ink/68 transition peer-checked:border-moss peer-checked:bg-moss peer-checked:text-white">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-black text-ink">Naslov</span>
                <input
                  type="text"
                  placeholder="Npr. Prodajem peć na drva"
                  className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
                />
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-black text-ink">Opis</span>
                <textarea
                  rows={5}
                  placeholder="Ukratko napiši stanje, preuzimanje i važne detalje."
                  className="focus-ring resize-y rounded-lg border border-ink/12 bg-field px-4 py-3 text-base font-semibold leading-relaxed text-ink placeholder:text-ink/38"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-ink">Grad</span>
                <input
                  type="text"
                  placeholder="Nova Gradiška"
                  className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-ink">Kategorija</span>
                <span className="relative">
                  <select className="focus-ring h-12 w-full appearance-none rounded-lg border border-ink/12 bg-field px-4 pr-10 text-base font-semibold text-ink">
                    <option>Namještaj</option>
                    <option>Djeca</option>
                    <option>Dom</option>
                    <option>Vrt i alat</option>
                    <option>Kućanski aparati</option>
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/48"
                  />
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-ink">Cijena</span>
                <input
                  type="text"
                  placeholder="Npr. 40 € ili po dogovoru"
                  className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-black text-ink">Slike</span>
                <button
                  type="button"
                  className="focus-ring flex h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-moss/38 bg-moss/8 px-4 text-sm font-black text-mossDark transition hover:bg-moss/12"
                >
                  <ImagePlus aria-hidden="true" size={18} />
                  Dodaj slike
                </button>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-black text-ink">Način kontakta</legend>
              <div className="mt-3 grid gap-2">
                {contactMethods.map((method, index) => (
                  <label
                    key={method.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-field px-4 py-3"
                  >
                    <input
                      type="radio"
                      name="contactMethod"
                      value={method.value}
                      defaultChecked={index === 0}
                      className="h-4 w-4 accent-moss"
                    />
                    <span className="font-bold text-ink/76">{method.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-moss px-5 text-base font-black text-white transition hover:bg-mossDark sm:w-auto"
            >
              Nastavi
              <Send aria-hidden="true" size={18} />
            </button>
          </form>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-skywash text-mossDark">
                <Camera aria-hidden="true" size={21} />
              </span>
              <h2 className="text-xl font-black text-ink">Slike placeholder</h2>
            </div>
            <div className="mt-5 grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-ink/18 bg-field">
              <span className="text-sm font-black text-ink/45">Ovdje ide prva slika oglasa</span>
            </div>
          </div>

          <div className="rounded-lg border border-moss/16 bg-moss/8 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
                <FileText aria-hidden="true" size={21} />
              </span>
              <div>
                <h2 className="text-xl font-black text-ink">Preview objave</h2>
                <p className="mt-2 leading-relaxed text-ink/66">
                  Tekst za Facebook objavu pojavit će se ovdje u sljedećem koraku.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
