'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationsLoading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>

            <Tabs defaultValue="sender">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sender"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="triggers"><Skeleton className="h-5 w-28" /></TabsTrigger>
                    <TabsTrigger value="log"><Skeleton className="h-5 w-28" /></TabsTrigger>
                </TabsList>

                <TabsContent value="sender" className="mt-4">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-72" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-24 w-full" />
                            <div className="grid grid-cols-3 gap-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-32" />
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
