'use client';
import { useMemo, type FC } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import {
    Activity, Award, CheckCircle, CircleDollarSign, Hourglass, MapPin, Package, Star, UserCheck, Database, TrendingUp, Users, PackageX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order as OrderWithDates } from '../orders/page';
import type { Driver } from '../delegates/page';
import type { Product } from '../products/page';
import DashboardLoading from './loading';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/lib/notifications';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

// Re-define OrderFS locally as it's not exported from orders/page
type OrderFS = {
    id: string;
    clientId: string;
    clientName: string;
    clientPhone: string;
    storeId: string;
    storeName: string;
    delegateId?: string;
    delegateName?: string;
    status: any; // OrderStatus
    items: { productId: string; productName: string; quantity: number; price: number; }[];
    financials: { subtotal: number; deliveryFee: number; discount: number; tip: number; total: number; };
    payment: { method: any; status: any; receiptImageUrl?: string; };
    address: { description: string; latitude: number; longitude: number; addressType?: 'home' | 'work' | 'other'; receiverName?: string; receiverPhone?: string; };
    timestamps: { createdAt: Timestamp; confirmedAt?: Timestamp; dispatchedAt?: Timestamp; deliveredAt?: Timestamp; cancelledAt?: Timestamp; scheduledDeliveryTime?: Timestamp; };
    cancellationReason?: string;
    notes?: string;
    rating?: { store: number; delegate: number; comment: string; };
    tipPayment?: { method: any; bankAccountId?: string; receiptNumber?: string; receiptImageUrl?: string; };
}

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    trendValue: string;
    trendDirection: 'up' | 'down';
    color: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon: Icon, trendValue, trendDirection, color }) => {
    const trendColor = trendDirection === 'up' ? 'text-green-500' : 'text-red-500';
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`flex items-center justify-center p-2 rounded-full`} style={{ backgroundColor: `${color}1A`}}>
                    <Icon className="h-5 w-5" style={{ color }}/>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    <span className={cn("font-semibold", trendColor)}>{trendValue}</span> عن الأسبوع الماضي
                </p>
            </CardContent>
        </Card>
    );
};


