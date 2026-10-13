import type { ReactNode } from "react";
import type { CreditPhoto } from "@/lib/visuel";
import { Pied } from "./pied";

export function CoquePage({
  children,
  large = false,
  photo,
}: {
  children: ReactNode;
  large?: boolean;
  photo?: CreditPhoto;
}) {
  return (
    <main className="page">
      <div
        className={`mx-auto w-full min-w-0 px-4 py-8 ${large ? "max-w-3xl" : "max-w-xl"}`}
      >
        {children}
      </div>
      <Pied photo={photo} />
    </main>
  );
}
