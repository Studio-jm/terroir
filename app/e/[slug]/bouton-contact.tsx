"use client";

import { useState } from "react";

export function BoutonContact({ slug }: { slug: string }) {
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState(false);

  async function reveler() {
    setErreur("");
    const reponse = await fetch(`/e/${encodeURIComponent(slug)}/contact`, { method: "POST" });
    if (reponse.status === 429) {
      setErreur("Trop de demandes. Réessayez plus tard.");
      return;
    }
    if (!reponse.ok) {
      setErreur("Le contact n'a pas pu être affiché.");
      return;
    }
    const corps = (await reponse.json()) as { telephone?: string | null; email?: string | null };
    setTelephone(corps.telephone ?? "");
    setEmail(corps.email ?? "");
    setOuvert(true);
  }

  return (
    <section className="panneau">
      <h2 className="text-2xl">Téléphone et e-mail</h2>
      {ouvert ? (
        <ul className="liste">
          {telephone ? <li>{telephone}</li> : null}
          {email ? <li>{email}</li> : null}
          {!telephone && !email ? <li>Aucune coordonnée à afficher.</li> : null}
        </ul>
      ) : (
        <button type="button" onClick={reveler}>
          Afficher le téléphone et l&apos;e-mail
        </button>
      )}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </section>
  );
}
