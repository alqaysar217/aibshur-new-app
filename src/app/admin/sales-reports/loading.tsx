'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalesReportsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Skeleton className="h-10 w-full sm:w-64" />
                    <Skeleton className="h-10 w-full sm:w-48" />
                    <Skeleton className="h-10 w-full sm:w-48" />
                    <Skeleton className="h-10 w-full sm:w-48" />
                    <Skeleton className="h-10 flex-grow" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent><Skeleton className="h-8 w-24" /></CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                    <CardContent className="flex justify-center items-center"><Skeleton className="aspect-square h-[250px] w-[250px] rounded-full" /></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow>{[...Array(7)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}</TableRow></TableHeader>
                            <TableBody>{[...Array(5)].map((_, i) => (
                                <TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                            ))}</TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
