'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SalesReportsLoading from './loading';
import { OrderStatusBadge } from '@/components/order-status-badge';

import type { Order as OrderFS } from '../orders/page';
import type { Store } from '../stores/page';
import type { AppProvince } from '../governorates/page';

import {
    Activity, ArrowDown, ArrowUp, BarChart3, Calendar as CalendarIcon, Download, Filter, HandCoins,
    LineChart, MoreHorizontal, Package, PackageCheck, PackageX, PieChart as PieChartIcon, Search,
    TrendingUp, Wallet, CircleDollarSign
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";


// Main Component
export default function SalesReportsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // State for filters
    const [filters, setFilters] = useState<{
        dateRange: DateRange | undefined,
        storeId: string,
        provinceId: string,
        paymentMethod: string,
        searchTerm: string,
    }>({
        dateRange: { from: lastMonth, to: today },
        storeId: 'all',
        provinceId: 'all',
        paymentMethod: 'all',
        searchTerm: '',
    });

    // Data Fetching
    const { data: orders, isLoading: isLoadingOrders } = useCollection<OrderFS>(useMemoFirebase(() => firestore ? collection(firestore, 'orders') : null, [firestore]));
    const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]));
    const { data: provinces, isLoading: isLoadingProvinces } = useCollection<AppProvince>(useMemoFirebase(() => firestore ? collection(firestore, 'app_provinces') : null, [firestore]));
    const isLoading = isLoadingOrders || isLoadingStores || isLoadingProvinces;
    
    // Memos for data processing
    const storesMap = useMemo(() => stores?.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}) || {}, [stores]);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        return orders.filter(o => {
            const orderDate = o.timestamps.createdAt.toDate();
            const matchesDate = !filters.dateRange?.from || (orderDate >= filters.dateRange.from && (!filters.dateRange.to || orderDate <= new Date(new Date(filters.dateRange.to).setHours(23, 59, 59, 999))));
            
            const store = storesMap[o.storeId];
            const matchesProvince = filters.provinceId === 'all' || (store && store.provinceId === filters.provinceId);
            
            const matchesStore = filters.storeId === 'all' || o.storeId === filters.storeId;
            const matchesPayment = filters.paymentMethod === 'all' || o.payment.method === filters.paymentMethod;
            const matchesSearch = !filters.searchTerm || o.id.includes(filters.searchTerm) || o.clientName.includes(filters.searchTerm);
            
            return matchesDate && matchesStore && matchesProvince && matchesPayment && matchesSearch;
        });
    }, [orders, filters, storesMap]);

    const salesStats = useMemo(() => {
        const totalSales = filteredOrders.reduce((acc, o) => acc + o.financials.total, 0);
        const totalDiscounts = filteredOrders.reduce((acc, o) => acc + o.financials.discount, 0);
        const completedOrders = filteredOrders.filter(o => o.status === 'delivered');
        const cancelledOrdersCount = filteredOrders.filter(o => o.status === 'cancelled').length;
        const averageOrderValue = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;
        
        const netRevenue = totalSales - totalDiscounts;

        return { totalSales, totalDiscounts, completedOrdersCount: completedOrders.length, cancelledOrdersCount, averageOrderValue, netRevenue };
    }, [filteredOrders]);

    const salesOverTimeData = useMemo(() => {
        const salesByDate: { [key: string]: number } = {};
        filteredOrders.forEach(order => {
            const date = format(order.timestamps.createdAt.toDate(), 'yyyy-MM-dd');
            salesByDate[date] = (salesByDate[date] || 0) + order.financials.total;
        });
        return Object.entries(salesByDate).map(([date, sales]) => ({ date, sales })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredOrders]);
    
    const salesOverTimeChartConfig = { sales: { label: "المبيعات", color: "hsl(var(--primary))" } };


    const paymentMethodData = useMemo(() => {
        const counts = filteredOrders.reduce((acc, o) => {
            acc[o.payment.method] = (acc[o.payment.method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredOrders]);

    const paymentMethodChartConfig = {
        cash: { label: 'نقدي', color: 'hsl(var(--chart-1))' },
        wallet: { label: 'محفظة', color: 'hsl(var(--chart-2))' },
        bank_transfer: { label: 'تحويل بنكي', color: 'hsl(var(--chart-3))' },
    };

    const handleExport = () => {
        if (!filteredOrders.length) {
            toast({ title: "لا توجد بيانات للتصدير", description: "البيانات الحالية لا تحتوي على طلبات." });
            return;
        }

        const headers = ["ID", "Date", "Store", "Client", "Payment Method", "Total", "Status"];
        const csvRows = [headers.join(",")];

        for (const order of filteredOrders) {
            const row = [
                order.id,
                order.timestamps.createdAt.toDate().toISOString(),
                `"${order.storeName}"`,
                `"${order.clientName}"`,
                order.payment.method,
                order.financials.total,
                order.status
            ];
            csvRows.push(row.join(","));
        }

        const csvString = csvRows.join("\n");
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "تم بدء التصدير", description: `يتم تنزيل ${filteredOrders.length} سجل.` });
    };

    if (isLoading) return <SalesReportsLoading />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground">تقارير المبيعات</h1>
                    <p className="text-muted-foreground mt-1">تحليل أداء المبيعات والطلبات في النظام.</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Filter className="text-primary"/> فلترة متقدمة</CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant="outline" className={cn("w-full sm:w-64 justify-start text-left font-normal", !filters.dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {filters.dateRange?.from ? (filters.dateRange.to ? `${format(filters.dateRange.from, "d/MM/yy")} - ${format(filters.dateRange.to, "d/MM/yy")}` : format(filters.dateRange.from, "d MMM yyyy")) : "اختر تاريخ"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={filters.dateRange?.from} selected={filters.dateRange} onSelect={(date) => setFilters(f => ({ ...f, dateRange: date }))} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                     <Select value={filters.provinceId} onValueChange={v => setFilters(f => ({ ...f, provinceId: v }))}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="المحافظة" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">كل المحافظات</SelectItem>{provinces?.map(p => <SelectItem key={p.id} value={p.id}>{p.province_name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filters.storeId} onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="المتجر" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">كل المتاجر</SelectItem>{stores?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select value={filters.paymentMethod} onValueChange={v => setFilters(f => ({ ...f, paymentMethod: v }))}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="طريقة الدفع" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">كل الطرق</SelectItem><SelectItem value="cash">نقدي</SelectItem><SelectItem value="wallet">محفظة</SelectItem><SelectItem value="bank_transfer">تحويل بنكي</SelectItem></SelectContent>
                    </Select>
                     <div className="relative flex-grow">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="ابحث برقم الطلب أو اسم العميل..." value={filters.searchTerm} onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))} className="pr-10" />
                    </div>
                    <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto"><Download/> تصدير CSV</Button>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle><CircleDollarSign className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{salesStats.totalSales.toLocaleString('en-US')}&nbsp;ر.ي</div></CardContent></Card>
                <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">صافي الإيرادات</CardTitle><TrendingUp className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{salesStats.netRevenue.toLocaleString('en-US')}&nbsp;ر.ي</div></CardContent></Card>
                <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">الطلبات المكتملة</CardTitle><PackageCheck className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">+{salesStats.completedOrdersCount.toLocaleString('en-US')}</div></CardContent></Card>
                <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle><HandCoins className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{salesStats.averageOrderValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}&nbsp;ر.ي</div></CardContent></Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 shadow-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> المبيعات خلال الفترة</CardTitle></CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={salesOverTimeChartConfig} className="h-[250px] w-full">
                            <AreaChart accessibilityLayer data={salesOverTimeData} margin={{ left: 12, right: 12, top: 5, bottom: 5}}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${Number(value) / 1000}k`}/>
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value) => value.toLocaleString('en-US')} />} />
                                <Area dataKey="sales" type="natural" fill="var(--color-sales)" fillOpacity={0.4} stroke="var(--color-sales)" strokeWidth={2} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3 shadow-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="text-primary"/> توزيع طرق الدفع</CardTitle></CardHeader>
                    <CardContent className="flex-1 pb-0 flex justify-center items-center">
                        <ChartContainer config={paymentMethodChartConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={paymentMethodData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                    {paymentMethodData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={cn(`var(--color-${entry.name})`)} />))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>سجل المبيعات التفصيلي</CardTitle>
                    <CardDescription>عرض لجميع الطلبات ضمن الفلاتر المحددة.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">رقم الطلب</TableHead>
                                    <TableHead className="text-center">التاريخ</TableHead>
                                    <TableHead className="text-center">المتجر</TableHead>
                                    <TableHead className="text-center">العميل</TableHead>
                                    <TableHead className="text-center">طريقة الدفع</TableHead>
                                    <TableHead className="text-center">الإجمالي</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {filteredOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="text-center font-mono">{order.id.substring(0, 8)}</TableCell>
                                        <TableCell className="text-center">{format(order.timestamps.createdAt.toDate(), "d MMM yyyy", { locale: ar })}</TableCell>
                                        <TableCell className="text-center">{order.storeName}</TableCell>
                                        <TableCell className="text-center">{order.clientName}</TableCell>
                                        <TableCell className="text-center">{order.payment.method}</TableCell>
                                        <TableCell className="text-center font-semibold">{order.financials.total.toLocaleString('en-US')}&nbsp;ر.ي</TableCell>
                                        <TableCell className="text-center"><OrderStatusBadge status={order.status}/></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
