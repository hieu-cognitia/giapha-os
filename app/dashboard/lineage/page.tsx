import LineageManager from "@/components/LineageManager";
import { Person, Relationship } from "@/types";
import { createClient } from "@/utils/pocketbase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LineagePage() {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  if (!pb.authStore.isValid) {
    redirect("/login");
  }

  if (pb.authStore.model?.role !== "admin") {
    redirect("/dashboard");
  }

  const personsRaw = await pb.collection("persons").getFullList({
    sort: "birth_year",
  });

  const relationshipsRaw = await pb.collection("relationships").getFullList();

  const persons = personsRaw as unknown as Person[];
  const relationships = relationshipsRaw as unknown as Relationship[];

  return (
    <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col pt-8 relative w-full">
      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">
            Thứ tự gia phả
          </h2>
          <p className="text-stone-500 mt-2 text-sm sm:text-base max-w-2xl">
            Tự động tính toán và cập nhật{" "}
            <strong className="text-stone-700">thế hệ</strong> (đời thứ mấy tính
            từ tổ) và <strong className="text-stone-700">thứ tự sinh</strong>{" "}
            (con trưởng, con thứ…) cho tất cả thành viên. Xem preview trước khi
            áp dụng.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-stone-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌳</span>
              <div>
                <h3 className="font-bold text-stone-800 text-sm mb-1">
                  Thế hệ (Generation)
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed">
                  Dùng thuật toán BFS từ các tổ tiên gốc (người không có cha/mẹ
                  trong hệ thống). Tổ tiên = Đời 1, con = Đời 2, cháu = Đời 3...
                  Con dâu/rể kế thừa đời của người bạn đời.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-stone-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👶</span>
              <div>
                <h3 className="font-bold text-stone-800 text-sm mb-1">
                  Thứ tự sinh (Birth Order)
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed">
                  Trong danh sách anh/chị/em cùng cha, sắp xếp theo năm sinh
                  tăng dần và gán số thứ tự 1, 2, 3... Con dâu/rể không được
                  tính thứ tự.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manager */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/60 shadow-sm p-5 sm:p-8">
          <LineageManager persons={persons} relationships={relationships} />
        </div>
      </div>
    </main>
  );
}
