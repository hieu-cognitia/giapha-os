"use server";

import { createClient } from "@/utils/pocketbase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function deleteMemberProfile(memberId: string) {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  // 1. Verify Authentication & Authorization
  if (!pb.authStore.isValid) {
    throw new Error("Vui lòng đăng nhập.");
  }

  if (pb.authStore.model?.role !== "admin") {
    throw new Error("Từ chối truy cập. Chỉ admin mới có quyền xoá hồ sơ.");
  }

  // 2. Check for existing relationships
  let hasRelationships = false;
  try {
    const relationships = await pb.collection("relationships").getList(1, 1, {
      filter: pb.filter("person_a = {:id} || person_b = {:id}", {
        id: memberId,
      }),
    });
    hasRelationships = relationships.totalItems > 0;
  } catch (e) {
    console.error("Error checking relationships:", e);
    throw new Error("Lỗi kiểm tra mối quan hệ gia đình.");
  }

  if (hasRelationships) {
    throw new Error(
      "Không thể xoá. Vui lòng xoá hết các mối quan hệ gia đình của người này trước.",
    );
  }

  // 3. Delete the member
  try {
    await pb.collection("persons").delete(memberId);
  } catch (e) {
    console.error("Error deleting person:", e);
    throw new Error("Đã xảy ra lỗi khi xoá hồ sơ.");
  }

  // 4. Revalidate and redirect
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  redirect("/dashboard");
}
