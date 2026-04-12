'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VipLoading() {
    return (
         <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manage"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="activate"><Skeleton className="h-5 w-28" /></TabsTrigger>
                </TabsList>
            </div>

            <Tabs defaultValue="manage">
                <TabsContent value="manage">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="h-10 w-36" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i}>
                                        <CardHeader>
                                            <div className="flex justify-between">
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                            </div>
                                            <Skeleton className="h-7 w-32 mt-2" />
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Skeleton className="h-8 w-24" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-5/6" />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="gap-2">
                                            <Skeleton className="h-9 w-20" />
                                            <Skeleton className="h-9 w-20" />
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="activate">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 flex-1" />
                                    <Skeleton className="h-10 w-24" />
                                </div>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                            <CardFooter><Skeleton className="h-10 w-36" /></CardFooter>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-7 w-40" />
                                <Skeleton className="h-4 w-64" />
                                <div className="flex gap-2 pt-4">
                                    <Skeleton className="h-10 w-64" />
                                    <Skeleton className="h-10 w-48" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...Array(3)].map((_, i) => (
                                            <TableRow key={i}>
                                                {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
