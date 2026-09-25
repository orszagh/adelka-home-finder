"use client";

import { markNewsSeen } from "@/app/actions";
import type { Greeting } from "@/lib/greeting";
import { Button, Card, Eyebrow } from "./ui";

export function GreetingCard({
  greeting,
  onShow,
  onDismiss,
  className = "",
}: {
  greeting: Greeting;
  onShow: () => void;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <Card aria-live="polite" className={`space-y-2 p-5 ${className}`}>
      <Eyebrow>{greeting.eyebrow}</Eyebrow>
      <h2 className="font-display text-[28px] font-semibold leading-tight text-ink">{greeting.title}</h2>
      <p className="text-[15px] leading-relaxed text-muted">{greeting.message}</p>
      <div className="flex flex-wrap gap-1 pt-2">
        <Button
          onClick={() => {
            onShow();
            void markNewsSeen();
          }}
        >
          Ukáž mi ich
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onDismiss();
            void markNewsSeen();
          }}
        >
          Neskôr
        </Button>
      </div>
    </Card>
  );
}
