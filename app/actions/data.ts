"use server";

import { Person, Relationship } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function exportData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify Authentication & Authorization
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Vui lòng đăng nhập.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Từ chối truy cập. Chỉ admin mới có quyền sao lưu.");
  }

  const { data: persons, error: personsError } = await supabase
    .from("persons")
    .select("*");
  if (personsError)
    throw new Error("Lỗi tải dữ liệu persons: " + personsError.message);

  const { data: relationships, error: relationshipsError } = await supabase
    .from("relationships")
    .select("*");
  if (relationshipsError)
    throw new Error(
      "Lỗi tải dữ liệu relationships: " + relationshipsError.message,
    );

  return {
    persons,
    relationships,
    timestamp: new Date().toISOString(),
  };
}

export async function importData(importPayload: {
  persons: Person[];
  relationships: Relationship[];
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Vui lòng đăng nhập.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error(
      "Từ chối truy cập. Chỉ admin mới có quyền phục hồi dữ liệu.",
    );
  }

  if (
    !importPayload ||
    !importPayload.persons ||
    !importPayload.relationships
  ) {
    throw new Error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file JSON.");
  }

  // To be safe, first delete all relationships
  const { error: delRelError } = await supabase
    .from("relationships")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delRelError)
    throw new Error("Lỗi khi xoá relationships cũ: " + delRelError.message);

  // Then delete all persons
  const { error: delPersonsError } = await supabase
    .from("persons")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delPersonsError)
    throw new Error("Lỗi khi xoá persons cũ: " + delPersonsError.message);

  // Insert persons in chunks of 500 to be safe
  const chunkSize = 500;
  for (let i = 0; i < importPayload.persons.length; i += chunkSize) {
    const chunk = importPayload.persons.slice(i, i + chunkSize);
    const { error: insPersonsError } = await supabase
      .from("persons")
      .insert(chunk);

    if (insPersonsError)
      throw new Error("Lỗi khi import persons: " + insPersonsError.message);
  }

  // Insert relationships in chunks
  for (let i = 0; i < importPayload.relationships.length; i += chunkSize) {
    const chunk = importPayload.relationships.slice(i, i + chunkSize);
    const { error: insRelError } = await supabase
      .from("relationships")
      .insert(chunk);

    if (insRelError)
      throw new Error("Lỗi khi import relationships: " + insRelError.message);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/data");

  return { success: true };
}
