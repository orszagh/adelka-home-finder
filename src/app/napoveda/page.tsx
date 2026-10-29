import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CloseBar } from "@/components/CloseBar";
import { Eyebrow, ICONS, Icon } from "@/components/ui";
import { hasSession } from "@/lib/session";

export const metadata: Metadata = { title: "Nápoveda" };

/** Plain-language answers for Adelka: what each part of the app does and where the data comes from. */
/** icon: an ICONS path, drawn in the same line style as the rest of the app. */
const TOPICS: { icon: string; question: string; answer: ReactNode }[] = [
  {
    icon: ICONS.map,
    question: "Ako nájdem domčeky?",
    answer: (
      <>
        <p>Na úvodnej mape sú farebne vyznačené regióny, kde hľadáš. Ťukni na región a mapa sa naň priblíži – uvidíš domčeky s cenami.</p>
        <p>Dole si prepneš medzi <b>Mapou</b> a <b>Zoznamom</b>. V zozname ich vieš zoradiť od najnovších, najlacnejších alebo najbližších k moru a vyfiltrovať podľa ceny a počtu izieb.</p>
      </>
    ),
  },
  {
    icon: ICONS.locate,
    question: "Ako nájdem domčeky okolo seba?",
    answer: (
      <>
        <p>
          Na mape vpravo hore ťukni na tlačidlo s terčíkom. Telefón sa raz opýta, či môže appka použiť tvoju polohu – povoľ to. Mapa sa
          priblíži na miesto, kde stojíš (modrá bodka), a ukáže domčeky v kruhu okolo teba. Okruh si prepneš na 5, 10, 20 alebo 40 km.
        </p>
        <p>V zozname sú zoradené od najbližšieho a pri každom vidíš, ako ďaleko je od teba.</p>
        <p>
          Ukazujem len domčeky z provincií, ktoré sledujem. Keď si v provincii, ktorú ešte nesledujem, ťukni na <b>Sledovať …</b> a
          ponuky z nej hneď stiahnem. Tvoja poloha sa nikam neukladá ani neposiela.
        </p>
      </>
    ),
  },
  {
    icon: ICONS.home,
    question: "Odkiaľ sú ponuky?",
    answer: (
      <>
        <p>Z dvoch najväčších talianskych realitných portálov – <b>Idealista.it</b> a <b>Immobiliare.it</b>. Appka ich za teba každú noc prejde a nové ponuky pridá.</p>
        <p>Keď chceš novinky hneď, ťukni na <b>Pozrieť teraz</b> (najviac raz za hodinu).</p>
        <p>Ak inzerát z portálu zmizne, v detaile uvidíš upozornenie – dom je asi predaný.</p>
      </>
    ),
  },
  {
    icon: ICONS.pin,
    question: "Ako zmením, kde hľadám?",
    answer: (
      <p>
        V menu ťukni na <b>Nastavenia hľadania</b>. Vyberieš si provincie a či chceš len domčeky pri mori (do pár kilometrov od pobrežia) alebo aj
        vo vnútrozemí.
      </p>
    ),
  },
  {
    icon: ICONS.heart,
    question: "Ako si domček odložím?",
    answer: (
      <p>
        Ťukni na srdiečko pri domčeku. Nájdeš ho v menu pod <b>Uložené</b> a môžeš si k nemu napísať poznámku, napríklad čo sa ti páčilo alebo
        čo sa chceš opýtať.
      </p>
    ),
  },
  {
    icon: ICONS.search,
    question: "Čo nájdem v detaile domčeka?",
    answer: (
      <>
        <p>
          Fotky, cenu, plochu, izby, vzdialenosť od mora a odkaz na <b>pôvodný inzerát</b> na portáli. Tlačidlá <b>Google Maps</b> a{" "}
          <b>Waze</b> ťa k domčeku rovno navigujú. Poloha z portálu býva len približná.
        </p>
        <p>Pod tým sú dva pomocníci s umelou inteligenciou – Prehľad lokality a Napísať realitke.</p>
      </>
    ),
  },
  {
    icon: ICONS.tag,
    question: "Čo znamenajú štítky Nové, Nevidela a Videla?",
    answer: (
      <>
        <p>Na fotke každého domčeka v zozname je jeden štítok:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b>Nové</b> (žltý) – appka tento domček našla za posledné 3 dni. Je to nové v appke, nie nutne na portáli: keď pridáš novú
            provinciu, aj staršie ponuky z nej budú pár dní svietiť ako nové.
          </li>
          <li>
            <b>Nevidela</b> (tyrkysový) – detail tohto domčeka si ešte neotvorila.
          </li>
          <li>
            <b>Videla</b> (svetlý, s fajkou) – detail si už otvorila. Platí na mobile aj na počítači.
          </li>
        </ul>
        <p>Keď je domček nový, ukáže sa Nové. Po troch dňoch sa zmení na Videla alebo Nevidela.</p>
      </>
    ),
  },
  {
    icon: ICONS.compass,
    question: "Čo je Prehľad lokality?",
    answer: (
      <>
        <p>Krátky popis mesta, nie konkrétneho domu: aké je to miesto na bývanie, obchody a lekári, doprava, počasie a riziká ako záplavy či zosuvy.</p>
        <p>
          Píše ho umelá inteligencia (Claude) zo svojich všeobecných znalostí – internet práve neprehľadáva. Ber to ako orientáciu a riziká si over
          na idrogeo.isprambiente.it alebo na obecnom úrade.
        </p>
      </>
    ),
  },
  {
    icon: ICONS.mail,
    question: "Ako napíšem realitke po taliansky?",
    answer: (
      <p>
        V detaile v časti <b>Napísať realitke</b> napíš po slovensky, čo chceš (napr. „chcem obhliadku v septembri“). AI pripraví slušnú správu
        po taliansky aj s prekladom, aby si vedela, čo v nej je. Skopíruješ ju a pošleš cez portál alebo e-mailom.
      </p>
    ),
  },
  {
    icon: ICONS.wifi,
    question: "Funguje to aj bez signálu?",
    answer: (
      <p>
        Áno, čiastočne. Domčeky a mapy, ktoré si už raz otvorila, sa ukážu aj bez internetu. Nové ponuky a AI pomocníci potrebujú pripojenie.
        Appku si môžeš pridať na plochu mobilu ako ikonku.
      </p>
    ),
  },
  {
    icon: ICONS.moon,
    question: "Dá sa zmeniť vzhľad?",
    answer: (
      <p>
        V menu pod <b>Vzhľad</b>: svetlý, tmavý alebo podľa nastavenia mobilu.
      </p>
    ),
  },
  {
    icon: ICONS.heart,
    question: "Čo sú tie reklamy?",
    answer: <p>Tie platíš len pusami. Iná platba sa neprijíma.</p>,
  },
];

export default async function HelpPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/napoveda");
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-6 pt-2">
      <CloseBar label="Zavrieť nápovedu" />
      <div>
        <Eyebrow>Ako na to</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-ink">Nápoveda</h1>
        <p className="mt-1 text-muted">Ťukni na otázku a rozbalí sa odpoveď.</p>
      </div>

      <div className="space-y-2.5">
        {TOPICS.map((t) => (
          <details key={t.question} className="group rounded-3xl bg-surface shadow-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                <Icon d={t.icon} size={18} />
              </span>
              <span className="flex-1">{t.question}</span>
              <svg
                aria-hidden
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-muted transition-transform group-open:rotate-180"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="space-y-2 px-5 pb-5 text-[15px] leading-relaxed text-ink-2">{t.answer}</div>
          </details>
        ))}
      </div>

    </main>
  );
}
