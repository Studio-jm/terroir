import "server-only";

export function envoiDevVisible(): boolean {
  return !process.env.VERCEL && process.env.NODE_ENV !== "production";
}

export async function envoyerLien(
  email: string,
  url: string,
): Promise<{ ok: true; lienDev: string } | { ok: false; message: string }> {
  const dev = envoiDevVisible();
  const cle = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (cle && from) {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Votre lien de connexion Terroir",
        text: [
          "Bonjour,",
          "",
          "Pour ouvrir votre espace producteur sur Terroir, utilisez ce lien :",
          url,
          "",
          "Il expire dans 20 minutes et ne peut servir qu'une fois.",
          "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
        ].join("\n"),
      }),
    });
    if (!reponse.ok) {
      console.error(
        "[terroir] échec d'envoi du lien",
        reponse.status,
        await reponse.text(),
      );
      return {
        ok: false,
        message: "L'e-mail n'a pas pu être envoyé. Réessayez dans un instant.",
      };
    }
    if (dev) console.info(`[terroir] Lien de connexion pour ${email} : ${url}`);
    return { ok: true, lienDev: dev ? url : "" };
  }

  if (dev) {
    console.info(`[terroir] Lien de connexion pour ${email} : ${url}`);
    return { ok: true, lienDev: url };
  }

  return {
    ok: false,
    message:
      "L'envoi d'e-mails n'est pas configuré. Ajoutez RESEND_API_KEY et EMAIL_FROM.",
  };
}
