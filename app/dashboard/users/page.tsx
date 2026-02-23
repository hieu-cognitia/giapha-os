import config from "@/app/config";
import AdminUserList from "@/components/AdminUserList";
import Footer from "@/components/Footer";
import HeaderMenu from "@/components/HeaderMenu";
import { AdminUserData } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch users via RPC
  const { data: users, error } = await supabase.rpc("get_admin_users");

  if (error) {
    console.error("Error fetching users:", error);
  }

  const typedUsers = (users as AdminUserData[]) || [];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all duration-200 cursor-pointer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors cursor-pointer">
                {config.siteName}
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <HeaderMenu isAdmin={isAdmin} userEmail={user.email} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-800">
                Quản lý Người dùng
              </h2>
              <p className="text-stone-500 mt-1">
                Danh sách các tài khoản đang tham gia vào hệ thống.
              </p>
            </div>
          </div>
          <AdminUserList initialUsers={typedUsers} currentUserId={user.id} />
        </div>
      </main>

      <Footer
        className="mt-auto bg-white border-t border-stone-200"
        showDisclaimer={true}
      />
    </div>
  );
}