// Main Dashboard Content
function DashboardContent() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch data with Firestore Timestamps
    const { data: ordersFS, isLoading: isLoadingOrders } = useCollection<OrderFS>(useMemoFirebase(() => firestore && user ? collection(firestore, 'orders') : null, [firestore, user]));
    const { data: drivers, isLoading: isLoadingDrivers } = useCollection<Driver>(useMemoFirebase(() => firestore && user ? collection(firestore, 'drivers_v2') : null, [firestore, user]));
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(useMemoFirebase(() => firestore && user ? collection(firestore, 'products') : null, [firestore, user]));
    const { data: activityFeed, isLoading: isLoadingNotifications } = useCollection<Notification>(useMemoFirebase(() => firestore && user?.uid ? collection(firestore, 'notifications') : null, [firestore, user?.uid]));
    
    const isLoading = isLoadingOrders || isLoadingDrivers || isLoadingProducts || isLoadingNotifications;

    const orders: OrderWithDates[] = useMemo(() => {
        if (!ordersFS) return [];
        return ordersFS.map(orderFS => {
            const timestamps: any = {};
            if (orderFS.timestamps) {
                for (const key in orderFS.timestamps) {
                    const ts = (orderFS.timestamps as any)[key];
                    if (ts instanceof Timestamp) {
                        timestamps[key] = ts.toDate();
                    }
                }
            }
            return { ...orderFS, timestamps: timestamps as OrderWithDates['timestamps'] };
        });
    }, [ordersFS]);


    const pulseData = useMemo(() => {
        if (!orders || !drivers) return { totalSales: 0, salesTrend: '+0%', totalOrders: 0, ordersTrend: '+0%', totalClients: 0, clientsTrend: '+0%', cancelledOrders: 0, cancelledTrend: '+0%' };

        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const currentWeekOrders = orders.filter(o => o.timestamps.createdAt >= lastWeek);
        const previousWeekOrders = orders.filter(o => {
            const orderDate = o.timestamps.createdAt;
            return orderDate < lastWeek && orderDate >= new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        });

        const currentSales = currentWeekOrders.reduce((sum, o) => sum + o.financials.total, 0);
        const prevSales = previousWeekOrders.reduce((sum, o) => sum + o.financials.total, 0);

        const getTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? '+100%' : '+0%';
            const percentage = ((current - previous) / previous) * 100;
            return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(0)}%`;
        };
        
        const uniqueClients = new Set(currentWeekOrders.map(o => o.clientId)).size;

        return {
            totalSales: currentSales,
            salesTrend: getTrend(currentSales, prevSales),
            totalOrders: currentWeekOrders.length,
            ordersTrend: getTrend(currentWeekOrders.length, previousWeekOrders.length),
            totalClients: uniqueClients,
            clientsTrend: '+5%', // Mocked
            cancelledOrders: currentWeekOrders.filter(o => o.status === 'cancelled').length,
            cancelledTrend: getTrend(currentWeekOrders.filter(o => o.status === 'cancelled').length, previousWeekOrders.filter(o => o.status === 'cancelled').length),
        };
    }, [orders, drivers]);

    const salesProfitData = useMemo(() => {
        if (!orders) return [];
        const dataByDay: { [key: string]: { sales: number; profit: number } } = {};
        const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        orders.slice(0, 50).forEach(order => {
            const date = order.timestamps.createdAt;
            const dayName = weekDays[date.getDay()];
            if (!dataByDay[dayName]) dataByDay[dayName] = { sales: 0, profit: 0 };
            
            dataByDay[dayName].sales += order.financials.total;
            dataByDay[dayName].profit += (order.financials.subtotal * 0.4) - order.financials.discount; // Example profit calculation
        });

        return weekDays.map(day => ({ name: day, ...dataByDay[day] || {sales: 0, profit: 0} }));
    }, [orders]);

    const ordersByStoreData = useMemo(() => {
        if (!orders) return [];
        const salesMap = new Map<string, number>();
        orders.forEach(order => {
            if(order.status === 'delivered') {
                salesMap.set(order.storeName, (salesMap.get(order.storeName) || 0) + 1);
            }
        });
        return Array.from(salesMap.entries())
            .map(([name, orders]) => ({ name, orders }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5);
    }, [orders]);

    const orderStatusData = useMemo(() => {
        if (!orders) return [];
        const dataByStore: { [key: string]: { completed: number; cancelled: number } } = {};
        orders.forEach(order => {
            const storeName = order.storeName;
             if (!dataByStore[storeName]) dataByStore[storeName] = { completed: 0, cancelled: 0 };
            
            if (order.status === 'delivered') dataByStore[storeName].completed += 1;
            if (order.status === 'cancelled') dataByStore[storeName].cancelled += 1;
        });
        return Object.entries(dataByStore).map(([name, data]) => ({name, ...data})).slice(0, 5);
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
                    sales: `${sales.toLocaleString('en-US')} طلب`,
                    image: product?.mainImageUrl || 'https://picsum.photos/seed/product/40/40'
                };
            });
    }, [orders, products]);
    
    const performanceIndexData = [
        { name: 'المناديب', value: 4.8, fill: 'var(--color-delegates)' },
        { name: 'المتاجر', value: 4.5, fill: 'var(--color-stores)' },
    ];
    
    const salesGrowthConfig = { sales: { label: "المبيعات", color: "hsl(var(--primary))" } };
    const orderStatusConfig = { completed: { label: "مكتمل", color: "hsl(var(--primary))" }, cancelled: { label: "ملغي", color: "hsl(var(--destructive))" } };
    const performanceIndexConfig = { delegates: { label: "المناديب", color: "hsl(var(--chart-2))" }, stores: { label: "المتاجر", color: "hsl(var(--chart-3))" } };
    const storeDistributionConfig = { orders: { label: "الطلبات", color: "hsl(var(--chart-1))" }};

    if (isLoading) return <DashboardLoading />;

    return (
        <div className="space-y-6">
             <div className="space-y-0.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
                <p className="text-muted-foreground">نظرة شاملة ولحظية على أداء تطبيقك.</p>
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="إجمالي المبيعات" value={`${pulseData.totalSales.toLocaleString('en-US')} ر.ي`} icon={CircleDollarSign} trendValue={pulseData.salesTrend} trendDirection={pulseData.salesTrend.startsWith('+') ? 'up' : 'down'} color="#10B981" />
                <StatCard title="إجمالي الطلبات" value={pulseData.totalOrders.toLocaleString('en-US')} icon={Package} trendValue={pulseData.ordersTrend} trendDirection={pulseData.ordersTrend.startsWith('+') ? 'up' : 'down'} color="#3B82F6" />
                <StatCard title="إجمالي العملاء" value={pulseData.totalClients.toLocaleString('en-US')} icon={Users} trendValue={pulseData.clientsTrend} trendDirection="up" color="#8B5CF6" />
                <StatCard title="الطلبات الملغاة" value={pulseData.cancelledOrders.toLocaleString('en-US')} icon={PackageX} trendValue={pulseData.cancelledTrend} trendDirection={pulseData.cancelledTrend.startsWith('+') ? 'up' : 'down'} color="#EF4444" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2"><TrendingUp/>نمو المبيعات الأسبوعي</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                       <ChartContainer config={salesGrowthConfig} className="h-[300px] w-full">
                             <LineChart accessibilityLayer data={salesProfitData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${Number(value) / 1000} ألف`} />
                                <Tooltip content={<ChartTooltipContent indicator="dot" formatter={(value) => value.toLocaleString('en-US')} />} />
                                <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={3} dot={{r:5}} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
                 <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>الطلبات المكتملة مقابل الملغاة</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={orderStatusConfig} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={orderStatusData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 10)} />
                                <YAxis tickFormatter={(value) => value.toLocaleString('en-US')}/>
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                                <Bar dataKey="cancelled" fill="var(--color-cancelled)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                     <CardHeader>
                        <CardTitle>توزيع الطلبات على المتاجر</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={storeDistributionConfig} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={ordersByStoreData} layout="vertical" margin={{left: 10, right: 10}}>
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} tickFormatter={(value) => value.slice(0,10)} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="orders" fill="var(--color-orders)" radius={5} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>مؤشر كفاءة الأداء</CardTitle>
                        <CardDescription>متوسط تقييم المناديب والمتاجر.</CardDescription>
                    </CardHeader>
                     <CardContent className="flex justify-center items-center">
                        <ChartContainer config={performanceIndexConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={performanceIndexData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} >
                                    {performanceIndexData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
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
                 <Card className="md:col-span-2 shadow-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Activity/>آخر الأنشطة في النظام</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       {(activityFeed && activityFeed.length > 0) ? activityFeed.slice(0, 4).map((item: any) => {
                           const Icon = CheckCircle; 
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

export default function DashboardPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'systemSettings', 'main') : null, [firestore]);
    const { data: settings } = useDoc(settingsDocRef);
    
    if (isUserLoading) {
        return <DashboardLoading />;
    }

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

    return <DashboardContent />;
}
