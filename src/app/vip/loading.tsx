import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VipLoading() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between h-16 px-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 space-y-6">
                {/* Billing Toggle */}
                <div className="flex justify-center p-1 bg-muted rounded-lg">
                    <Skeleton className="h-10 flex-1 rounded-[6px]" />
                    <Skeleton className="h-10 flex-1 rounded-[6px]" />
                </div>

                {/* Package Skeletons */}
                <div className="space-y-6">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i} className="rounded-[10px]">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-7 w-24" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-10 w-32" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-5 w-5/6" />
                                    <Skeleton className="h-5 w-3/4" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-12 w-full rounded-[8px]" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
