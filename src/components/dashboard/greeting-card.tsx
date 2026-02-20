"use client";

import { useState, useEffect } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getTimeString() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateString() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function GreetingCard({ userName = "Demo" }: { userName?: string }) {
  const [time, setTime] = useState(() => getTimeString());
  const [date, setDate] = useState(() => getDateString());
  const [greeting, setGreeting] = useState(() => getGreeting());

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
      setGreeting(getGreeting());
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  const displayName = userName?.split(" ")[0] || "Demo";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">
            {greeting}, {displayName}
          </h2>
          <p className="text-zinc-500 mt-0.5">
            Pronto para manter suas finanças em dia? 🚀
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end mt-2 md:mt-0">
          <span className="text-3xl font-semibold tabular-nums text-zinc-100">
            {time}
          </span>
          <span className="text-sm text-zinc-500 capitalize">{date}</span>
        </div>
      </div>
    </div>
  );
}
