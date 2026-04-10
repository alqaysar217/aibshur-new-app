'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoyaltyLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>

            <Tabs defaultValue="rules">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rules"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="requests"><Skeleton className="h-5 w-28" /></TabsTrigger>
                    <TabsTrigger value="manual"><Skeleton className="h-5 w-36" /></TabsTrigger>
                </TabsList>
                <TabsContent value="rules" className="mt-4">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-32 ml-auto" />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                     <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {[...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                            <TableCell><div className="flex gap-2 justify-center"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="manual" className="mt-4">
                     <Card>
                        <CardHeader>
                           <Skeleton className="h-7 w-56" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Skeleton className="h-10 flex-grow" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                             <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
