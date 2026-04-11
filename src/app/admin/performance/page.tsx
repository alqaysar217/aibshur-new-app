'use client';
import { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    TrendingUp, Award, ShieldAlert, Bike, MessageSquare, PackageCheck, Star, Clock, UserCheck,
    Search, FileText
} from 'lucide-react';
import PerformanceLoading from './loading';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Mock Data
const delegatePerformance = [
    { id: 'del1', name: 'أحمد علي', avatar: '/profile.png', deliveries: 120, avgTime: 28, rating: 4.9, cashCollected: 550000, deficit: 0 },
    { id: 'del2', name: 'خالد صالح', avatar: '/profile.png', deliveries: 95, avgTime: 32, rating: 4.7, cashCollected: 420000, deficit: 500 },
    { id: 'del3', name: 'محمد ناصر', avatar: '/profile.png', deliveries: 88, avgTime: 35, rating: 4.6, cashCollected: 390000, deficit: 0 },
    { id: 'del4', name: 'سعيد عبدالله', avatar: '/profile.png', deliveries: 150, avgTime: 25, rating: 4.95, cashCollected: 720000, deficit: 0 },
];
const supportPerformance = [
    { id: 'sup1', name: 'فاطمة حسن', avatar: '/profile.png', ticketsResolved: 85, avgResponseTime: 15, attendance: '98%' },
    { id: 'sup2', name: 'سارة عبدالله', avatar: '/profile.png', ticketsResolved: 72, avgResponseTime: 20, attendance: '95%' },
    { id: 'sup3', name: 'علياء محمد', avatar: '/profile.png', ticketsResolved: 95, avgResponseTime: 12, attendance: '100%' },
];

const productivityData = [
  { day: 'الأمس', value: 85 },
  { day: 'اليوم', value: 92 },
];
const chartConfig = {
  value: { label: 'الإنتاجية', color: 'hsl(var(--primary))' },
};


// Main Component
export default function PerformancePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [delegateSearch, setDelegateSearch] = useState('');
    const [supportSearch, setSupportSearch] = useState('');
    
    // Simulate loading
    useState(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    });

    const topDelegate = useMemo(() => delegatePerformance.reduce((prev, current) => (prev.deliveries > current.deliveries) ? prev : current), []);
    const topSupport = useMemo(() => supportPerformance.reduce((prev, current) => (prev.ticketsResolved > current.ticketsResolved) ? prev : current), []);

    const filteredDelegates = useMemo(() => delegatePerformance.filter(d => d.name.toLowerCase().includes(delegateSearch.toLowerCase())), [delegateSearch]);
    const filteredSupport = useMemo(() => supportPerformance.filter(s => s.name.toLowerCase().includes(supportSearch.toLowerCase())), [supportSearch]);


    if (isLoading) {
        return <PerformanceLoading />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground">إدارة أداء الموظفين</h1>
                    <p className="text-muted-foreground mt-1">لوحة قيادة لتحليل ومتابعة أداء فريق العمل.</p>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الطلبات المكتملة (اليوم)</CardTitle>
                        <PackageCheck className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">245</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">متوسط تقييم المناديب</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">4.8 / 5</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">التذاكر المغلقة (اليوم)</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">32</div></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Award />قائمة الشرف للأفضل أداءً</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-primary/10 rounded-lg flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary">
                                <AvatarImage src={topDelegate.avatar} alt={topDelegate.name} />
                                <AvatarFallback>{topDelegate.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-primary">{topDelegate.name}</p>
                                <p className="text-sm text-muted-foreground">المندوب الأكثر توصيلاً</p>
                            </div>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-lg flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary">
                                <AvatarImage src={topSupport.avatar} alt={topSupport.name} />
                                <AvatarFallback>{topSupport.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div>
                                <p className="font-bold text-primary">{topSupport.name}</p>
                                <p className="text-sm text-muted-foreground">نجم الدعم الفني</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert />تنبيهات الأداء</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">موظفون انخفض أداؤهم اليوم:</p>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src="/profile.png" alt="User" /><AvatarFallback>M</AvatarFallback></Avatar>
                            <span className="text-sm font-medium">مندوب 1 (-25%)</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src="/profile.png" alt="User" /><AvatarFallback>S</AvatarFallback></Avatar>
                            <span className="text-sm font-medium">دعم فني 2 (-30%)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="delegates" dir="rtl">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="delegates" className="gap-2"><Bike/>أداء المناديب</TabsTrigger>
                    <TabsTrigger value="support" className="gap-2"><MessageSquare/>أداء فريق الدعم</TabsTrigger>
                </TabsList>
                <TabsContent value="delegates" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="ابحث عن مندوب..." className="pr-10" value={delegateSearch} onChange={e => setDelegateSearch(e.target.value)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow>
                                        <TableHead className="text-center">المندوب</TableHead>
                                        <TableHead className="text-center">الطلبات الموصلة</TableHead>
                                        <TableHead className="text-center">متوسط وقت التوصيل (دقيقة)</TableHead>
                                        <TableHead className="text-center">التقييم</TableHead>
                                        <TableHead className="text-center">إجراءات</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                        {filteredDelegates.map(d => (
                                            <TableRow key={d.id}>
                                                <TableCell className="font-medium text-center">{d.name}</TableCell>
                                                <TableCell className="text-center">{d.deliveries}</TableCell>
                                                <TableCell className="text-center">{d.avgTime}</TableCell>
                                                <TableCell className="text-center flex items-center justify-center gap-1"><Star className="h-4 w-4 text-amber-500 fill-amber-400"/>{d.rating}</TableCell>
                                                <TableCell className="text-center"><Button variant="outline" size="sm"><FileText/>عرض الملف</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="support" className="mt-4">
                    <Card>
                        <CardHeader>
                             <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="ابحث عن موظف دعم..." className="pr-10" value={supportSearch} onChange={e => setSupportSearch(e.target.value)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow>
                                        <TableHead className="text-center">الموظف</TableHead>
                                        <TableHead className="text-center">التذاكر المعالجة</TableHead>
                                        <TableHead className="text-center">متوسط سرعة الرد (دقيقة)</TableHead>
                                        <TableHead className="text-center">نسبة الحضور</TableHead>
                                        <TableHead className="text-center">إجراءات</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                        {filteredSupport.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium text-center">{s.name}</TableCell>
                                                <TableCell className="text-center">{s.ticketsResolved}</TableCell>
                                                <TableCell className="text-center">{s.avgResponseTime}</TableCell>
                                                <TableCell className="text-center">{s.attendance}</TableCell>
                                                <TableCell className="text-center"><Button variant="outline" size="sm"><FileText/>عرض الملف</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
