import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Compass } from "lucide-react";

export default async function SearchPage(props: PageProps<"/search">) {
  const query = await props.searchParams;
  const q = typeof query.q === "string" ? query.q : "";

  const breadcrumbs = [
    { label: "Search Results" }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto py-12">
      <Breadcrumbs items={breadcrumbs} />
      
      <Card className="text-center p-8 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
        <CardContent className="flex flex-col items-center justify-center p-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-150 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 mb-4 text-zinc-500">
            <Search className="h-6 w-6" />
          </div>
          
          <h2 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
            No Exact Match Found
          </h2>
          
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm leading-relaxed">
            We couldn&apos;t find an exact block, transaction, or address match for your query: 
            <span className="font-mono text-zinc-900 dark:text-zinc-200 block font-semibold mt-1 bg-zinc-100 dark:bg-zinc-900 p-2 rounded break-all select-all">
              {q || "Empty Search"}
            </span>
          </p>

          <div className="mt-6">
            <Button variant="primary" size="sm">
              <Link href="/" className="flex items-center gap-1.5 font-bold">
                <Compass className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export const dynamic = "force-dynamic";
