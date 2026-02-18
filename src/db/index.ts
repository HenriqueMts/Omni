import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Cliente Drizzle para o Supabase (Postgres).
 * Use DATABASE_URL no .env: connection string direta do Supabase (Settings > Database).
 */
function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Set it in .env from Supabase: Settings > Database > Connection string (URI)."
    );
  }
  return url;
}

let _db: ReturnType<typeof drizzle> | null = null;

/** Retorna o cliente Drizzle (lazy init). Use em Server Components / Server Actions. */
export function getDb() {
  if (!_db) {
    const client = postgres(getConnectionString(), { max: 1 });
    _db = drizzle(client, { schema });
  }
  return _db;
}

/** Cliente Drizzle. Inicializado na primeira utilização (ex.: db.select()). */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const value = getDb()[prop as keyof ReturnType<typeof drizzle>];
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});

export { schema };
export * from "./schema";
