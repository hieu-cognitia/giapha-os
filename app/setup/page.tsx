import Footer from "@/components/Footer";
import { ArrowLeft, Database, Play } from "lucide-react";
import Link from "next/link";

export default async function SetupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] select-none selection:bg-amber-200 selection:text-amber-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none"></div>
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none flex justify-center">
        <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-indigo-300/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[0%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-teal-200/20 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-12 relative z-10 w-full max-w-3xl mx-auto">
        <div className="w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-stone-200 relative overflow-hidden mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Database className="size-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Khởi tạo PocketBase
              </h2>
              <p className="text-stone-500 font-medium">
                Hệ thống phát hiện cơ sở dữ liệu chưa được thiết lập. Vui lòng
                làm theo các bước sau.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Play className="size-5 text-stone-500" />
                Hướng dẫn thiết lập PocketBase:
              </h3>

              <ol className="list-decimal list-inside space-y-5 text-stone-600">
                <li className="leading-relaxed">
                  Tải PocketBase (file đơn lẻ, không cần cài đặt) từ{" "}
                  <a
                    href="https://pocketbase.io/docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 font-semibold hover:underline"
                  >
                    pocketbase.io/docs
                  </a>
                  .
                </li>
                <li className="leading-relaxed">
                  Khởi động PocketBase:{" "}
                  <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">
                    ./pocketbase serve
                  </code>
                </li>
                <li className="leading-relaxed">
                  Mở Admin UI tại{" "}
                  <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">
                    http://127.0.0.1:8090/_/
                  </code>{" "}
                  để tạo tài khoản superadmin lần đầu.
                </li>
                <li className="leading-relaxed">
                  Tạo các Collection cần thiết theo hướng dẫn trong file{" "}
                  <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">
                    docs/pocketbase-schema.md
                  </code>
                  .
                </li>
                <li className="leading-relaxed">
                  Thêm biến môi trường vào{" "}
                  <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">
                    .env.local
                  </code>
                  :
                  <div className="mt-3 bg-stone-900 text-stone-100 p-4 rounded-xl overflow-x-auto text-sm font-mono">
                    <pre>{`NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_SUPERADMIN_EMAIL=your_admin_email
POCKETBASE_SUPERADMIN_PASSWORD=your_admin_password`}</pre>
                  </div>
                </li>
                <li className="leading-relaxed">
                  Quay lại đây và bấm{" "}
                  <Link href="/login" className="text-amber-600 font-semibold hover:underline">
                    Đăng nhập
                  </Link>
                  .
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/login"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-stone-500 hover:text-stone-900 font-semibold text-sm transition-all duration-300 bg-white/60 px-5 py-2.5 rounded-full backdrop-blur-md shadow-sm border border-stone-200 hover:border-stone-300 hover:shadow-md"
      >
        <ArrowLeft className="size-4" />
        Quay lại Đăng nhập
      </Link>

      <Footer className="bg-transparent border-none mt-auto relative z-10" />
    </div>
  );
}
