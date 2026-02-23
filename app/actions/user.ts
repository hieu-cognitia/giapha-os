"use server";

import { UserRole } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function changeUserRole(userId: string, newRole: UserRole) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.rpc("set_user_role", {
    target_user_id: userId,
    new_role: newRole,
  });

  if (error) {
    console.error("Failed to change user role:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.rpc("delete_user", {
    target_user_id: userId,
  });

  if (error) {
    console.error("Failed to delete user:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function adminCreateUser(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString() || "member";

  if (!email || !password) {
    throw new Error("Email và mật khẩu là bắt buộc.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.rpc("admin_create_user", {
    new_email: email,
    new_password: password,
    new_role: role,
  });

  if (error) {
    console.error("Failed to create user:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/users");
  return { success: true };
}
