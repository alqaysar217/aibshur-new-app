'use client';
import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import {
    Activity, Award, CheckCircle, CircleDollarSign, Hourglass, MapPin, Package, Star, UserCheck, Database, Users, ShoppingCart, TrendingUp, Bike, PackageCheck, PackageX, HandCoins, LineChart as LineChartIcon, BarChart3 as BarChartIcon, PieChart as PieChartIcon
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
import type { Notification } from '@/lib/notifications';
import type { Client } from '../users/page';

// This is the shape of the data after we process it for the UI
export interface Order extends Omit<OrderFS, 'timestamps'> {
    timestamps: { createdAt: Date; confirmedAt?: Date; dispatchedAt?: Date; deliveredAt?: Date; cancelledAt?: Date; scheduledDeliveryTime?: Date; };
}

const SparklineChart = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => (
    <div className="h-10 w-full">
        <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
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
            if(orderFS.timestamps) {
                for (const key in orderFS.timestamps) {
                    if (orderFS.timestamps[key] instanceof Timestamp) {
                        timestamps[key] = orderFS.timestamps[key].toDate();
                    }
                }
            }
            return { ...orderFS, timestamps };
        });
    }, [ordersFS]);


    const pulseData = useMemo(() => {
        if (!orders || !drivers) return { activeOrders: { value: 0, trend: [] }, todaySales: { value: 0, trend: [] }, onlineDrivers: { value: 0, trend: [] }, pendingOrders: { value: 0, trend: [] }};
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));

        const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'dispatched'].includes(o.status));
        const todaySales = orders.filter(o => o.timestamps.createdAt >= todayStart).reduce((sum, o) => sum + o.financials.total, 0);
        const onlineDrivers = drivers.filter(d => d.is_active);
        const pendingOrders = orders.filter(o => o.status === 'incoming');

        const generateTrend = (currentValue: number) => [
            { value: currentValue * 0.8 }, { value: currentValue * 1.1 }, { value: currentValue * 0.9 }, { value: currentValue * 1.2 }, { value: currentValue }
        ].map(p => ({ value: Math.max(0, p.value) })); // Ensure non-negative

        return {
            activeOrders: { value: activeOrders.length, trend: generateTrend(activeOrders.length) },
            todaySales: { value: todaySales, trend: generateTrend(todaySales / 1000) }, // Trend in thousands
            onlineDrivers: { value: onlineDrivers.length, trend: generateTrend(onlineDrivers.length) },
            pendingOrders: { value: pendingOrders.length, trend: generateTrend(pendingOrders.length) },
        };
    }, [orders, drivers]);

    const salesProfitData = useMemo(() => {
        if (!orders) return [];
        const dataByDay: { [key: string]: { sales: number; profit: number } } = {};
        const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        orders.forEach(order => {
            const date = order.timestamps.createdAt;
            const dayName = weekDays[date.getDay()];
            if (!dataByDay[dayName]) {
                dataByDay[dayName] = { sales: 0, profit: 0 };
            }
            dataByDay[dayName].sales += order.financials.total;
            dataByDay[dayName].profit += (order.financials.subtotal * 0.1) - order.financials.discount; // Assuming 10% profit margin
        });

        return weekDays.map(day => ({ name: day, ...dataByDay[day] || {sales: 0, profit: 0} }));
    }, [orders]);
    
     const salesProfitConfig = {
        sales: { label: "إجمالي المبيعات", color: "hsl(var(--chart-2))" },
        profit: { label: "صافي الربح", color: "hsl(var(--primary))" },
    };

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

    const ordersByStoreConfig = {
        completed: { label: 'مكتملة', color: 'hsl(var(--primary))' },
        cancelled: { label: 'ملغاة', color: 'hsl(var(--destructive))' },
    };

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
    
   

    if (isLoading) return <DashboardLoading />;

    return (
        <div className="space-y-6">
             <div className="space-y-0.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
                <p className="text-muted-foreground">نظرة شاملة ولحظية على أداء تطبيقك.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الطلبات النشطة</CardTitle>
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Bike className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pulseData.activeOrders.value}</div>
                        <SparklineChart data={pulseData.activeOrders.trend} dataKey="value" color="hsl(var(--primary))"/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-500/10 text-green-500">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pulseData.todaySales.value.toLocaleString()}&nbsp;ر.ي</div>
                        <SparklineChart data={pulseData.todaySales.trend} dataKey="value" color="hsl(var(--chart-2))"/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">المناديب المتصلين</CardTitle>
                         <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                           <MapPin className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pulseData.onlineDrivers.value}</div>
                         <SparklineChart data={pulseData.onlineDrivers.trend} dataKey="value" color="hsl(var(--chart-3))"/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">طلبات في الانتظار</CardTitle>
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-destructive/10 text-destructive">
                          <Hourglass className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{pulseData.pendingOrders.value}</div>
                        <SparklineChart data={pulseData.pendingOrders.trend} dataKey="value" color="hsl(var(--destructive))"/>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>تحليل المبيعات والأرباح</CardTitle>
                        <CardDescription>إجمالي المبيعات مقابل صافي الربح خلال الأسبوع الماضي.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={salesProfitConfig} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={salesProfitData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value / 1000} ألف`} />
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                                <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>الطلبات المكتملة مقابل الملغاة</CardTitle>
                         <CardDescription>مقارنة بين الطلبات الناجحة والملغاة لكل متجر.</CardDescription>
                    </CardHeader>
                     <CardContent className="flex-1 pb-0">
                         <ChartContainer config={ordersByStoreConfig} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={ordersByStoreData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} tickFormatter={(value) => value.slice(0,10)} />
                                <XAxis type="number" hide />
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="cancelled" stackId="a" fill="var(--color-cancelled)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Award/>الأكثر مبيعاً</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow className='bg-muted/50'><TableHead>المنتج</TableHead><TableHead className="text-left">المبيعات</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {topProducts.map((product) => (
                                    <TableRow key={product.name}>
                                        <TableCell className="font-medium flex items-center gap-3">
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
                 <Card>
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
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card rounded-lg border shadow-sm">
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
