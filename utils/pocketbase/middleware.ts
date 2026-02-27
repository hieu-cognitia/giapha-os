import PocketBase from "pocketbase";
import { type NextRequest, NextResponse } from "next/server";

const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;

export async function updateSession(request: NextRequest) {
  // If the PocketBase URL is not configured, redirect to the missing-config page.
  if (!pocketbaseUrl) {
    if (request.nextUrl.pathname !== "/missing-db-config") {
      const url = request.nextUrl.clone();
      url.pathname = "/missing-db-config";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  const pb = new PocketBase(pocketbaseUrl);

  // Load the auth store from the incoming request cookie.
  pb.authStore.loadFromCookie(request.headers.get("cookie") || "");

  // Try to refresh an existing valid token so it stays alive.
  try {
    if (pb.authStore.isValid) {
      await pb.collection("users").authRefresh();
    }
  } catch {
    pb.authStore.clear();
  }

  // Build the response and propagate the (possibly refreshed) cookie.
  const response = NextResponse.next({ request });
  response.headers.append(
    "set-cookie",
    pb.authStore.exportToCookie({ httpOnly: false, sameSite: "Lax", path: "/" }),
  );

  const isAuthenticated = pb.authStore.isValid;
  const user = pb.authStore.model;

  // Protected routes — redirect unauthenticated visitors to /login.
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  // Check whether the PocketBase schema (persons collection) exists.
  // If it doesn't yet exist we redirect to /setup.
  if (isAuthenticated && isProtectedPath) {
    try {
      await pb.collection("persons").getList(1, 1);
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 404) {
        const url = request.nextUrl.clone();
        url.pathname = "/setup";
        return NextResponse.redirect(url);
      }
    }
  }

  if (isProtectedPath && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already logged-in users should not see the login page.
  if (isLoginPage && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
