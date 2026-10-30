import type { ReactNode } from "react";
import { Eyebrow, ICONS, Icon } from "@/components/ui";
import { APP_VERSION } from "@/lib/version";
import { OpenFromHash } from "./OpenFromHash";

/** Plain-language answers for Adelka: what each part of the app does and where the data comes from. */
/** icon: an ICONS path, drawn in the same line style as the rest of the app; id: link target (/napoveda#okolie). */
const TOPICS: { id?: string; icon: string; question: string; answer: ReactNode }[] = [
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
    id: "okolie",
    icon: ICONS.locate,
    question: "Ako nájdem domčeky okolo seba?",
    answer: (
      <>
        <p>
          Na mape dole ťukni na <b>Hľadať v okolí</b> (alebo v menu úplne hore na <b>Domčeky v okolí</b>). Telefón sa raz opýta, či môže appka použiť tvoju polohu – povoľ to. Mapa sa
          priblíži na miesto, kde stojíš (modrá bodka), a ukáže domčeky v kruhu okolo teba. Okruh si prepneš na 5, 10, 20, 40 alebo 100 km.
        </p>
        <p>V zozname sú zoradené od najbližšieho a pri každom vidíš, ako ďaleko je od teba.</p>
        <p>
          V okolí ukazujem všetky domčeky, ktoré už mám stiahnuté – aj tie ďalej od mora, než máš v Nastaveniach. Prepínanie okruhu nič
          nestojí.
        </p>
        <p>
          Keď tu nič nie je, ťukni na <b>Prehľadať tento okruh</b>. Stiahnem ponuky len v tomto kruhu, vopred ti poviem, koľko to
          najviac bude stáť, a sťahovanie môžeš zastaviť. Okruh nezačnem sledovať, takže ráno sa za neho už neplatí. Ak chceš
          dostávať nové ponuky z tejto oblasti každé ráno, ťukni na <b>Sledovať tu…</b> a vyber provincie.
        </p>
        <p>Tvoja poloha sa nikam neukladá – na server ide len raz, keď ťukneš na Prehľadať tento okruh.</p>
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
    id: "sledovanie",
    icon: ICONS.pin,
    question: "Ako zmením, kde hľadám?",
    answer: (
      <>
        <p>
          Na mape ťukni na región a potom na <b>Sledovať provincie</b> (alebo <b>Upraviť</b>). Otvorí sa zoznam jeho provincií – na
          mobile zdola, na počítači vľavo. Zaškrtni, ktoré mám sledovať; ťukať môžeš aj priamo na mapu. Pri ťukaní sa nič nesťahuje.
        </p>
        <p>
          <b>Celý región</b> je jedno hľadanie a je najlacnejšie. Jednotlivé provincie sú každá samostatné hľadanie – z každej príde viac
          ponúk, ale stojí to viac. Dole vidíš, koľko ranné kontroly stoja za deň a za mesiac.
        </p>
        <p>
          <b>Uložiť</b> nič hneď nestojí: nové ponuky stiahnem ráno. Keď ich chceš hneď, ťukni na <b>Uložiť a stiahnuť hneď</b> – cenu ti
          poviem vopred a sťahovanie môžeš zastaviť.
        </p>
        <p>
          V menu pod <b>Nastavenia hľadania</b> si vyberieš, či chceš len domčeky pri mori alebo aj vo vnútrozemí. Aj tam platí: uložené
          stiahnem ráno, hneď len keď chceš.
        </p>
      </>
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
    icon: ICONS.calendar,
    question: "Ako si naplánujem obhliadky?",
    answer: (
      <>
        <p>
          Pri uloženom domčeku (v <b>Uložených</b> alebo v jeho detaile) si označ, kde s ním si: <b>Napísala som</b>, <b>Obhliadka
          dohodnutá</b>, <b>Videla som</b> alebo <b>Nie je to ono</b>. Pri dohodnutej obhliadke doplň dátum a čas a ťukni na Uložiť.
        </p>
        <p>
          Navrchu Uložených potom vidíš <b>Plán obhliadok</b> zoradený podľa dátumu, s tlačidlom na navigáciu. Domčeky, ktoré nie sú
          ono, sa presunú na koniec. Platí to na mobile aj na počítači.
        </p>
        <p>
          Uloženú obhliadku si ťuknutím na <b>Pridať do kalendára</b> pridáš do kalendára v mobile. Pripomenie ti ju deň vopred a 2
          hodiny pred ňou.
        </p>
      </>
    ),
  },
  {
    icon: ICONS.list,
    question: "Prečo je pri domčeku „Aj na Idealista.it aj Immobiliare.it“?",
    answer: (
      <p>
        Ten istý dom býva ponúkaný na oboch portáloch. Appka ho spozná (rovnaké miesto, cena a veľkosť) a ukáže ho len raz, s lacnejšou
        cenou. V detaile nájdeš odkaz aj na druhý inzerát.
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
    icon: ICONS.heart,
    question: "Vidí Lubko, čo v appke robím?",
    answer: <p>Lubko vidí, kedy si appku naposledy otvorila a ktoré domčeky si pozrela. Je zvedavý, nič viac.</p>,
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

/** Everything on Nápoveda: the full page and the panel over the map show the same. */
export function HelpContent() {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Ako na to</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-ink">Nápoveda</h1>
        <p className="mt-1 text-muted">Ťukni na otázku a rozbalí sa odpoveď.</p>
      </div>

      <div className="space-y-2.5">
        {TOPICS.map((t) => (
          <details key={t.question} id={t.id} className="group scroll-mt-20 rounded-3xl bg-surface shadow-card">
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
      <OpenFromHash />
      <p className="text-center text-sm font-medium text-muted">{APP_VERSION}</p>

    </div>
  );
}
