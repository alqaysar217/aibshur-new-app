'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PerformanceLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <Skeleton className="h-6 w-full" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="delegates">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="delegates"><Skeleton className="h-5 w-32" /></TabsTrigger>
                    <TabsTrigger value="support"><Skeleton className="h-5 w-32" /></TabsTrigger>
                </TabsList>
                <TabsContent value="delegates" className="mt-4">
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-10 w-full sm:w-64" />
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow>{[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}</TableRow></TableHeader>
                                    <TableBody>{[...Array(4)].map((_, i) => (
                                        <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                                    ))}</TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
