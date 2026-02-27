import KinshipFinder from "@/components/KinshipFinder";
import { createClient } from "@/utils/pocketbase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tra cứu danh xưng",
};

export default async function KinshipPage() {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);

  if (!pb.authStore.isValid) redirect("/login");

  const personsRaw = await pb.collection("persons").getFullList({
    sort: "birth_year",
    fields: "id,full_name,gender,birth_year,birth_order,generation,is_in_law",
  });

  const relationshipsRaw = await pb.collection("relationships").getFullList({
    fields: "type,person_a,person_b",
  });

  // Cast to the shape expected by KinshipFinder
  const persons = personsRaw as unknown as {
    id: string;
    full_name: string;
    gender: "male" | "female" | "other";
    birth_year: number | null;
    birth_order: number | null;
    generation: number | null;
    is_in_law: boolean;
    avatar_url?: string | null;
  }[];

  const relationships = relationshipsRaw as unknown as {
    type: string;
    person_a: string;
    person_b: string;
  }[];

  return (
    <div className="flex-1 w-full relative flex flex-col pb-12">
      <div className="w-full relative z-20 py-6 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">
          Tra cứu danh xưng
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Chọn hai thành viên để tự động tính cách gọi theo quan hệ gia phả
        </p>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <KinshipFinder
          persons={persons}
          relationships={relationships}
        />
      </main>
    </div>
  );
}
