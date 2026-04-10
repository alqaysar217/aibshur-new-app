'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function DelegatesLoading() {
    return (
        <Tabs defaultValue="pending">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="pending"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="active"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="rejected"><Skeleton className="h-5 w-20" /></TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="pending">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-10 w-full sm:w-64" />
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
                                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell className="flex justify-center items-center gap-2">
                                                <Skeleton className="h-9 w-9 rounded-md" />
                                                <Skeleton className="h-9 w-9 rounded-md" />
                                                <Skeleton className="h-9 w-9 rounded-md" />
                                                <Skeleton className="h-9 w-9 rounded-md" />
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
