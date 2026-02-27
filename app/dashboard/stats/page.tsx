import FamilyStats from "@/components/FamilyStats";
import { Person, Relationship } from "@/types";
import { createClient } from "@/utils/pocketbase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Thống kê gia phả",
};

export default async function StatsPage() {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  if (!pb.authStore.isValid) redirect("/login");

  const personsRaw = await pb.collection("persons").getFullList();
  const relationshipsRaw = await pb.collection("relationships").getFullList();
  const persons = personsRaw as unknown as Person[];
  const relationships = relationshipsRaw as unknown as Relationship[];

  return (
    <div className="flex-1 w-full relative flex flex-col pb-12">
      <div className="w-full relative z-20 py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">
          Thống kê gia phả
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Tổng quan số liệu về các thành viên trong dòng họ
        </p>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <FamilyStats
          persons={persons}
          relationships={relationships}
        />
      </main>
    </div>
  );
}
