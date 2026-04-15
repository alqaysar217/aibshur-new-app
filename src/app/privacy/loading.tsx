import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyLoading() {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB]">
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <div className="w-9 h-9" />
        </div>
      </header>

      <main className="p-4 flex-1">
        <div className="flex flex-col items-center text-center py-6">
          <Skeleton className="h-28 w-28 rounded-[35px]" />
          <Skeleton className="h-8 w-48 mt-4" />
        </div>

        <Card className="rounded-[30px] p-4">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-6 w-6 rounded-full mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
