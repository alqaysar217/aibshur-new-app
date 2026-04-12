'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrdersLoading() {
    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>

            <Tabs defaultValue="incoming">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="incoming"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="active"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="completed"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="cancelled"><Skeleton className="h-5 w-20" /></TabsTrigger>
                </TabsList>

                <TabsContent value="incoming" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                <Skeleton className="h-10 w-full sm:w-auto sm:flex-grow" />
                                <Skeleton className="h-10 w-full sm:w-48" />
                                <Skeleton className="h-10 w-full sm:w-64" />
                                <Skeleton className="h-10 w-full sm:w-28" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                <TableCell className="flex justify-center items-center">
                                                    <Skeleton className="h-9 w-24 rounded-lg" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
