'use client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import {
    Activity, ArrowUp, BarChart2, Calendar, CircleDollarSign, Clock, Users,
    Hourglass, Map, MapPin, Package, Star, Ticket, TrendingUp, Award, CheckCircle, UserCheck, PlusCircle, ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// MOCK DATA

const pulseData = {
    activeOrders: { value: 120, trend: [{ value: 5 }, { value: 10 }, { value: 8 }, { value: 15 }, { value: 12 }] },
    liveSales: { value: 2450000, trend: [{ value: 1000 }, { value: 3000 }, { value: 2000 }, { value: 4000 }, { value: 5000 }] },
    onlineDrivers: { value: 45, trend: [{ value: 3 }, { value: 5 }, { value: 4 }, { value: 7 }, { value: 6 }] },
    pendingQueue: { value: 8, trend: [{ value: 1 }, { value: 3 }, { value: 2 }, { value: 4 }, { value: 2 }] },
};

const salesProfitData = [
  { name: 'السبت', sales: 400000, profit: 240000 },
  { name: 'الأحد', sales: 300000, profit: 139800 },
  { name: 'الإثنين', sales: 200000, profit: 98000 },
  { name: 'الثلاثاء', sales: 278000, profit: 180000 },
  { name: 'الأربعاء', sales: 189000, profit: 110000 },
  { name: 'الخميس', sales: 239000, profit: 160000 },
  { name: 'الجمعة', sales: 349000, profit: 210000 },
];
const salesProfitConfig = {
    sales: { label: "إجمالي المبيعات", color: "hsl(var(--chart-2))" },
    profit: { label: "صافي الربح", color: "hsl(var(--primary))" },
};

const orderStatusData = [
    { name: 'صنعاء', completed: 400, cancelled: 24 },
    { name: 'عدن', completed: 300, cancelled: 13 },
    { name: 'حضرموت', completed: 200, cancelled: 9 },
    { name: 'تعز', completed: 278, cancelled: 39 },
    { name: 'إب', completed: 189, cancelled: 48 },
];
const orderStatusConfig = {
    completed: { label: "مكتمل", color: "hsl(var(--primary))" },
    cancelled: { label: "ملغي", color: "hsl(var(--destructive))" },
};

const performanceIndexData = [
    { name: 'المناديب', value: 4.8, fill: 'var(--color-delegates)' },
    { name: 'المتاجر', value: 4.5, fill: 'var(--color-stores)' },
];
const performanceIndexConfig = {
    delegates: { label: "المناديب", color: "hsl(var(--chart-2))" },
    stores: { label: "المتاجر", color: "hsl(var(--chart-3))" },
};

const topProducts = [
    { name: 'عقدة دجاج', sales: '150 طلب', image: 'https://picsum.photos/seed/ogda-dajaj/40/40' },
    { name: 'مندي لحم', sales: '120 طلب', image: 'https://picsum.photos/seed/mandi-laham/40/40' },
    { name: 'برجر دبل', sales: '95 طلب', image: 'https://picsum.photos/seed/burger-double/40/40' },
    { name: 'بيتزا مارجريتا', sales: '80 طلب', image: 'https://picsum.photos/seed/pizza/40/40' },
    { name: 'عصير مانجو', sales: '180 طلب', image: 'https://picsum.photos/seed/mango/40/40' },
];

const activityFeed = [
    { id: 1, text: 'تم قبول الطلب #120 بواسطة مطعم البيت الصنعاني', time: 'منذ دقيقة', icon: CheckCircle },
    { id: 2, text: 'سجل المندوب "أحمد علي" دخوله للنظام', time: 'منذ 3 دقائق', icon: UserCheck },
    { id: 3, text: 'تم إضافة منتج جديد: "شاورما دجاج" لمتجر كينج فلافل', time: 'منذ 5 دقائق', icon: PlusCircle },
    { id: 4, text: 'تم استلام طلب جديد #121 من العميل "سارة قائد"', time: 'منذ 8 دقائق', icon: ShoppingCart },
];


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

export default function DashboardPage() {
    return (
        <div className="space-y-6">
             <div className="space-y-0.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
                <p className="text-muted-foreground">نظرة شاملة ولحظية على أداء تطبيقك.</p>
            </div>
            {/* Pulse Section */}
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

            {/* Financials & Growth Section */}
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
            
             {/* Geographic & Ops Section */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>توزيع الطلبات على المحافظات</CardTitle>
                        <CardDescription>كثافة الطلبات في المناطق الرئيسية.</CardDescription>
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

            {/* "The Most" & Activity Section */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Award/>الأكثر مبيعاً وتقييماً</CardTitle></CardHeader>
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
                       {activityFeed.map(item => {
                           const Icon = item.icon;
                           return (
                            <div key={item.id} className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                                <div className="flex-1">
                                    <p className="text-sm">{item.text}</p>
                                    <p className="text-xs text-muted-foreground">{item.time}</p>
                                </div>
                            </div>
                           )
                       })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
