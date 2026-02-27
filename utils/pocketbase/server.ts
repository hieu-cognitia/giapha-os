import PocketBase from "pocketbase";
import { cookies } from "next/headers";

const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;

/**
 * Creates a server-side PocketBase client hydrated with the current user's
 * auth token from the request cookies.
 *
 * Usage (same as the former Supabase server client):
 *   const cookieStore = await cookies();
 *   const pb = createClient(cookieStore);
 */
export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): PocketBase => {
  const pb = new PocketBase(pocketbaseUrl || "http://localhost:8090");

  const raw = cookieStore.get("pb_auth")?.value;
  if (raw) {
    try {
      pb.authStore.loadFromCookie(`pb_auth=${raw}`);
    } catch {
      // Ignore malformed cookie
    }
  }

  return pb;
};
