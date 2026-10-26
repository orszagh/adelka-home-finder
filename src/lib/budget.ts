/**
 * Keeps Apify within Ľubo's monthly budget (the account itself stops at 5 USD).
 * The nightly sync also paces itself over the billing cycle, so the money
 * lasts the whole month instead of running out in week three.
 */
export type Usage = { usedUsd: number; cycleStart: string; cycleEnd: string };

export type BudgetKind = "nightly" | "manual";

export type BudgetCheck =
  | { allowed: true }
  | {
      allowed: false;
      /** Hard: the month's budget is spent; soft: tonight is skipped to stay on pace. */
      hard: boolean;
      reason: string;
      cycleStart: string;
    };

export const DEFAULT_BUDGET_USD = 4.5;
/** Spending may run this far ahead of the even pace before a night is skipped. */
export const PACE_SLACK_USD = 0.25;

export function budgetUsd(): number {
  const value = Number(process.env.APIFY_MONTHLY_BUDGET_USD);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BUDGET_USD;
}

const usd = (n: number) => `${n.toFixed(2).replace(".", ",")} $`;
const day = (iso: string) =>
  new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "numeric", timeZone: "Europe/Bratislava" }).format(new Date(iso));

export function checkBudget(usage: Usage, budget: number, kind: BudgetKind, now = Date.now()): BudgetCheck {
  if (usage.usedUsd >= budget) {
    const renew = new Date(Date.parse(usage.cycleEnd) + 1).toISOString();
    return {
      allowed: false,
      hard: true,
      cycleStart: usage.cycleStart,
      reason: `Mesačný rozpočet na sťahovanie (${usd(budget)}) je minutý. Nové ponuky stiahnem od ${day(renew)}, dovtedy ukazujem tie, čo už mám.`,
    };
  }
  if (kind === "nightly") {
    const start = Date.parse(usage.cycleStart);
    const end = Date.parse(usage.cycleEnd);
    const elapsed = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 1;
    if (usage.usedUsd > budget * elapsed + PACE_SLACK_USD) {
      return {
        allowed: false,
        hard: false,
        cycleStart: usage.cycleStart,
        reason: `Šetrím rozpočet: tento mesiac je minuté ${usd(usage.usedUsd)} z ${usd(budget)}, túto noc vynechávam.`,
      };
    }
  }
  return { allowed: true };
}

export function formatUsage(usedUsd: number, budget: number): string {
  return `${usd(usedUsd)} z ${usd(budget)}`;
}
