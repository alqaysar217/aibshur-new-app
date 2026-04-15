'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WalletsLoading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 flex-grow" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                     <Tabs defaultValue="deposit">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="deposit"><Skeleton className="h-5 w-24" /></TabsTrigger>
                            <TabsTrigger value="log"><Skeleton className="h-5 w-28" /></TabsTrigger>
                        </TabsList>
                        <TabsContent value="deposit" className="mt-4">
                            <Card>
                                <CardHeader><Skeleton className="h-7 w-40" /></CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </CardContent>
                                <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-48" /></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

  