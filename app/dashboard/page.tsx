import config from "@/app/config";
import DashboardMemberList from "@/components/DashboardMemberList";
import FamilyTree from "@/components/FamilyTree";
import Footer from "@/components/Footer";
import HeaderMenu from "@/components/HeaderMenu";
import MindmapTree from "@/components/MindmapTree";
import RootSelector from "@/components/RootSelector";
import ViewToggle, { ViewMode } from "@/components/ViewToggle";
import { Person } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ view?: string; rootId?: string }>;
}

export default async function FamilyTreePage({ searchParams }: PageProps) {
  const { view, rootId } = await searchParams;
  const currentView = (view as ViewMode) || "list";

  // If view is list, we only need persons, not relationships.
  // We fetch persons for all views to pass down as a prop if we want, or let components fetch.
  // Actually, to make transitions fast and avoid duplicate fetching across components,
  // we will fetch data here and pass it down as props.
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

  const { data: personsData } = await supabase
    .from("persons")
    .select("*")
    .order("birth_year", { ascending: true, nullsFirst: false });

  const { data: relsData } = await supabase.from("relationships").select("*");

  const persons = personsData || [];
  const relationships = relsData || [];

  // Prepare map and roots for tree views
  const personsMap = new Map();
  persons.forEach((p) => personsMap.set(p.id, p));

  const childIds = new Set(
    relationships
      .filter(
        (r) => r.type === "biological_child" || r.type === "adopted_child",
      )
      .map((r) => r.person_b),
  );

  let finalRootId = rootId;

  // If no rootId is provided, fallback to the earliest created person
  if (!finalRootId || !personsMap.has(finalRootId)) {
    const rootsFallback = persons.filter((p) => !childIds.has(p.id));
    if (rootsFallback.length > 0) {
      finalRootId = rootsFallback[0].id;
    } else if (persons.length > 0) {
      finalRootId = persons[0].id; // ultimate fallback
    }
  }

  let roots: Person[] = [];
  if (finalRootId && personsMap.has(finalRootId)) {
    roots = [personsMap.get(finalRootId)];
  }

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
        <ViewToggle />
      </header>

      <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col">
        {currentView !== "list" && persons.length > 0 && finalRootId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full flex justify-center sm:justify-start">
            <RootSelector persons={persons} currentRootId={finalRootId} />
          </div>
        )}

        {currentView === "list" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <DashboardMemberList initialPersons={persons} />
          </div>
        )}
        {currentView === "tree" && (
          <FamilyTree
            personsMap={personsMap}
            relationships={relationships}
            roots={roots}
          />
        )}
        {currentView === "mindmap" && (
          <MindmapTree
            personsMap={personsMap}
            relationships={relationships}
            roots={roots}
          />
        )}
      </main>

      <Footer
        className="mt-auto bg-white border-t border-stone-200"
        showDisclaimer={true}
      />
    </div>
  );
}
