import { mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const demoListings: Array<
  Omit<
    Pick<
      Doc<"listings">,
      | "type"
      | "title"
      | "description"
      | "city"
      | "category"
      | "price"
      | "priceType"
      | "contactMethod"
      | "allowOffers"
      | "images"
    >,
    "price"
  > & { price?: number }
> = [
  {
    type: "sell",
    title: "Dječji bicikl 20”",
    description: "Očuvan bicikl za školarca, normalni tragovi korištenja i spreman za vožnju.",
    city: "Nova Gradiška",
    category: "Djeca",
    price: 65,
    priceType: "fixed",
    contactMethod: "whatsapp",
    allowOffers: true,
    images: []
  },
  {
    type: "give",
    title: "Poklanjam kauč",
    description: "Trosjed za preuzimanje ovaj tjedan. Treba organizirati vlastiti prijevoz.",
    city: "Cernik",
    category: "Namještaj",
    priceType: "free",
    contactMethod: "facebook",
    allowOffers: false,
    images: []
  },
  {
    type: "want",
    title: "Tražim perilicu do 100 €",
    description: "Treba mi ispravna perilica za stan, može stariji model ako radi uredno.",
    city: "Rešetari",
    category: "Kućanski aparati",
    price: 100,
    priceType: "wanted",
    contactMethod: "email",
    allowOffers: true,
    images: []
  },
  {
    type: "swap",
    title: "Mijenjam stolice za policu",
    description: "Četiri kuhinjske stolice mijenjam za jednostavnu policu ili manji regal.",
    city: "Nova Gradiška",
    category: "Namještaj",
    priceType: "swap",
    contactMethod: "whatsapp",
    allowOffers: true,
    images: []
  },
  {
    type: "sell",
    title: "Prodajem peć na drva",
    description: "Peć je korištena dvije sezone, dobra za radionicu, garažu ili manju kuću.",
    city: "Okučani",
    category: "Dom",
    price: 180,
    priceType: "fixed",
    contactMethod: "facebook",
    allowOffers: true,
    images: []
  },
  {
    type: "give",
    title: "Poklanjam dječju odjeću",
    description: "Vreća odjeće za djevojčicu, veličine uglavnom 98-110, čisto i složeno.",
    city: "Nova Gradiška",
    category: "Djeca",
    priceType: "free",
    contactMethod: "whatsapp",
    allowOffers: false,
    images: []
  },
  {
    type: "want",
    title: "Tražim ormar",
    description: "Tražim uži ormar za hodnik. Može rabljeno, bitno da su vrata ispravna.",
    city: "Staro Petrovo Selo",
    category: "Namještaj",
    priceType: "wanted",
    contactMethod: "email",
    allowOffers: true,
    images: []
  },
  {
    type: "swap",
    title: "Mijenjam alat za kosilicu",
    description: "Imam višak ručnog alata i tražim ispravnu električnu kosilicu za manje dvorište.",
    city: "Davor",
    category: "Vrt i alat",
    priceType: "swap",
    contactMethod: "facebook",
    allowOffers: true,
    images: []
  }
];

export const seedDemoListings = mutation({
  args: {},
  handler: async (ctx) => {
    const existingDemo = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("title"), "Dječji bicikl 20”"))
      .first();

    if (existingDemo) {
      return {
        inserted: 0,
        skipped: true
      };
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    for (let index = 0; index < demoListings.length; index += 1) {
      const listing = demoListings[index];

      await ctx.db.insert("listings", {
        ...listing,
        status: "active",
        contactVisibility: "hidden_until_click",
        viewCount: 0,
        contactClickCount: 0,
        shareCount: 0,
        saveCount: 0,
        createdAt: now - index * day,
        updatedAt: now - index * day
      });
    }

    return {
      inserted: demoListings.length,
      skipped: false
    };
  }
});
