'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="rounded-xl">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-xl">
                     <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
                 <Card className="rounded-xl">
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-5 w-32" /></div></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 rounded-xl">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-[250px] w-full" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 rounded-xl">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-[250px] w-full" />
                    </CardContent>
                </Card>
            </div>
            
             <Card className="rounded-xl">
                <CardHeader><Skeleton className="h-6 w-56" /></CardHeader>
                <CardContent className="space-y-4">
                     {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                     ))}
                </CardContent>
            </Card>
        </div>
    );
}
