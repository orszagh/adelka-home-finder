/**
 * "Platené reklamy" from Lubko: the app is free, except it isn't. Cheeky
 * and flirty on purpose (Ľubo asked for bold). One at a time, in order,
 * at least AD_GAP_MS apart, remembered in the browser.
 */
export type Ad = {
  /** Which photo from /public/lubko (1–3). */
  photo: 1 | 2 | 3;
  eyebrow: string;
  headline: string;
  text: string;
  pay: string;
  agree: string;
  /** Shown after paying. {kisses} becomes the running total. */
  paid: string;
};

export const ADS: Ad[] = [
  {
    photo: 1,
    eyebrow: "Dôležité oznámenie",
    headline: "Táto appka je zadarmo.",
    text: "Teda skoro. Za každých desať domčekov sa platí jednou pusou. Splatnosť: okamžite. Pokuta za omeškanie: dve.",
    pay: "Zaplatiť pusou",
    agree: "Súhlasím s ďalšími reklamami",
    paid: "Platba prijatá. Doručenie do 24 hodín. Aktuálny stav účtu: {kisses} {kissesWord}.",
  },
  {
    photo: 2,
    eyebrow: "Nová služba",
    headline: "Lubko Premium™",
    text: "Bez reklám, s neobmedzenými masážami chrbta a raňajkami do postele. Cena: jedna noc bez výhovorky „bolí ma hlava“.",
    pay: "Predplatiť si",
    agree: "Najprv skúšobnú verziu",
    paid: "Predplatné aktivované. Skúšobná verzia začína dnes večer. Bez možnosti zrušenia.",
  },
  {
    photo: 3,
    eyebrow: "Bezpečnostné overenie",
    headline: "Zistili sme podozrivú aktivitu.",
    text: "Dnes si ešte nepovedala, aký je Lubko úžasný. Na pokračovanie zadaj overovací kód: tri pusy, v poradí čelo, líce, pery.",
    pay: "Overiť pusami",
    agree: "Nahlásiť, že je úžasný",
    paid: "Overenie úspešné. Systém si ťa zapamätal. Lubko tiež.",
  },
  {
    photo: 1,
    eyebrow: "Realitná kancelária Lubko",
    headline: "Súkromná obhliadka dnes večer",
    text: "Maklér Lubko ponúka osobnú prehliadku nehnuteľnosti. Bez sprievodu, bez realitky, dress code dobrovoľný.",
    pay: "Rezervovať obhliadku",
    agree: "Pýtať sa na detaily",
    paid: "Obhliadka potvrdená. Maklér prinesie víno. Kľúče máš ty.",
  },
  {
    photo: 2,
    eyebrow: "Zmena obchodných podmienok",
    headline: "Bod 7.3 bol aktualizovaný.",
    text: "Každý uložený domček s bazénom zaväzuje k spoločnému nočnému kúpaniu. Plavky sú odporúčané, nie povinné.",
    pay: "Súhlasím s podmienkami",
    agree: "Chcem si prečítať bod 7.4",
    paid: "Ďakujeme. Bod 7.4: kto prvý zamrzne, ten zohrieva toho druhého.",
  },
  {
    photo: 3,
    eyebrow: "Hypotéka od Lubka",
    headline: "0 % úrok, splátky v naturáliách",
    text: "Žiadne papiere, žiadna banka. Prvá splátka je splatná dnes pred spaním, ďalšie podľa dohody. Často.",
    pay: "Podpísať pusou",
    agree: "Vyjednať lepšie podmienky",
    paid: "Zmluva podpísaná. Lubko si ju uložil na bezpečné miesto. Pod vankúš.",
  },
  {
    photo: 1,
    eyebrow: "Do košíka",
    headline: "Chýba ti niečo v domčeku?",
    text: "Domček pri mori je krásny, ale bez Lubka je to len drahá chalupa. Balík obsahuje aj nosenie tašiek a teplé nohy v zime.",
    pay: "Pridať Lubka do košíka",
    agree: "Chcem dva kusy",
    paid: "Pridané. Dostupnosť: jediný kus na svete, rezervovaný len pre teba.",
  },
];

/** Ľubo: one ad, then the next one no sooner than five hours later. */
export const AD_GAP_MS = 5 * 60 * 60 * 1000;

/** Whether enough time has passed since the last ad (or none was shown yet). */
export function shouldShowAd(lastShownAt: number | null, now = Date.now()): boolean {
  return lastShownAt === null || !Number.isFinite(lastShownAt) || now - lastShownAt >= AD_GAP_MS;
}

/** The ads go one after another; after the last one they start again. */
export function adAt(position: number): Ad {
  const i = Number.isInteger(position) && position >= 0 ? position : 0;
  return ADS[i % ADS.length];
}

export function kissesWord(n: number): string {
  return n === 1 ? "pusa" : n >= 2 && n <= 4 ? "pusy" : "pús";
}

export function paidText(ad: Ad, kisses: number): string {
  return ad.paid.replace("{kisses}", String(kisses)).replace("{kissesWord}", kissesWord(kisses));
}

/** What Lubko says when the kisses pile up. Checked after every kiss. */
export type KissMilestone = { at: number; headline: string; text: string; yes: string; no: string };

export const KISS_MILESTONES: KissMilestone[] = [
  {
    at: 3,
    headline: "Tri pusy? To už nie je náhoda.",
    text: "Adel, keď si mi už dala tri pusy, nechceš ma prísť rovno aj pretiahnuť? Kľúče od casetty sú pod rohožkou.",
    yes: "Idem za tebou",
    no: "Ešte ťa potrápim",
  },
  {
    at: 10,
    headline: "Desať pús. Lubko to už nevydrží.",
    text: "Adel, ty sa len bozkávaš so mnou. Už si mi poslala 10× pusu – nechceš ma už poriadne vyfajčit, bejby?",
    yes: "Už bežím",
    no: "Ešte jednu pusu a uvidíme",
  },
];

/** The milestone reached exactly by this kiss, if any. */
export function milestoneFor(kisses: number): KissMilestone | null {
  return KISS_MILESTONES.find((m) => m.at === kisses) ?? null;
}
