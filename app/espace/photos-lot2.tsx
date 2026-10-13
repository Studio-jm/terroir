"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { erreurPhoto } from "@/lib/fiche-lot2";
import { retirerMetadonnees } from "@/lib/metadonnees";
import { creerClientNavigateur } from "@/lib/supabase/client";

export function PhotosLot2({
  userId,
  exploitationId,
  nombre,
}: {
  userId: string;
  exploitationId: string;
  nombre: number;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function ajouter(formulaire: HTMLFormElement) {
    setErreur("");
    const donnees = new FormData(formulaire);
    const fichier = donnees.get("photo");
    const alt = String(donnees.get("texte_alternatif") ?? "");
    if (!(fichier instanceof File) || fichier.size === 0) {
      setErreur("Choisissez une photo.");
      return;
    }
    const refus = erreurPhoto({
      taille: fichier.size,
      type: fichier.type,
      alt,
      nombre,
    });
    if (refus) {
      setErreur(refus);
      return;
    }
    const supabase = creerClientNavigateur();
    if (!supabase) {
      setErreur("Le stockage n'est pas configuré.");
      return;
    }
    setEnvoi(true);
    try {
      const octets = new Uint8Array(await fichier.arrayBuffer());
      const propre = retirerMetadonnees(octets);
      const extension =
        fichier.type === "image/png" ? "png" : fichier.type === "image/webp" ? "webp" : "jpg";
      const chemin = `${userId}/${crypto.randomUUID()}.${extension}`;
      const blob = new Blob([propre.buffer.slice(propre.byteOffset, propre.byteOffset + propre.byteLength) as ArrayBuffer], {
        type: fichier.type,
      });
      const { error: stockage } = await supabase.storage
        .from("photos-exploitations")
        .upload(chemin, blob, { contentType: fichier.type, upsert: false });
      if (stockage) {
        setErreur(messagePhoto(stockage.message));
        return;
      }
      const { error: ligne } = await supabase.from("photos_exploitation").insert({
        owner_id: userId,
        exploitation_id: exploitationId,
        chemin,
        texte_alternatif: alt.trim(),
      });
      if (ligne) {
        await supabase.storage.from("photos-exploitations").remove([chemin]);
        setErreur(messagePhoto(ligne.message));
        return;
      }
      formulaire.reset();
      router.refresh();
    } catch {
      setErreur("Formats acceptés : JPEG, PNG ou WebP.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form
      className="formulaire"
      onSubmit={(event) => {
        event.preventDefault();
        void ajouter(event.currentTarget);
      }}
    >
      <div className="champ">
        <label htmlFor="photo">Photo</label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="aide">JPEG, PNG ou WebP, 5 Mo maximum, 6 photos au plus.</p>
      </div>
      <div className="champ">
        <label htmlFor="texte_alternatif">Texte alternatif</label>
        <input id="texte_alternatif" name="texte_alternatif" type="text" maxLength={200} required />
      </div>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      <button type="submit" disabled={envoi}>
        {envoi ? "Envoi…" : "Ajouter la photo"}
      </button>
    </form>
  );
}

function messagePhoto(message: string): string {
  const texte = message.toLowerCase();
  if (texte.includes("six photos") || texte.includes("payload") || texte.includes("maximum")) {
    if (texte.includes("six") || texte.includes("limit")) return "6 photos maximum.";
  }
  if (texte.includes("size") || texte.includes("too large") || texte.includes("5")) {
    if (texte.includes("size") || texte.includes("large") || texte.includes("payload")) {
      return "5 Mo maximum.";
    }
  }
  if (texte.includes("row-level") || texte.includes("403") || texte.includes("policy")) {
    return "Vous ne pouvez pas modifier ces photos.";
  }
  return "L'envoi a échoué.";
}
