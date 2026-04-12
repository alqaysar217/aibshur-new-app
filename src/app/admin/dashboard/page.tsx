'use client';
import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import {
    Activity, Award, CheckCircle, CircleDollarSign, Hourglass, MapPin, Package, Star, UserCheck, Database, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order as OrderFS } from '../orders/page';
import type { Driver } from '../delegates/page';
import type { Product } from '../products/page';
import DashboardLoading from './loading';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Notification } from '@/lib/notifications';

// This is the shape of the data after we process it for the UI
export interface Order extends Omit<OrderFS, 'timestamps'> {
    timestamps: { createdAt: Date; confirmedAt?: Date; dispatchedAt?: Date; deliveredAt?: Date; cancelledAt?: Date; scheduledDeliveryTime?: Date; };
}


const SparklineChart = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => (
    <div className="h-10 w-full">
        <ResponsiveContainer>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${dataKey})`} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

// This component holds the main dashboard content.
function DashboardContent() {
    const firestore = useFirestore();
    const { user } = useUser();

    // These hooks are now safe to call because we've confirmed the DB is seeded.
    const { data: ordersFS, isLoading: isLoadingOrders } = useCollection<OrderFS>(useMemoFirebase(() => firestore && user ? collection(firestore, 'orders') : null, [firestore, user]));
    const { data: drivers, isLoading: isLoadingDrivers } = useCollection<Driver>(useMemoFirebase(() => firestore && user ? collection(firestore, 'drivers_v2') : null, [firestore, user]));
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(useMemoFirebase(() => firestore && user ? collection(firestore, 'products') : null, [firestore, user]));
    const { data: activityFeed, isLoading: isLoadingNotifications } = useCollection<Notification>(useMemoFirebase(() => firestore && user?.uid ? collection(firestore, 'notifications') : null, [firestore, user?.uid]));
    
    const isLoading = isLoadingOrders || isLoadingDrivers || isLoadingProducts || isLoadingNotifications;

    const orders: Order[] = useMemo(() => {
        if (!ordersFS) return [];
        return ordersFS.map(orderFS => {
            const timestamps: any = {};
            if (orderFS.timestamps) {
                Object.keys(orderFS.timestamps).forEach(key => {
                    const ts = orderFS.timestamps[key as keyof typeof orderFS.timestamps];
                    if (ts instanceof Timestamp) {
                        timestamps[key] = ts.toDate();
                    } else {
                         timestamps[key] = new Date(); // Fallback for invalid date
                    }
                });
            }
            return { ...orderFS, timestamps };
        });
    }, [ordersFS]);


    const pulseData = useMemo(() => {
        if (!orders || !drivers) return { activeOrders: { value: 0, trend: [] }, liveSales: { value: 0, trend: [] }, onlineDrivers: { value: 0, trend: [] }, pendingQueue: { value: 0, trend: [] }};

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'dispatched'].includes(o.status));
        const liveSales = orders.filter(o => o.timestamps.createdAt >= today).reduce((sum, o) => sum + o.financials.total, 0);
        const onlineDrivers = drivers.filter(d => d.is_active); // Simplified logic
        const pendingQueue = orders.filter(o => o.status === 'incoming');

        // Simplified trend data
        const generateTrend = (currentValue: number) => [
            { value: currentValue * Math.random() * 0.5 + currentValue * 0.5 }, { value: currentValue * Math.random() * 0.5 + currentValue * 0.6 }, { value: currentValue * Math.random() * 0.5 + currentValue * 0.7 }, { value: currentValue * Math.random() * 0.5 + currentValue * 0.8 }, { value: currentValue }
        ];

        return {
            activeOrders: { value: activeOrders.length, trend: generateTrend(activeOrders.length) },
            liveSales: { value: liveSales, trend: generateTrend(liveSales / 1000) },
            onlineDrivers: { value: onlineDrivers.length, trend: generateTrend(onlineDrivers.length) },
            pendingQueue: { value: pendingQueue.length, trend: generateTrend(pendingQueue.length) },
        };
    }, [orders, drivers]);

    const salesGrowthData = useMemo(() => {
        if (!orders) return [];
        const data = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'short' }).format(d);
            return { name: dayName, sales: 0 };
        }).reverse();

        orders.forEach(order => {
            const orderDate = order.timestamps.createdAt;
            const diffDays = Math.floor((new Date().setHours(0,0,0,0) - orderDate.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));

            if (diffDays < 7 && diffDays >= 0) {
                const dayIndex = 6 - diffDays;
                if(data[dayIndex]) {
                   data[dayIndex].sales += order.financials.total;
                }
            }
        });
        return data;
    }, [orders]);


    const ordersByStoreData = useMemo(() => {
        if (!orders) return [];
        const salesMap = new Map<string, { completed: number; cancelled: number }>();
        orders.forEach(order => {
            const current = salesMap.get(order.storeName) || { completed: 0, cancelled: 0 };
            if (order.status === 'delivered') {
                current.completed += 1;
            } else if (order.status === 'cancelled') {
                current.cancelled += 1;
            }
            salesMap.set(order.storeName, current);
        });
        return Array.from(salesMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => (b.completed + b.cancelled) - (a.completed + a.cancelled))
            .slice(0, 5);
    }, [orders]);

    const topProducts = useMemo(() => {
        if (!orders || !products) return [];
        const productSales: { [key: string]: number } = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            });
        });

        return Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([productId, sales]) => {
                const product = products.find(p => p.id === productId);
                return {
                    name: product?.name || 'منتج محذوف',
                    sales: `${sales} طلب`,
                    image: product?.mainImageUrl || 'https://picsum.photos/seed/product/40/40'
                };
            });
    }, [orders, products]);
    
    const performanceIndexData = useMemo(() => {
        if (!orders) return [{ name: 'المناديب', value: 0 }, { name: 'المتاجر', value: 0 }];
        
        const delegateRatings = orders.map(o => o.rating?.delegate).filter((r): r is number => r !== undefined && r > 0);
        const storeRatings = orders.map(o => o.rating?.store).filter((r): r is number => r !== undefined && r > 0);

        const avgDelegateRating = delegateRatings.length > 0 ? delegateRatings.reduce((a, b) => a + b, 0) / delegateRatings.length : 0;
        const avgStoreRating = storeRatings.length > 0 ? storeRatings.reduce((a, b) => a + b, 0) / storeRatings.length : 0;

        return [
            { name: 'المناديب', value: parseFloat(avgDelegateRating.toFixed(2)) },
            { name: 'المتاجر', value: parseFloat(avgStoreRating.toFixed(2)) },
        ];
    }, [orders]);

    
    const orderStatusConfig = {
        completed: { label: "مكتمل", color: "hsl(var(--primary))" },
        cancelled: { label: "ملغي", color: "hsl(var(--destructive))" },
    };
     const performanceIndexConfig = {
        delegates: { label: "المناديب", color: "hsl(var(--chart-1))" },
        stores: { label: "المتاجر", color: "hsl(var(--chart-2))" },
    };

    if (isLoading) return <DashboardLoading />;

    return (
        <div className="space-y-6">
             <div className="space-y-0.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
                <p className="text-muted-foreground">نظرة شاملة ولحظية على أداء تطبيقك.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-medium">الطلبات النشطة</CardTitle>
                            <p className="text-2xl font-bold">{pulseData.activeOrders.value}</p>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-full"><Package className="h-5 w-5 text-primary" /></div>
                    </CardHeader>
                    <CardContent className="py-2">
                        <SparklineChart data={pulseData.activeOrders.trend} dataKey="value" color="hsl(var(--primary))"/>
                    </CardContent>
                </Card>
                <Card className="rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                         <div className="space-y-1">
                            <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
                            <p className="text-2xl font-bold">{pulseData.liveSales.value.toLocaleString()}&nbsp;ر.ي</p>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-full"><CircleDollarSign className="h-5 w-5 text-green-600" /></div>
                    </CardHeader>
                    <CardContent className="py-2">
                        <SparklineChart data={pulseData.liveSales.trend} dataKey="value" color="hsl(var(--chart-2))"/>
                    </CardContent>
                </Card>
                <Card className="rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-medium">المناديب المتصلين</CardTitle>
                            <p className="text-2xl font-bold">{pulseData.onlineDrivers.value}</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-full"><MapPin className="h-5 w-5 text-blue-600" /></div>
                    </CardHeader>
                    <CardContent className="py-2">
                         <SparklineChart data={pulseData.onlineDrivers.trend} dataKey="value" color="hsl(var(--chart-3))"/>
                    </CardContent>
                </Card>
                 <Card className="rounded-xl shadow-sm border-destructive/50 bg-destructive/5">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-medium text-destructive">طلبات في الانتظار</CardTitle>
                            <p className="text-2xl font-bold text-destructive">{pulseData.pendingQueue.value}</p>
                        </div>
                        <div className="p-2 bg-destructive/10 rounded-full"><Hourglass className="h-5 w-5 text-destructive" /></div>
                    </CardHeader>
                    <CardContent className="py-2">
                        <SparklineChart data={pulseData.pendingQueue.trend} dataKey="value" color="hsl(var(--destructive))"/>
                    </CardContent>
                </Card>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-xl border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" /> نمو المبيعات الأسبوعي
                        </CardTitle>
                        <Badge variant="outline" className="rounded-lg font-bold">آخر ٧ أيام</Badge>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} dy={10} className="fill-muted-foreground" />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} className="fill-muted-foreground" tickFormatter={(value) => `${value / 1000}k`}/>
                            <Tooltip 
                                contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', direction: 'rtl', backgroundColor: 'hsl(var(--background))' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                            />
                            <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1 rounded-xl border-border/50 shadow-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Award/>الأكثر مبيعاً</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>المنتج</TableHead><TableHead className="text-left">المبيعات</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {topProducts.map((product) => (
                                    <TableRow key={product.name}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Avatar className="h-8 w-8 rounded-md"><AvatarImage src={product.image} /><AvatarFallback>{product.name.charAt(0)}</AvatarFallback></Avatar>
                                            {product.name}
                                        </TableCell>
                                        <TableCell className="text-left">{product.sales}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 rounded-xl border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>الطلبات المكتملة مقابل الملغاة</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={orderStatusConfig} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={ordersByStoreData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 10)} />
                                <YAxis />
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                                <Bar dataKey="cancelled" fill="var(--color-cancelled)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3 rounded-xl border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>مؤشر كفاءة الأداء</CardTitle>
                        <CardDescription>متوسط تقييم المناديب والمتاجر.</CardDescription>
                    </CardHeader>
                     <CardContent className="flex-1 pb-0 flex justify-center items-center">
                        <ChartContainer config={performanceIndexConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={performanceIndexData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} >
                                    {performanceIndexData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.name === 'المناديب' ? 'var(--color-delegates)' : 'var(--color-stores)'} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
             </div>
            
             <Card className="rounded-xl border-border/50 shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity/>آخر الأنشطة في النظام</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   {(activityFeed && activityFeed.length > 0) ? activityFeed.slice(0, 4).map((item: any) => {
                       const Icon = CheckCircle; // Simplified
                       return (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                            <div className="flex-1">
                                <p className="text-sm">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.body}</p>
                            </div>
                        </div>
                       )
                   }) : (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد أنشطة لعرضها. قم بتهيئة قاعدة البيانات لعرض البيانات.</p>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}

// This is the new main component for the page.
export default function DashboardPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    // Check if the system settings doc exists. This is our proxy for "is the DB seeded?"
    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'systemSettings', 'main') : null, [firestore]);
    const { data: settings } = useDoc(settingsDocRef);
    
    if (isUserLoading) {
        return <DashboardLoading />;
    }

    // If settings are null and we're done loading, it means the DB is not seeded.
    if (!settings) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card rounded-xl border shadow-sm">
                 <Database className="h-16 w-16 text-primary mb-4" />
                 <h1 className="text-2xl font-bold">مرحباً بك في لوحة التحكم!</h1>
                 <p className="mt-2 text-lg text-muted-foreground">
                    لبدء استخدام النظام، يجب أولاً تهيئة قاعدة البيانات بالبيانات الأولية.
                 </p>
                 <p className="mt-1 text-sm text-muted-foreground">
                    هذه العملية ستنشئ الجداول اللازمة وتضيف بعض البيانات التجريبية.
                 </p>
                 <Button asChild className="mt-6 text-lg h-12 px-8">
                     <Link href="/admin/settings">الانتقال إلى الإعدادات لتهيئة قاعدة البيانات</Link>
                 </Button>
            </div>
        )
    }

    // If settings exist, render the full dashboard.
    return <DashboardContent />;
}
