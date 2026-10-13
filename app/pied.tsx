import type { CreditPhoto } from "@/lib/visuel";

export function Pied({ photo }: { photo?: CreditPhoto }) {
  return (
    <footer aria-labelledby="pied-titre" className="pied bg-encre text-creme">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h2 id="pied-titre" className="text-xl">
          Terroir
        </h2>
        {photo ? (
          <>
            <p className="text-sm leading-relaxed">
              Photos publiées sur Unsplash, {photo.licence}.
            </p>
            <ul className="mt-3 list-none space-y-1 p-0 text-sm leading-relaxed">
              <li>
                <a href={photo.page}>{photo.alt}</a>
                {" · "}
                <a href={photo.profil}>{photo.auteur}</a>
              </li>
            </ul>
          </>
        ) : null}
      </div>
    </footer>
  );
}
