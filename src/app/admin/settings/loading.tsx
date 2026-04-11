'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsLoading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="appearance"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="operational"><Skeleton className="h-5 w-28" /></TabsTrigger>
                    <TabsTrigger value="notifications"><Skeleton className="h-5 w-32" /></TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
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
