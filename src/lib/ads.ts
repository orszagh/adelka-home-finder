/**
 * "Platené reklamy" from Lubko: the app is free, except it isn't. Cheeky,
 * romantic and funny – nothing crude (Ľubo toned it down). Adelka is
 * travelling for a long time, so Lubko courts her from afar. One at a time, in order,
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
    text: "Teda skoro. Za každých desať domčekov sa platí jednou pusou. Aj na diaľku. Splatnosť: okamžite. Pokuta za omeškanie: dve.",
    pay: "Zaplatiť pusou",
    agree: "Súhlasím s ďalšími reklamami",
    paid: "Platba prijatá. Doručenie cez Alpy do 24 hodín. Aktuálny stav účtu: {kisses} {kissesWord}.",
  },
  {
    photo: 2,
    eyebrow: "Mesačný výpis",
    headline: "Máš nezaplatené domčeky.",
    text: "Tento mesiac si si prezrela kopu domčekov a uhradila podozrivo málo pús. Úroky sa počítajú v objatiach a rastú každý deň.",
    pay: "Uhradiť pusou",
    agree: "Požiadať o splátkový kalendár",
    paid: "Uhradené. Ďakujeme, že si naša verná zákazníčka. Stav účtu: {kisses} {kissesWord}.",
  },
  {
    photo: 3,
    eyebrow: "Upozornenie na vzdialenosť",
    headline: "Medzi vami je vyše 1 000 km.",
    text: "Systém zistil, že Lubko sa nedá poslať kuriérom. Odporúčané riešenie: denná dávka pús na diaľku, kým sa nevrátiš.",
    pay: "Poslať pusu cez Alpy",
    agree: "Poslať aj fotku mora",
    paid: "Pusa preletela cez Alpy a pristála. Lubko sa červená.",
  },
  {
    photo: 1,
    eyebrow: "Nová služba",
    headline: "Lubko Premium™ – cestovná verzia",
    text: "Ranné „dobré ráno“, večerný videohovor a neobmedzené pusy bez roamingu. Cena: jedna fotka mora denne.",
    pay: "Predplatiť si",
    agree: "Najprv skúšobnú verziu",
    paid: "Predplatné aktivované. Prvý videohovor dnes večer. Bez možnosti zrušenia.",
  },
  {
    photo: 2,
    eyebrow: "Bezpečnostné overenie",
    headline: "Zistili sme podozrivú aktivitu.",
    text: "Dnes si ešte nepovedala, ako ti Lubko chýba. Na pokračovanie zadaj overovací kód: tri pusy na diaľku, v poradí čelo, líce, nos.",
    pay: "Overiť pusami",
    agree: "Nahlásiť, že chýba",
    paid: "Overenie úspešné. Systém si ťa zapamätal. Lubko tiež – a odpočítava dni.",
  },
  {
    photo: 3,
    eyebrow: "Aktualizácia systému",
    headline: "K dispozícii je verzia 2.0.",
    text: "Novinky: viac domčekov, rýchlejšia mapa a o 30 % viac Lubka. Inštalácia trvá jednu pusu a nevyžaduje reštart.",
    pay: "Nainštalovať pusou",
    agree: "Pripomenúť zajtra",
    paid: "Aktualizácia úspešná. Lubko 2.0 je nainštalovaný a nedá sa odinštalovať.",
  },
  {
    photo: 1,
    eyebrow: "Zmena obchodných podmienok",
    headline: "Bod 7.3 bol aktualizovaný.",
    text: "Každý domček s výhľadom na more musí mať aj miesto pre Lubka. Stačí kúsok gauča, jedna zásuvka a tanier cestovín.",
    pay: "Súhlasím s podmienkami",
    agree: "Chcem si prečítať bod 7.4",
    paid: "Ďakujeme. Bod 7.4: kto prvý uvidí more, posiela fotku. Kto ju dostane, posiela pusu.",
  },
  {
    photo: 2,
    eyebrow: "Vernostný program",
    headline: "Zbieraj body, vyhraj Lubka.",
    text: "Za každú pusu získavaš body. Za 10 bodov: dlhý videohovor. Za 100 bodov: Lubko osobne. Body nikdy nepropadajú.",
    pay: "Zbierať body",
    agree: "Čo je za 1 000 bodov?",
    paid: "Body pripísané. Za 1 000 bodov je prekvapenie. Lubko ho ešte vymýšľa.",
  },
  {
    photo: 3,
    eyebrow: "Medzinárodná platnosť",
    headline: "Pusy platia aj v Thajsku.",
    text: "Lubkove pusy sú platné v Taliansku, v Thajsku a kdekoľvek na mape. Výmenný kurz: 1 pusa = 1 pusa, bez poplatkov.",
    pay: "Zameniť pusu",
    agree: "Chcem lepší kurz",
    paid: "Zmenené. Kurz pevný, poplatky nulové, Lubko spokojný.",
  },
];

/** When true the ads show only on ?reklama=1 (to try them out). */
export const ADS_PAUSED = false;

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
    text: "Adel, tri pusy na diaľku a Lubko už nevie, ako sa volá. Ešte jedna a zavolá ti a zaspieva do telefónu – po taliansky a falošne.",
    yes: "Spievaj, počúvam",
    no: "Radšej ďalšiu pusu",
  },
  {
    at: 10,
    headline: "Desať pús. Lubko sa vzdáva.",
    text: "Adel, už si mi poslala 10× pusu. Banka Lubko vyhlasuje bankrot: celý účet, srdce aj posledný kúsok pizze prepisuje na teba. Natrvalo – v Taliansku aj v Thajsku.",
    yes: "Beriem všetko",
    no: "Pizzu si nechaj",
  },
];

/** The milestone reached exactly by this kiss, if any. */
export function milestoneFor(kisses: number): KissMilestone | null {
  return KISS_MILESTONES.find((m) => m.at === kisses) ?? null;
}
