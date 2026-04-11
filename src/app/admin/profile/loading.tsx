'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
                    <div className="md:col-span-2 space-y-8">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="space-y-4 flex flex-col items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-40 w-40 rounded-full" />
                        <Skeleton className="h-10 w-full mt-4" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-36" />
                </CardFooter>
            </Card>
        </div>
    );
}
