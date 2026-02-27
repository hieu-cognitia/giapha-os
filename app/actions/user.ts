"use server";

import { UserRole } from "@/types";
import { createAdminClient } from "@/utils/pocketbase/admin";
import { createClient } from "@/utils/pocketbase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Verify that the calling user is an admin.
 * Returns the admin PocketBase client so subsequent calls can reuse it.
 */
async function verifyCallerIsAdmin() {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  if (!pb.authStore.isValid) throw new Error("Vui lòng đăng nhập.");

  const callerRole = pb.authStore.model?.role;
  if (callerRole !== "admin")
    throw new Error("Từ chối truy cập. Chỉ admin mới có quyền này.");
}

export async function changeUserRole(userId: string, newRole: UserRole) {
  await verifyCallerIsAdmin();

  const pb = await createAdminClient();
  await pb.collection("users").update(userId, { role: newRole });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  if (!pb.authStore.isValid) throw new Error("Vui lòng đăng nhập.");
  if (pb.authStore.model?.role !== "admin")
    throw new Error("Từ chối truy cập. Chỉ admin mới có quyền này.");
  if (pb.authStore.model?.id === userId)
    throw new Error("Không thể xoá tài khoản của chính mình.");

  const admin = await createAdminClient();
  await admin.collection("users").delete(userId);

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function adminCreateUser(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString() || "member";
  const isActiveStr = formData.get("is_active")?.toString();
  const isActive = isActiveStr === "false" ? false : true;

  if (!email || !password) {
    throw new Error("Email và mật khẩu là bắt buộc.");
  }

  await verifyCallerIsAdmin();

  const pb = await createAdminClient();
  await pb.collection("users").create({
    email,
    password,
    passwordConfirm: password,
    role,
    is_active: isActive,
    verified: true,
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function toggleUserStatus(userId: string, newStatus: boolean) {
  await verifyCallerIsAdmin();

  const pb = await createAdminClient();
  await pb.collection("users").update(userId, { is_active: newStatus });

  revalidatePath("/dashboard/users");
  return { success: true };
}
