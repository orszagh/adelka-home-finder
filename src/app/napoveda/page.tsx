import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ButtonLink, Eyebrow, ICONS, Icon } from "@/components/ui";
import { hasSession } from "@/lib/session";

export const metadata: Metadata = { title: "Nápoveda" };

/** Plain-language answers for Adelka: what each part of the app does and where the data comes from. */
const TOPICS: { icon: string; question: string; answer: ReactNode }[] = [
  {
    icon: "🗺️",
    question: "Ako nájdem domčeky?",
    answer: (
      <>
        <p>Na úvodnej mape sú farebne vyznačené regióny, kde hľadáš. Ťukni na región a mapa sa naň priblíži – uvidíš domčeky s cenami.</p>
        <p>Dole si prepneš medzi <b>Mapou</b> a <b>Zoznamom</b>. V zozname ich vieš zoradiť od najnovších, najlacnejších alebo najbližších k moru a vyfiltrovať podľa ceny a počtu izieb.</p>
      </>
    ),
  },
  {
    icon: "🏠",
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
    icon: "📍",
    question: "Ako zmením, kde hľadám?",
    answer: (
      <p>
        V menu ťukni na <b>Nastavenia hľadania</b>. Vyberieš si provincie a či chceš len domčeky pri mori (do pár kilometrov od pobrežia) alebo aj
        vo vnútrozemí.
      </p>
    ),
  },
  {
    icon: "❤️",
    question: "Ako si domček odložím?",
    answer: (
      <p>
        Ťukni na srdiečko pri domčeku. Nájdeš ho v menu pod <b>Uložené</b> a môžeš si k nemu napísať poznámku, napríklad čo sa ti páčilo alebo
        čo sa chceš opýtať.
      </p>
    ),
  },
  {
    icon: "🔎",
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
    icon: "🏘️",
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
    icon: "✉️",
    question: "Ako napíšem realitke po taliansky?",
    answer: (
      <p>
        V detaile v časti <b>Napísať realitke</b> napíš po slovensky, čo chceš (napr. „chcem obhliadku v septembri“). AI pripraví slušnú správu
        po taliansky aj s prekladom, aby si vedela, čo v nej je. Skopíruješ ju a pošleš cez portál alebo e-mailom.
      </p>
    ),
  },
  {
    icon: "📶",
    question: "Funguje to aj bez signálu?",
    answer: (
      <p>
        Áno, čiastočne. Domčeky a mapy, ktoré si už raz otvorila, sa ukážu aj bez internetu. Nové ponuky a AI pomocníci potrebujú pripojenie.
        Appku si môžeš pridať na plochu mobilu ako ikonku.
      </p>
    ),
  },
  {
    icon: "🌙",
    question: "Dá sa zmeniť vzhľad?",
    answer: (
      <p>
        V menu pod <b>Vzhľad</b>: svetlý, tmavý alebo podľa nastavenia mobilu.
      </p>
    ),
  },
  {
    icon: "💌",
    question: "Čo sú tie reklamy?",
    answer: <p>Tie platíš len pusami. Iná platba sa neprijíma. 😉</p>,
  },
];

export default async function HelpPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/napoveda");
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <Eyebrow>Ako na to</Eyebrow>
          <h1 className="font-display text-3xl font-semibold text-ink">Nápoveda</h1>
          <p className="mt-1 text-muted">Ťukni na otázku a rozbalí sa odpoveď.</p>
        </div>
        {/* The app on the home screen has no browser back button. */}
        <Link
          href="/"
          aria-label="Zavrieť nápovedu"
          className="-mr-1 grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-sm ring-1 ring-line hover:bg-surface-2"
        >
          <Icon d={ICONS.close} size={20} />
        </Link>
      </div>

      <div className="space-y-2.5">
        {TOPICS.map((t) => (
          <details key={t.question} className="group rounded-3xl bg-surface shadow-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="text-xl">
                {t.icon}
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

      <ButtonLink href="/" variant="secondary">
        Späť na domčeky
      </ButtonLink>
    </main>
  );
}
