import MemberForm from "@/components/MemberForm";
import { Person } from "@/types";
import { createClient } from "@/utils/pocketbase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMemberPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const pb = createClient(cookieStore);
  const { id } = await params;

  if (!pb.authStore.isValid) {
    redirect("/login");
  }

  // Check if user is admin - strict check for editing
  if (pb.authStore.model?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-800">
            Truy cập bị từ chối
          </h1>
          <p className="text-stone-600 mt-2">
            Bạn không có quyền chỉnh sửa thành viên.
          </p>
        </div>
      </div>
    );
  }

  // Fetch Public Data
  let person: Person | null = null;
  try {
    const raw = await pb.collection("persons").getOne(id);
    person = raw as unknown as Person;
  } catch {
    notFound();
  }

  if (!person) notFound();

  // Fetch Private Data
  let privateData = null;
  try {
    privateData = await pb
      .collection("person_details_private")
      .getFirstListItem(pb.filter("person_id = {:id}", { id }));
  } catch {
    // No private data yet — that's fine
  }

  const initialData = { ...person, ...privateData } as Person;

  return (
    <div className="flex-1 w-full relative flex flex-col pb-8">
      {/* Decorative background blurs */}
      {/* <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none" /> */}
      {/* <div className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] bg-stone-300/20 rounded-full blur-[100px] pointer-events-none" /> */}

      <div className="w-full relative z-20 py-4 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-800">
          Chỉnh Sửa Thành Viên
        </h1>
        <Link
          href={`/dashboard/members/${id}`}
          className="px-4 py-2 bg-stone-100/80 text-stone-700 rounded-lg hover:bg-stone-200 hover:text-stone-900 font-medium text-sm transition-all shadow-sm"
        >
          Hủy
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10 w-full flex-1">
        <MemberForm initialData={initialData} isEditing={true} isAdmin={true} />
      </main>
    </div>
  );
}
