import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type ButLien = "inscription" | "connexion";

export type MagicLink = {
  tokenHash: string;
  email: string;
  purpose: ButLien;
  expiresAt: string;
  createdAt: string;
};

export type Fiche = {
  ownerId: string;
  slug: string;
  nom: string;
  commune: string;
  produits: string[];
  contact: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export interface Store {
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(email: string): Promise<User>;
  countUsersSince(since: Date): Promise<number>;
  lienRecent(email: string, since: Date): Promise<boolean>;
  saveMagicLink(link: MagicLink): Promise<void>;
  consumeMagicLink(tokenHash: string): Promise<MagicLink | null>;
  listFiches(): Promise<Fiche[]>;
  getFicheByOwner(ownerId: string): Promise<Fiche | null>;
  getFicheBySlug(slug: string): Promise<Fiche | null>;
  slugsPris(): Promise<string[]>;
  insertFiche(fiche: Fiche): Promise<void>;
  updateFiche(fiche: Fiche): Promise<void>;
}

type FileData = {
  users: User[];
  magicLinks: MagicLink[];
  fiches: Fiche[];
};

const VIDE: FileData = { users: [], magicLinks: [], fiches: [] };

const FICHIER_STORE = path.join(process.cwd(), ".data", "store.json");

function asDate(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toISOString();
}

function normaliser(raw: unknown): FileData {
  if (!raw || typeof raw !== "object") return { ...VIDE, fiches: [] };
  const data = raw as Partial<FileData>;
  return {
    users: Array.isArray(data.users) ? data.users : [],
    magicLinks: Array.isArray(data.magicLinks) ? data.magicLinks : [],
    fiches: Array.isArray(data.fiches) ? data.fiches : [],
  };
}

let fileQueue: Promise<unknown> = Promise.resolve();

function exclusif<T>(fn: () => Promise<T>): Promise<T> {
  const run = fileQueue.then(fn, fn);
  fileQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function lireFichier(): Promise<FileData> {
  try {
    const texte = await readFile(
      /* turbopackIgnore: true */ FICHIER_STORE,
      "utf8",
    );
    return normaliser(JSON.parse(texte) as unknown);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return { users: [], magicLinks: [], fiches: [] };
    }
    throw error;
  }
}

async function ecrireFichier(data: FileData): Promise<void> {
  const cible = FICHIER_STORE;
  await mkdir(path.dirname(cible), { recursive: true });
  const temporaire = `${cible}.${process.pid}.tmp`;
  await writeFile(temporaire, JSON.stringify(data, null, 2), "utf8");
  await rename(temporaire, cible);
}

const fileStore: Store = {
  async getUserByEmail(email) {
    const data = await lireFichier();
    return data.users.find((user) => user.email === email) ?? null;
  },
  async getUserById(id) {
    const data = await lireFichier();
    return data.users.find((user) => user.id === id) ?? null;
  },
  async createUser(email) {
    return exclusif(async () => {
      const data = await lireFichier();
      const existant = data.users.find((user) => user.email === email);
      if (existant) return existant;
      const user: User = {
        id: crypto.randomUUID(),
        email,
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      await ecrireFichier(data);
      return user;
    });
  },
  async countUsersSince(since) {
    const data = await lireFichier();
    const seuil = since.getTime();
    return data.users.filter((user) => Date.parse(user.createdAt) >= seuil)
      .length;
  },
  async lienRecent(email, since) {
    const data = await lireFichier();
    const seuil = since.getTime();
    return data.magicLinks.some(
      (lien) => lien.email === email && Date.parse(lien.createdAt) >= seuil,
    );
  },
  async saveMagicLink(link) {
    await exclusif(async () => {
      const data = await lireFichier();
      const maintenant = Date.now();
      data.magicLinks = data.magicLinks.filter(
        (lien) =>
          lien.email !== link.email && Date.parse(lien.expiresAt) > maintenant,
      );
      data.magicLinks.push(link);
      await ecrireFichier(data);
    });
  },
  async consumeMagicLink(tokenHash) {
    return exclusif(async () => {
      const data = await lireFichier();
      const index = data.magicLinks.findIndex(
        (lien) => lien.tokenHash === tokenHash,
      );
      if (index === -1) return null;
      const [lien] = data.magicLinks.splice(index, 1);
      await ecrireFichier(data);
      return lien ?? null;
    });
  },
  async listFiches() {
    const data = await lireFichier();
    return [...data.fiches].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async getFicheByOwner(ownerId) {
    const data = await lireFichier();
    return data.fiches.find((fiche) => fiche.ownerId === ownerId) ?? null;
  },
  async getFicheBySlug(slug) {
    const data = await lireFichier();
    return data.fiches.find((fiche) => fiche.slug === slug) ?? null;
  },
  async slugsPris() {
    const data = await lireFichier();
    return data.fiches.map((fiche) => fiche.slug);
  },
  async insertFiche(fiche) {
    await exclusif(async () => {
      const data = await lireFichier();
      if (data.fiches.some((item) => item.ownerId === fiche.ownerId)) {
        throw new Error("fiche-existante");
      }
      if (data.fiches.some((item) => item.slug === fiche.slug)) {
        throw new Error("slug-pris");
      }
      data.fiches.push(fiche);
      await ecrireFichier(data);
    });
  },
  async updateFiche(fiche) {
    await exclusif(async () => {
      const data = await lireFichier();
      const index = data.fiches.findIndex(
        (item) => item.ownerId === fiche.ownerId,
      );
      if (index === -1) throw new Error("fiche-absente");
      data.fiches[index] = fiche;
      await ecrireFichier(data);
    });
  },
};

type Sql = NeonQueryFunction<false, false>;

let schema: Promise<void> | null = null;
let client: Sql | null = null;

function sql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant");
  if (!client) client = neon(url);
  return client;
}

function assurerSchema(): Promise<void> {
  if (!schema) {
    schema = (async () => {
      const db = sql();
      await db`CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        email text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS magic_links (
        token_hash text PRIMARY KEY,
        email text NOT NULL,
        purpose text NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS fiches (
        owner_id text PRIMARY KEY REFERENCES users(id),
        slug text NOT NULL UNIQUE,
        nom text NOT NULL,
        commune text NOT NULL,
        produits text NOT NULL,
        contact text NOT NULL,
        description text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
    })().catch((error: unknown) => {
      schema = null;
      throw error;
    });
  }
  return schema;
}

function userDepuis(row: {
  id: string;
  email: string;
  created_at: string | Date;
}): User {
  return { id: row.id, email: row.email, createdAt: asDate(row.created_at) };
}

function lienDepuis(row: {
  token_hash: string;
  email: string;
  purpose: string;
  expires_at: string | Date;
  created_at: string | Date;
}): MagicLink {
  const purpose: ButLien =
    row.purpose === "connexion" ? "connexion" : "inscription";
  return {
    tokenHash: row.token_hash,
    email: row.email,
    purpose,
    expiresAt: asDate(row.expires_at),
    createdAt: asDate(row.created_at),
  };
}

function ficheDepuis(row: {
  owner_id: string;
  slug: string;
  nom: string;
  commune: string;
  produits: string;
  contact: string;
  description: string;
  created_at: string | Date;
  updated_at: string | Date;
}): Fiche {
  const produits = JSON.parse(row.produits) as unknown;
  return {
    ownerId: row.owner_id,
    slug: row.slug,
    nom: row.nom,
    commune: row.commune,
    produits: Array.isArray(produits)
      ? produits.filter((item): item is string => typeof item === "string")
      : [],
    contact: row.contact,
    description: row.description,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

const postgresStore: Store = {
  async getUserByEmail(email) {
    await assurerSchema();
    const rows = await sql()`SELECT id, email, created_at FROM users WHERE email = ${email} LIMIT 1`;
    const row = rows[0];
    return row ? userDepuis(row as Parameters<typeof userDepuis>[0]) : null;
  },
  async getUserById(id) {
    await assurerSchema();
    const rows = await sql()`SELECT id, email, created_at FROM users WHERE id = ${id} LIMIT 1`;
    const row = rows[0];
    return row ? userDepuis(row as Parameters<typeof userDepuis>[0]) : null;
  },
  async createUser(email) {
    await assurerSchema();
    const id = crypto.randomUUID();
    const inserted = await sql()`
      INSERT INTO users (id, email)
      VALUES (${id}, ${email})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, created_at
    `;
    const row = inserted[0];
    if (row) return userDepuis(row as Parameters<typeof userDepuis>[0]);
    const existing = await this.getUserByEmail(email);
    if (!existing) throw new Error("création utilisateur impossible");
    return existing;
  },
  async countUsersSince(since) {
    await assurerSchema();
    const rows = await sql()`SELECT count(*)::int AS n FROM users WHERE created_at >= ${since}`;
    const n = rows[0]?.n;
    return typeof n === "number" ? n : Number(n ?? 0);
  },
  async lienRecent(email, since) {
    await assurerSchema();
    const rows = await sql()`
      SELECT token_hash FROM magic_links
      WHERE email = ${email} AND created_at >= ${since}
      LIMIT 1
    `;
    return rows.length > 0;
  },
  async saveMagicLink(link) {
    await assurerSchema();
    const db = sql();
    const expires = new Date(link.expiresAt);
    const created = new Date(link.createdAt);
    await db.transaction([
      db`DELETE FROM magic_links WHERE email = ${link.email} OR expires_at < now()`,
      db`
        INSERT INTO magic_links (token_hash, email, purpose, expires_at, created_at)
        VALUES (${link.tokenHash}, ${link.email}, ${link.purpose}, ${expires}, ${created})
      `,
    ]);
  },
  async consumeMagicLink(tokenHash) {
    await assurerSchema();
    const rows = await sql()`
      DELETE FROM magic_links WHERE token_hash = ${tokenHash}
      RETURNING token_hash, email, purpose, expires_at, created_at
    `;
    const row = rows[0];
    return row ? lienDepuis(row as Parameters<typeof lienDepuis>[0]) : null;
  },
  async listFiches() {
    await assurerSchema();
    const rows = await sql()`
      SELECT owner_id, slug, nom, commune, produits, contact, description, created_at, updated_at
      FROM fiches
      ORDER BY created_at ASC
    `;
    return rows.map((row) => ficheDepuis(row as Parameters<typeof ficheDepuis>[0]));
  },
  async getFicheByOwner(ownerId) {
    await assurerSchema();
    const rows = await sql()`
      SELECT owner_id, slug, nom, commune, produits, contact, description, created_at, updated_at
      FROM fiches WHERE owner_id = ${ownerId} LIMIT 1
    `;
    const row = rows[0];
    return row ? ficheDepuis(row as Parameters<typeof ficheDepuis>[0]) : null;
  },
  async getFicheBySlug(slug) {
    await assurerSchema();
    const rows = await sql()`
      SELECT owner_id, slug, nom, commune, produits, contact, description, created_at, updated_at
      FROM fiches WHERE slug = ${slug} LIMIT 1
    `;
    const row = rows[0];
    return row ? ficheDepuis(row as Parameters<typeof ficheDepuis>[0]) : null;
  },
  async slugsPris() {
    await assurerSchema();
    const rows = await sql()`SELECT slug FROM fiches`;
    return rows.map((row) => String(row.slug));
  },
  async insertFiche(fiche) {
    await assurerSchema();
    const created = new Date(fiche.createdAt);
    const updated = new Date(fiche.updatedAt);
    await sql()`
      INSERT INTO fiches (owner_id, slug, nom, commune, produits, contact, description, created_at, updated_at)
      VALUES (
        ${fiche.ownerId},
        ${fiche.slug},
        ${fiche.nom},
        ${fiche.commune},
        ${JSON.stringify(fiche.produits)},
        ${fiche.contact},
        ${fiche.description},
        ${created},
        ${updated}
      )
    `;
  },
  async updateFiche(fiche) {
    await assurerSchema();
    const updated = new Date(fiche.updatedAt);
    const rows = await sql()`
      UPDATE fiches
      SET nom = ${fiche.nom},
          commune = ${fiche.commune},
          produits = ${JSON.stringify(fiche.produits)},
          contact = ${fiche.contact},
          description = ${fiche.description},
          updated_at = ${updated}
      WHERE owner_id = ${fiche.ownerId} AND slug = ${fiche.slug}
      RETURNING owner_id
    `;
    if (rows.length === 0) throw new Error("fiche-absente");
  },
};

export function messageStockageIndisponible(): string | null {
  if (process.env.DATABASE_URL) return null;
  if (process.env.VERCEL) {
    return "Le stockage n'est pas configuré. Ajoutez DATABASE_URL (Neon Postgres) sur Vercel.";
  }
  return null;
}

export function getStore(): Store {
  if (process.env.DATABASE_URL) return postgresStore;
  return fileStore;
}

export function hashJeton(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
