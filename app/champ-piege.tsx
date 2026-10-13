"use client";

import { useId } from "react";
import { NOM_PIEGE } from "@/lib/piege";

export function ChampPiege() {
  const id = useId();
  return (
    <div className="piege" aria-hidden="true">
      <label htmlFor={id}>Ne pas remplir</label>
      <input
        id={id}
        name={NOM_PIEGE}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
