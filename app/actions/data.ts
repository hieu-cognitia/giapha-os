"use server";

import { Relationship } from "@/types";
import { createClient } from "@/utils/pocketbase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Payload shape cho file backup JSON.
 * Các field DB-managed (created, updated) được giữ để tham khảo
 * nhưng sẽ bị loại bỏ khi import lại.
 */
interface PersonExport {
  id: string;
  full_name: string;
  gender: "male" | "female" | "other";
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  death_year: number | null;
  death_month: number | null;
  death_day: number | null;
  is_deceased: boolean;
  is_in_law: boolean;
  birth_order: number | null;
  generation: number | null;
  avatar_url: string | null;
  note: string | null;
  // DB-managed fields (kept in export for traceability, stripped on import)
  created?: string;
  updated?: string;
}

interface RelationshipExport {
  id?: string;
  type: string;
  person_a: string;
  person_b: string;
  created?: string;
  updated?: string;
}

interface BackupPayload {
  version: number;
  timestamp: string;
  persons: PersonExport[];
  relationships: RelationshipExport[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function verifyAdmin() {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  if (!pb.authStore.isValid) throw new Error("Vui lòng đăng nhập.");

  if (pb.authStore.model?.role !== "admin")
    throw new Error("Từ chối truy cập. Chỉ admin mới có quyền này.");

  return pb;
}

// Các field được phép insert vào bảng persons (loại bỏ created/updated)
function sanitizePerson(
  p: PersonExport,
): Omit<PersonExport, "created" | "updated"> {
  return {
    id: p.id,
    full_name: p.full_name,
    gender: p.gender,
    birth_year: p.birth_year ?? null,
    birth_month: p.birth_month ?? null,
    birth_day: p.birth_day ?? null,
    death_year: p.death_year ?? null,
    death_month: p.death_month ?? null,
    death_day: p.death_day ?? null,
    is_deceased: p.is_deceased ?? false,
    is_in_law: p.is_in_law ?? false,
    birth_order: p.birth_order ?? null,
    generation: p.generation ?? null,
    avatar_url: p.avatar_url ?? null,
    note: p.note ?? null,
  };
}

function sanitizeRelationship(
  r: RelationshipExport,
): Omit<RelationshipExport, "id" | "created" | "updated"> {
  return {
    type: r.type,
    person_a: r.person_a,
    person_b: r.person_b,
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportData(): Promise<BackupPayload> {
  const pb = await verifyAdmin();

  const persons = await pb.collection("persons").getFullList({
    sort: "created",
    fields: "id,full_name,gender,birth_year,birth_month,birth_day,death_year,death_month,death_day,is_deceased,is_in_law,birth_order,generation,avatar_url,note,created,updated",
  });

  const relationships = await pb.collection("relationships").getFullList({
    sort: "created",
    fields: "id,type,person_a,person_b,created,updated",
  });

  return {
    version: 2,
    timestamp: new Date().toISOString(),
    persons: persons as unknown as PersonExport[],
    relationships: relationships as unknown as RelationshipExport[],
  };
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importData(
  importPayload:
    | BackupPayload
    | {
        persons: PersonExport[];
        relationships: Relationship[];
      },
) {
  const pb = await verifyAdmin();

  if (!importPayload?.persons || !importPayload?.relationships) {
    throw new Error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file JSON.");
  }

  if (importPayload.persons.length === 0) {
    throw new Error("File backup trống — không có thành viên nào để phục hồi.");
  }

  // 1. Xoá relationships trước (FK constraint)
  const existingRels = await pb
    .collection("relationships")
    .getFullList({ fields: "id" });
  await Promise.all(
    existingRels.map((rel) => pb.collection("relationships").delete(rel.id)),
  );

  // 2. Xoá persons
  const existingPersons = await pb
    .collection("persons")
    .getFullList({ fields: "id" });
  await Promise.all(
    existingPersons.map((person) =>
      pb.collection("persons").delete(person.id),
    ),
  );

  // 3. Insert persons (sanitized — chỉ giữ các field schema hiện tại)
  const CHUNK = 50;
  const persons = importPayload.persons.map(sanitizePerson);

  for (let i = 0; i < persons.length; i += CHUNK) {
    const chunk = persons.slice(i, i + CHUNK);
    await Promise.all(chunk.map((p) => pb.collection("persons").create(p)));
  }

  // 4. Insert relationships (stripped of id/created/updated to avoid conflicts)
  const relationships = importPayload.relationships.map(sanitizeRelationship);

  for (let i = 0; i < relationships.length; i += CHUNK) {
    const chunk = relationships.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((r) => pb.collection("relationships").create(r)),
    );
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/data");

  return {
    success: true,
    imported: {
      persons: persons.length,
      relationships: relationships.length,
    },
  };
}
