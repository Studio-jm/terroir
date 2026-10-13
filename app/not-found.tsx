import { MessageIntrouvable } from "./message-introuvable";

export default function NotFound() {
  return (
    <MessageIntrouvable
      titre="Page introuvable"
      texte="Cette adresse ne correspond à aucune page."
    />
  );
}
