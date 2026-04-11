'use client';
import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import {
    Activity, Award, CheckCircle, CircleDollarSign, Hourglass, MapPin, Package, Star, UserCheck, Database
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order } from '../orders/page';
import type { Driver } from '../delegates/page';
import type { Product } from '../products/page';
import DashboardLoading from './loading';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


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
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(useMemoFirebase(() => firestore && user ? collection(firestore, 'orders') : null, [firestore, user]));
    const { data: drivers, isLoading: isLoadingDrivers } = useCollection<Driver>(useMemoFirebase(() => firestore && user ? collection(firestore, 'drivers_v2') : null, [firestore, user]));
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(useMemoFirebase(() => firestore && user ? collection(firestore, 'products') : null, [firestore, user]));
    const { data: activityFeed, isLoading: isLoadingNotifications } = useCollection<any>(useMemoFirebase(() => firestore && user?.uid ? collection(firestore, 'notifications') : null, [firestore, user?.uid]));
    
    const isLoading = isLoadingOrders || isLoadingDrivers || isLoadingProducts || isLoadingNotifications;

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
            { value: currentValue * 0.8 }, { value: currentValue * 1.1 }, { value: currentValue * 0.9 }, { value: currentValue * 1.2 }, { value: currentValue }
        ];

        return {
            activeOrders: { value: activeOrders.length, trend: generateTrend(activeOrders.length) },
            liveSales: { value: liveSales, trend: generateTrend(liveSales / 1000) },
            onlineDrivers: { value: onlineDrivers.length, trend: generateTrend(onlineDrivers.length) },
            pendingQueue: { value: pendingQueue.length, trend: generateTrend(pendingQueue.length) },
        };
    }, [orders, drivers]);

    const salesProfitData = useMemo(() => {
        if (!orders) return [];
        const dataByDay: { [key: string]: { sales: number; profit: number } } = {};
        const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        orders.forEach(order => {
            const date = new Date(order.timestamps.createdAt);
            const dayName = weekDays[date.getDay()];
            if (!dataByDay[dayName]) {
                dataByDay[dayName] = { sales: 0, profit: 0 };
            }
            dataByDay[dayName].sales += order.financials.total;
            dataByDay[dayName].profit += (order.financials.subtotal * 0.4) - order.financials.discount;
        });

        return weekDays.map(day => ({ name: day, ...dataByDay[day] || {sales: 0, profit: 0} }));
    }, [orders]);

    const orderStatusData = useMemo(() => {
        if (!orders) return [];
        const dataByProvince: { [key: string]: { completed: number; cancelled: number } } = {};
        orders.forEach(order => {
            const provinceName = order.storeName; // Simplified: using store name as province for demo
             if (!dataByProvince[provinceName]) {
                dataByProvince[provinceName] = { completed: 0, cancelled: 0 };
            }
            if (order.status === 'delivered') dataByProvince[provinceName].completed += 1;
            if (order.status === 'cancelled') dataByProvince[provinceName].cancelled += 1;
        });
        return Object.entries(dataByProvince).map(([name, data]) => ({name, ...data})).slice(0, 5); // Take top 5
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
    
    const salesProfitConfig = {
        sales: { label: "إجمالي المبيعات", color: "hsl(var(--chart-2))" },
        profit: { label: "صافي الربح", color: "hsl(var(--primary))" },
    };
    const orderStatusConfig = {
        completed: { label: "مكتمل", color: "hsl(var(--primary))" },
        cancelled: { label: "ملغي", color: "hsl(var(--destructive))" },
    };
     const performanceIndexConfig = {
        delegates: { label: "المناديب", color: "hsl(var(--chart-2))" },
        stores: { label: "المتاجر", color: "hsl(var(--chart-3))" },
    };

    const performanceIndexData = [
        { name: 'المناديب', value: 4.8, fill: 'var(--color-delegates)' },
        { name: 'المتاجر', value: 4.5, fill: 'var(--color-stores)' },
    ];

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
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pulseData.activeOrders.value}</div>
                        <SparklineChart data={pulseData.activeOrders.trend} dataKey="value" color="hsl(var(--primary))"/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">المبيعات اللحظية (اليوم)</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pulseData.liveSales.value.toLocaleString()}&nbsp;ر.ي</div>
                        <SparklineChart data={pulseData.liveSales.trend} dataKey="value" color="hsl(var(--chart-2))"/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">المناديب المتصلين</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pulseData.onlineDrivers.value}</div>
                         <SparklineChart data={pulseData.onlineDrivers.trend} dataKey="value" color="hsl(var(--chart-3))"/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">طلبات في الانتظار</CardTitle>
                        <Hourglass className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{pulseData.pendingQueue.value}</div>
                        <SparklineChart data={pulseData.pendingQueue.trend} dataKey="value" color="hsl(var(--destructive))"/>
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
                            <LineChart accessibilityLayer data={salesProfitData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value / 1000} ألف`} />
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} />
                                <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>الطلبات المكتملة مقابل الملغاة</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={orderStatusConfig} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={orderStatusData} layout="vertical" stackOffset="expand">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={60}/>
                                <Tooltip content={<ChartTooltipContent hideLabel />} />
                                <Legend />
                                <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="cancelled" stackId="a" fill="var(--color-cancelled)" radius={[4, 0, 0, 4]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>توزيع الطلبات على المتاجر</CardTitle>
                        <CardDescription>كثافة الطلبات في المتاجر الرئيسية.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={{}} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={orderStatusData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
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
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
             </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
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
    const settingsDocRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'systemSettings', 'main') : null, [firestore, user]);
    const { data: settings, isLoading: isLoadingSettings } = useDoc(settingsDocRef);
    
    if (isLoadingSettings || isUserLoading) {
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
