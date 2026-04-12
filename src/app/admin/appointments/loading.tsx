'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AppointmentsLoading() {
    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-56 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upcoming"><Skeleton className="h-5 w-28" /></TabsTrigger>
                    <TabsTrigger value="completed"><Skeleton className="h-5 w-28" /></TabsTrigger>
                    <TabsTrigger value="cancelled"><Skeleton className="h-5 w-28" /></TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                <Skeleton className="h-10 w-full sm:w-auto sm:flex-grow" />
                                <Skeleton className="h-10 w-full sm:w-48" />
                                <Skeleton className="h-10 w-full sm:w-64" />
                                <Skeleton className="h-10 w-full sm:w-32" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...Array(3)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                <TableCell className="flex justify-center items-center gap-2">
                                                    <Skeleton className="h-9 w-20 rounded-md" />
                                                    <Skeleton className="h-9 w-24 rounded-md" />
                                                    <Skeleton className="h-9 w-20 rounded-md" />
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
