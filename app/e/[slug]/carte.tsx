"use client";

import { useEffect, useState } from "react";

export function CarteDifferee({
  lat,
  lng,
  titre,
}: {
  lat: number;
  lng: number;
  titre: string;
}) {
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setPret(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  const sud = (lat - 0.05).toFixed(5);
  const nord = (lat + 0.05).toFixed(5);
  const ouest = (lng - 0.08).toFixed(5);
  const est = (lng + 0.08).toFixed(5);
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${ouest}%2C${sud}%2C${est}%2C${nord}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div>
      <p>{titre}</p>
      {pret ? (
        <iframe
          title={titre}
          src={src}
          loading="lazy"
          className="mt-3 h-64 w-full rounded-lg border border-creme-fonce"
        />
      ) : null}
    </div>
  );
}
