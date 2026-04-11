'use client';

import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
    Activity, ArrowDown, ArrowUp, BarChart3, Package, PackageCheck, PackageX, PieChart as PieChartIcon,
    TrendingUp, Wallet, CircleDollarSign, Users
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Mock Data
const kpiData = {
  totalRevenue: { value: 1250000, change: 12.5 },
  totalOrders: { value: 89, change: -2.1 },
  newUsers: { value: 32, change: 30 },
  avgOrderValue: { value: 14045, change: 5.2 },
};

const salesData = [
  { day: 'السبت', sales: 180000 },
  { day: 'الأحد', sales: 210000 },
  { day: 'الإثنين', sales: 250000 },
  { day: 'الثلاثاء', sales: 230000 },
  { day: 'الأربعاء', sales: 280000 },
  { day: 'الخميس', sales: 310000 },
  { day: 'الجمعة', sales: 150000 },
];

const topProducts = [
  { name: 'عقدة لحم', sales: 150, image: '/product-ogda-meat.jpg' },
  { name: 'مندي دجاج', sales: 120, image: '/product-mandi-chicken.jpg' },
  { name: 'فحسة', sales: 95, image: '/product-fahsa.jpg' },
];

const recentOrders = [
  { id: 'ORD582', client: 'علي محسن', total: 12500, status: 'preparing' },
  { id: 'ORD581', client: 'فاطمة صالح', total: 8000, status: 'dispatched' },
  { id: 'ORD580', client: 'خالد أحمد', total: 25000, status: 'delivered' },
  { id: 'ORD579', client: 'سارة عبدالله', total: 5500, status: 'confirmed' },
  { id: 'ORD578', client: 'ياسر محمد', total: 16000, status: 'cancelled' },
];

const salesChartConfig = {
    sales: { label: "المبيعات", color: "hsl(var(--primary))" },
};
  
const topProductsChartConfig = {
    sales: { label: "عدد الطلبات" },
    'عقدة لحم': { color: "hsl(var(--chart-1))" },
    'مندي دجاج': { color: "hsl(var(--chart-2))" },
    'فحسة': { color: "hsl(var(--chart-3))" },
};


export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-0.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
                <p className="text-muted-foreground">نظرة شاملة على أداء تطبيقك.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.totalRevenue.value.toLocaleString()}&nbsp;ر.ي</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={kpiData.totalRevenue.change > 0 ? 'text-green-500' : 'text-red-500'}>{kpiData.totalRevenue.change}%</span>
                            {kpiData.totalRevenue.change > 0 ? <ArrowUp className="h-3 w-3 text-green-500"/> : <ArrowDown className="h-3 w-3 text-red-500"/>}
                            عن الشهر الماضي
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الطلبات الجديدة (اليوم)</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{kpiData.totalOrders.value.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={kpiData.totalOrders.change > 0 ? 'text-green-500' : 'text-red-500'}>{kpiData.totalOrders.change}%</span>
                            {kpiData.totalOrders.change > 0 ? <ArrowUp className="h-3 w-3 text-green-500"/> : <ArrowDown className="h-3 w-3 text-red-500"/>}
                            عن الأمس
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مستخدمون جدد (اليوم)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{kpiData.newUsers.value}</div>
                         <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={kpiData.newUsers.change > 0 ? 'text-green-500' : 'text-red-500'}>{kpiData.newUsers.change}%</span>
                            {kpiData.newUsers.change > 0 ? <ArrowUp className="h-3 w-3 text-green-500"/> : <ArrowDown className="h-3 w-3 text-red-500"/>}
                            عن الأمس
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.avgOrderValue.value.toLocaleString()}&nbsp;ر.ي</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={kpiData.avgOrderValue.change > 0 ? 'text-green-500' : 'text-red-500'}>{kpiData.avgOrderValue.change}%</span>
                            {kpiData.avgOrderValue.change > 0 ? <ArrowUp className="h-3 w-3 text-green-500"/> : <ArrowDown className="h-3 w-3 text-red-500"/>}
                            عن الأسبوع الماضي
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>نظرة عامة على المبيعات</CardTitle>
                        <CardDescription>إجمالي المبيعات خلال الأسبوع الماضي.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={salesData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value / 1000} ألف`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>المنتجات الأكثر مبيعًا</CardTitle>
                        <CardDescription>أفضل 3 منتجات خلال هذا الأسبوع.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={topProductsChartConfig} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={80} />
                                <XAxis dataKey="sales" type="number" hide />
                                <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="sales" layout="vertical" radius={5}>
                                {topProducts.map((product) => (
                                    <Cell key={product.name} fill={`var(--color-${product.name})`} />
                                ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>آخر الطلبات</CardTitle>
                    <CardDescription>آخر 5 طلبات تم تسجيلها في النظام.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">رقم الطلب</TableHead>
                                    <TableHead className="text-center">العميل</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center">الإجمالي</TableHead>
                                    <TableHead className="text-center">الإجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="text-center font-mono">{order.id}</TableCell>
                                        <TableCell className="font-medium text-center">{order.client}</TableCell>
                                        <TableCell className="text-center"><OrderStatusBadge status={order.status as any} /></TableCell>
                                        <TableCell className="text-center">{order.total.toLocaleString()}&nbsp;ر.ي</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="outline" size="sm">عرض التفاصيل</Button>
                                        </TableCell>
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
