import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function HelpCenterLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <div className="w-9 h-9" />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-8">
        {/* Top Section */}
        <div className="text-center space-y-4">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-14 w-full rounded-[15px]" />
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-[10px]">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div>
          <Skeleton className="h-8 w-40 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>

        {/* Emergency Contact */}
        <Skeleton className="h-48 w-full rounded-[25px]" />
      </main>
    </div>
  );
}
