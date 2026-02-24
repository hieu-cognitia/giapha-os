import config from "@/app/config";
import DataImportExport from "@/components/DataImportExport";
import Footer from "@/components/Footer";
import HeaderMenu from "@/components/HeaderMenu";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DataManagementPage() {
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

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="group flex items-center gap-2 cursor-pointer"
            >
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                {config.siteName}
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <HeaderMenu isAdmin={true} userEmail={user.email} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col pt-8 relative">
        {/* Decorative background blurs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-300/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">
                Sao lưu & Phục hồi
              </h2>
              <p className="text-stone-500 mt-2 text-sm sm:text-base max-w-2xl">
                Quản lý dữ liệu an toàn. Bạn có thể tải xuống bản sao lưu để lưu
                trữ hoặc phục hồi lại dữ liệu từ file đã lưu. Tính năng này chỉ
                dành cho Quản trị viên.
              </p>
            </div>
          </div>

          <DataImportExport />
        </div>
      </main>

      <Footer
        className="mt-auto bg-white/60 backdrop-blur-md border-t border-stone-200/60"
        showDisclaimer={true}
      />
    </div>
  );
}
