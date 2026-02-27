import PocketBase from "pocketbase";

const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;

let _pb: PocketBase | null = null;

export const createClient = (): PocketBase => {
  if (!pocketbaseUrl) {
    // Return a bare client so the app doesn't crash during render
    return new PocketBase("http://localhost:8090");
  }

  // On the server side (SSR) return a fresh instance every time so we don't
  // share auth state across requests.
  if (typeof window === "undefined") {
    return new PocketBase(pocketbaseUrl);
  }

  // On the client side use a module-level singleton so every component shares
  // the same auth state and the onChange listener is only registered once.
  if (!_pb) {
    _pb = new PocketBase(pocketbaseUrl);

    // Seed the auth store from the cookie so the client is immediately aware
    // of any session that was established server-side.
    _pb.authStore.loadFromCookie(document.cookie);

    // Keep the cookie in sync whenever the auth state changes (login / logout /
    // token refresh).
    _pb.authStore.onChange(() => {
      document.cookie = _pb!.authStore.exportToCookie({
        httpOnly: false,
        sameSite: "Lax",
        path: "/",
      });
    });
  }

  return _pb;
};
