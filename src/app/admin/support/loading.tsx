'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function SupportLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="tickets">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tickets"><Skeleton className="h-5 w-32" /></TabsTrigger>
                    <TabsTrigger value="faq"><Skeleton className="h-5 w-32" /></TabsTrigger>
                </TabsList>
                <TabsContent value="tickets" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <Skeleton className="h-10 w-full sm:w-64" />
                            <Skeleton className="h-10 w-36" />
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow>{[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}</TableRow></TableHeader>
                                    <TableBody>{[...Array(4)].map((_, i) => (
                                        <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                                    ))}</TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="faq" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-10 w-36" />
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {[...Array(3)].map((_, i) => (
                                    <AccordionItem key={i} value={`item-${i}`}>
                                        <AccordionTrigger><Skeleton className="h-5 w-3/4" /></AccordionTrigger>
                                        <AccordionContent><Skeleton className="h-12 w-full" /></AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
