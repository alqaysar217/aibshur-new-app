import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DonationsLoading() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between h-16 px-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </header>

            <main className="flex-1 p-4 space-y-6">
                {/* Donation Type Card */}
                <Card className="rounded-[10px]">
                    <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-6 w-40 mx-auto" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </CardContent>
                </Card>

                {/* Amount Card */}
                <Card className="rounded-[10px]">
                    <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-6 w-48 mx-auto" />
                        <Skeleton className="h-20 w-full" />
                        <div className="grid grid-cols-4 gap-2 mt-3">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Method Card */}
                 <Card className="rounded-[10px]">
                    <CardContent className="p-4 space-y-3">
                         <Skeleton className="h-6 w-40 mx-auto" />
                         <Skeleton className="h-14 w-full rounded-lg" />
                    </CardContent>
                </Card>
                
                {/* Button */}
                <Skeleton className="h-14 w-full rounded-lg" />
            </main>
        </div>
    );
}
