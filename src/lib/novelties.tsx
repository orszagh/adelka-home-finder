import type { ReactNode } from "react";
import type { ICONS } from "@/components/ui";

/** A new feature introduced in a small window on the home page, once per phone. */
export type Novelty = {
  id: string;
  /** Remembered in localStorage once she has seen it. */
  storageKey: string;
  icon: keyof typeof ICONS;
  title: string;
  body: () => ReactNode;
  primary: { label: string; href?: string };
  /** A quiet "later" button next to the main one. */
  later?: string;
};

/** Oldest first: she always gets the oldest one she has not seen yet, at most one per visit. */
export const NOVELTIES: Novelty[] = [
  {
    id: "near",
    storageKey: "adelka.novelty.near",
    icon: "locate",
    title: "Domčeky v okolí",
    body: () => (
      <>
        <p>
          Prídeš do nového mestečka? Ťukni na mape dole na <b>Hľadať v okolí</b> (alebo v menu na <b>Domčeky v okolí</b>). Appka
          zistí, kde stojíš, a ukáže domčeky na predaj v kruhu okolo teba – do 5, 10, 20 alebo 40 km.
        </p>
        <p>Keď je to v provincii, ktorú ešte nesledujem, jedným ťuknutím z nej stiahnem ponuky. Tvoja poloha sa nikam neukladá.</p>
      </>
    ),
    primary: { label: "Rozumiem" },
  },
  {
    id: "visits",
    storageKey: "adelka.novelty.visits",
    icon: "calendar",
    title: "Plán obhliadok",
    body: () => (
      <>
        <p>
          Pri uloženom domčeku si teraz označíš, kde s ním si: <b>Napísala som</b>, <b>Obhliadka dohodnutá</b> (aj s dátumom a
          časom), <b>Videla som</b> alebo <b>Nie je to ono</b>.
        </p>
        <p>
          Navrchu Uložených potom nájdeš <b>Plán obhliadok</b> zoradený podľa dátumu, s navigáciou rovno k domčeku.
        </p>
      </>
    ),
    primary: { label: "Pozrieť Uložené", href: "/ulozene" },
    later: "Neskôr",
  },
  {
    id: "calendar",
    storageKey: "adelka.novelty.calendar",
    icon: "calendar",
    title: "Obhliadka v kalendári",
    body: () => (
      <>
        <p>
          Keď máš obhliadku dohodnutú aj s dátumom, ťukni pri domčeku na <b>Pridať do kalendára</b> (alebo na ikonu kalendára v
          Pláne obhliadok). Obhliadka sa ti uloží do kalendára v iPhone.
        </p>
        <p>Kalendár ti ju pripomenie <b>deň vopred</b> a ešte raz <b>2 hodiny pred ňou</b>, aby si nič nezmeškala.</p>
      </>
    ),
    primary: { label: "Pozrieť Uložené", href: "/ulozene" },
    later: "Neskôr",
  },
  {
    id: "near-search",
    storageKey: "adelka.novelty.near-search",
    icon: "locate",
    title: "Okolie až do 100 km",
    body: () => (
      <>
        <p>
          V <b>Hľadať v okolí</b> teraz uvidíš všetky domčeky, ktoré už mám, aj tie ďalej od mora. Kruh si zväčšíš až na <b>100 km</b>.
        </p>
        <p>
          Keď tam nič nie je, ťukni na <b>Prehľadať tento okruh</b>. Stiahnem ponuky len tam, cenu ti poviem vopred a sťahovanie môžeš
          kedykoľvek zastaviť. Keď ťa pri tom okno zavadzia, zbaľ ho – ostane z neho len loďka vľavo dole.
        </p>
      </>
    ),
    primary: { label: "Vyskúšať", href: "/?locate=1" },
    later: "Neskôr",
  },
  {
    id: "follow-panel",
    storageKey: "adelka.novelty.follow-panel",
    icon: "heart",
    title: "Nový výber provincií",
    body: () => (
      <>
        <p>
          Ťukni na región a na <b>Sledovať provincie</b>. Otvorí sa zoznam provincií, kde ich pokojne pozaškrtávaš – pri ťukaní sa už
          nič nesťahuje. <b>Celý región</b> je jedno ťuknutie a najlacnejšie hľadanie.
        </p>
        <p>
          Po uložení stiahnem nové ponuky ráno. Keď ich chceš hneď, dá sa aj to, cenu ti poviem vopred. Dole vidíš, koľko ranné kontroly
          stoja.
        </p>
      </>
    ),
    primary: { label: "Rozumiem" },
  },
];

/** The oldest novelty whose key is not among the seen ones. */
export function nextNovelty(seenKeys: ReadonlySet<string>, list: Novelty[] = NOVELTIES): Novelty | null {
  return list.find((n) => !seenKeys.has(n.storageKey)) ?? null;
}
