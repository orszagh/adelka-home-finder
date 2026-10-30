# Phase Context

**Phase:** 12 — Okolie a sledovanie oblastí
**Generated:** 2026-10-30
**Status:** Ready for planning

## Poznatky z reálneho použitia (Adelka, 2026-10-30, Fosdinovo)

- **„V okolí“ nenašlo nič ani pri 40 km**, hoci Immobiliare malo pri Fosdinove dva domy. Príčina: nastavenie „len pri mori, 3 km“ platí pri sťahovaní (Apify sťahuje len pás) aj pri zobrazení (page.tsx filtruje `withinBand`). Fosdinovo je ~8–10 km od mora, takže tamojšie domy v DB nikdy neboli.
- **Rozšírenie na „Celá oblasť“ spustilo drahé sťahovanie.** Domy naozaj v DB neboli, lebo ani ranný cron pás nesťahoval. Hneď ich ale stiahnuť netreba: stačí ranná kontrola, ktorá beží tak či tak.
- **„Sleduješ celý región“ klamalo.** Región a provincie sú v `search_areas` samostatné záznamy (`areaNameFor` podľa názvu):
  - región + 1 provincia z 5 sa dá mať naraz a tá provincia sa sťahuje (aj platí) dvakrát;
  - zrušenie regiónu nezruší jeho provincie;
  - UI ukazuje „celý región“, aj keď provincie nie sú zaškrtnuté.
- **Každé ťuknutie na provinciu hneď spustí Apify** (`addPlaceArea` → `withListings`) a SyncSheet beží niekoľko minút. Výber 4 provincií = 4× čakanie a 4× platba.

## Goals

- Goal 1 (12-01, Okolie, ide prvé podľa Ľuba):
  - **okolie nepodlieha pásu od mora**: ukazuje všetko z DB v kruhu;
  - čipy 5 / 10 / 20 / 40 / **100 km**;
  - „Prehľadať tento okruh“ ostáva: Apify v zvolenom kruhu (celý kruh, bandKm null), cena vopred, Zastaviť, nesleduje sa. Inak okolie nesťahuje;
  - kruh ťahaný prstom Ľubo nechce, stačia čipy (2026-10-30).
- Goal 2 (12-02, Sledovanie):
  - panel s provinciami: ťuknem na región, mapa sa priblíži, otvorí sa panel so zoznamom provincií;
  - prepínač „Celý región“ jedným ťuknutím zaškrtne všetky provincie;
  - pod tým ďalšie sledované regióny s možnosťou úpravy.
- Goal 3 (12-02): jeden zdroj pravdy: „celý región“ = všetky jeho provincie zaškrtnuté. Žiadne prekrývajúce sa záznamy a žiadne dvojité platby. Dnešné záznamy sa prevedú (región → jeho provincie, duplicity preč).
- Goal 5 (12-02): keď je Adelka v okolí v regióne, ktorý ešte nesleduje (prvýkrát tam), appka sa spýta, či tam má hľadať. Áno = otvorí sa panel provincií toho regiónu (Goal 2) a potom sťahovanie podľa Goal 4. Ak región sleduje, nepýta sa nič a nič nesťahuje.
- Goal 4 (12-02 a nastavenia): nič sa nesťahuje pri každom ťuknutí. Po „Uložiť“ stiahne nové provincie (a širší pás v Nastaveniach) **ranná kontrola**. Voliteľne tlačidlo „Stiahnuť hneď (najviac X USD)“ s potvrdením, jeden beh pre všetky novo pridané provincie, so Zastaviť.

## Approach

- Vysvetlivky: znovupoužiteľný HelpTip (otáznik → krátka karta + odkaz do Nápovedy) z 12-01. V 12-02 povinne v paneli provincií (čo znamená sledovať, celý región, kedy sa sťahuje a koľko to stojí); pri plánovaní každej obrazovky zvážiť, či sa oplatí aj inde. Nápoveda dostane odsek ku každej novej funkcii.

- Panel: na mobile výsuvný panel zdola (mapa hore ostáva vidieť), na počítači ľavý bočný panel nad mapou. Štýl ako DetailPanel / jestvujúce karty, bez emoji, ikony z ICONS.
- Okolie bez pásu: page.tsx dnes posiela v indexe len domy v páse. Treba poslať aj domy mimo pásu s príznakom (napr. `in_band`): regióny a počty ich skryjú, okolie ich ukáže. Sledovať veľkosť indexu (fáza 11: domov 958 KB).
- SearchSettingsForm: dnešné „Uložiť a hľadať“ pri rozšírení nahradiť správaním z Goal 4 (predvolene ráno, voliteľne hneď s potvrdením).

## Constraints

- Bez DB migrácie, ak sa dá (app_state, jestvujúce tabuľky). Prevod oblastí len cez kód (server action alebo jednorazová úprava pri načítaní), produkčná DB sa nečíta skriptom.
- Rozpočet Apify: 18,50 USD/mesiac, cena vopred vždy viditeľná, Zastaviť funguje.
- Žiadne emoji v UI. Texty Ľuba preberať doslova. Deploy len na „vyhoď to“.

## Open Questions

- Index s domami mimo pásu: koľko narastie? Pri nastavení „Celá oblasť“ je dnes v DB všetko. Ak by bol index priveľký, okolie môže domy mimo pásu ťahať cez malý GET podľa boxu (boxAround).
- Ranné sťahovanie novej provincie: cron sťahuje všetky oblasti. Treba overiť, že nová oblasť pridaná cez deň sa ráno stiahne v rámci bežného behu bez osobitnej logiky (mala by).
- Má panel ukazovať odhad mesačnej ceny ranného sťahovania podľa počtu provincií? Navrhnúť pri plánovaní 12-02.

## Additional Context

- 12-01-PLAN.md: okolie bez pásu, čip 100 km, Prehľadať tento okruh; kruh prstom vypadol.
- 12-02 sa naplánuje po 12-01.

---

*This file is temporary. It informs planning but is not required.*
*Created by /paul:discuss, consumed by /paul:plan.*
