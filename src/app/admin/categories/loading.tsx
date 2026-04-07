'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CategoriesLoading() {
    return (
        <Tabs defaultValue="global_categories">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <TabsList>
                    <TabsTrigger value="global_categories"><Skeleton className="h-5 w-24" /></TabsTrigger>
                    <TabsTrigger value="store_filters"><Skeleton className="h-5 w-24" /></TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="global_categories">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-10 w-36" />
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
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
            
            <TabsContent value="store_filters">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-10 w-36" />
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
