import AdminUserList from "@/components/AdminUserList";
import { AdminUserData } from "@/types";
import { createAdminClient } from "@/utils/pocketbase/admin";
import { createClient } from "@/utils/pocketbase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  if (!pb.authStore.isValid) {
    redirect("/login");
  }

  const isAdmin = pb.authStore.model?.role === "admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch users using admin credentials so we can list all accounts
  let typedUsers: AdminUserData[] = [];
  try {
    const adminPb = await createAdminClient();
    const users = await adminPb.collection("users").getFullList({
      sort: "-created",
    });
    typedUsers = users.map((u) => ({
      id: u.id,
      email: u.email as string,
      role: u.role as AdminUserData["role"],
      is_active: u.is_active as boolean,
      created_at: u.created as string,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  return (
    <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col pt-8 relative w-full">
      {/* Decorative background blurs */}
      {/* <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-[100px] pointer-events-none" /> */}
      {/* <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-300/20 rounded-full blur-[100px] pointer-events-none" /> */}

      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">
              Quản lý Người dùng
            </h2>
            <p className="text-stone-500 mt-2 text-sm sm:text-base">
              Danh sách các tài khoản đang tham gia vào hệ thống.
            </p>
          </div>
        </div>
        <AdminUserList initialUsers={typedUsers} currentUserId={pb.authStore.model?.id ?? ""} />
      </div>
    </main>
  );
}
