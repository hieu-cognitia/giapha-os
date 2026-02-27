import PocketBase from "pocketbase";

const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const adminEmail = process.env.POCKETBASE_SUPERADMIN_EMAIL;
const adminPassword = process.env.POCKETBASE_SUPERADMIN_PASSWORD;

/**
 * Creates a PocketBase client authenticated as the PocketBase superadmin.
 * This is used only in server-side admin actions (user management) that
 * require elevated privileges beyond what a regular user token allows.
 */
export async function createAdminClient(): Promise<PocketBase> {
  if (!pocketbaseUrl || !adminEmail || !adminPassword) {
    throw new Error(
      "PocketBase admin credentials are missing. " +
        "Please set NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_SUPERADMIN_EMAIL, and POCKETBASE_SUPERADMIN_PASSWORD.",
    );
  }

  const pb = new PocketBase(pocketbaseUrl);

  // In PocketBase v0.23+ superusers are managed via the _superusers collection.
  await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);

  return pb;
}
