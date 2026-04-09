'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function UsersLoading() {
    return (
        <Tabs defaultValue="clients">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <TabsList>
                    <TabsTrigger value="clients"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="drivers"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="store_owners"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="admins"><Skeleton className="h-5 w-20" /></TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="clients">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-36" />
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                                            <TableCell className="flex justify-center gap-2">
                                                <Skeleton className="h-9 w-9" />
                                                <Skeleton className="h-9 w-9" />
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
    );
}
