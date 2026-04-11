'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    TrendingUp, Award, ShieldAlert, Bike, MessageSquare, PackageCheck, Star, Clock, UserCheck,
    Search, FileText, MapPin, Phone, Mail, FileDigit, Calendar as CalendarIcon, Briefcase, User, CircleDollarSign
} from 'lucide-react';
import PerformanceLoading from './loading';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const LocationMapViewer = dynamic(() => import('@/components/location-map-viewer').then(mod => mod.LocationMapViewer), { ssr: false, loading: () => <div className="h-48 w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });

// Type Definitions
type Delegate = {
    id: string;
    role: 'delegate';
    name: string;
    avatar: string;
    deliveries: number;
    avgTime: number;
    rating: number;
    cashCollected: number;
    deficit: number;
    phone: string;
    email: string;
    address: string;
    governorate: string;
    latitude: number;
    longitude: number;
    personalPhotoUrl: string;
    idType: 'card' | 'passport';
    idFrontPhotoUrl: string;
    idBackPhotoUrl?: string;
};

type SupportStaff = {
    id: string;
    role: 'support';
    name: string;
    avatar: string;
    ticketsResolved: number;
    avgResponseTime: number; // in minutes
    attendance: string;
    phone: string;
    email: string;
    address: string;
    governorate: string;
};

type Employee = Delegate | SupportStaff;

// Mock Data
const delegatePerformance: Delegate[] = [
    { id: 'del1', role: 'delegate', name: 'أحمد علي', avatar: '/profile.png', deliveries: 120, avgTime: 28, rating: 4.9, cashCollected: 550000, deficit: 0, phone: '777111222', email: 'ahmed.ali@example.com', address: 'شارع حدة', governorate: 'صنعاء', latitude: 15.33, longitude: 44.20, personalPhotoUrl: '/profile.png', idType: 'card', idFrontPhotoUrl: 'https://picsum.photos/seed/id1f/400/250', idBackPhotoUrl: 'https://picsum.photos/seed/id1b/400/250' },
    { id: 'del2', role: 'delegate', name: 'خالد صالح', avatar: '/profile.png', deliveries: 95, avgTime: 32, rating: 4.7, cashCollected: 420000, deficit: 500, phone: '777222333', email: 'khalid.s@example.com', address: 'شارع الزبيري', governorate: 'صنعاء', latitude: 15.35, longitude: 44.21, personalPhotoUrl: '/profile.png', idType: 'passport', idFrontPhotoUrl: 'https://picsum.photos/seed/id2f/400/250' },
    { id: 'del3', role: 'delegate', name: 'محمد ناصر', avatar: '/profile.png', deliveries: 88, avgTime: 35, rating: 4.6, cashCollected: 390000, deficit: 0, phone: '777444555', email: 'mo.nasser@example.com', address: 'المنصورة', governorate: 'عدن', latitude: 12.83, longitude: 45.01, personalPhotoUrl: '/profile.png', idType: 'card', idFrontPhotoUrl: 'https://picsum.photos/seed/id3f/400/250', idBackPhotoUrl: 'https://picsum.photos/seed/id3b/400/250' },
    { id: 'del4', role: 'delegate', name: 'سعيد عبدالله', avatar: '/profile.png', deliveries: 150, avgTime: 25, rating: 4.95, cashCollected: 720000, deficit: 0, phone: '777666777', email: 'saeed.a@example.com', address: 'المكلا', governorate: 'حضرموت', latitude: 14.54, longitude: 49.13, personalPhotoUrl: '/profile.png', idType: 'card', idFrontPhotoUrl: 'https://picsum.photos/seed/id4f/400/250', idBackPhotoUrl: 'https://picsum.photos/seed/id4b/400/250' },
];

const supportPerformance: SupportStaff[] = [
    { id: 'sup1', role: 'support', name: 'فاطمة حسن', avatar: '/profile.png', ticketsResolved: 85, avgResponseTime: 15, attendance: '98%', phone: '777888999', email: 'fatima.h@example.com', address: 'قسم الدعم الفني', governorate: 'صنعاء' },
    { id: 'sup2', role: 'support', name: 'سارة عبدالله', avatar: '/profile.png', ticketsResolved: 72, avgResponseTime: 20, attendance: '95%', phone: '777999000', email: 'sara.a@example.com', address: 'قسم الدعم الفني', governorate: 'عدن' },
    { id: 'sup3', role: 'support', name: 'علياء محمد', avatar: '/profile.png', ticketsResolved: 95, avgResponseTime: 12, attendance: '100%', phone: '777000111', email: 'alia.m@example.com', address: 'قسم الدعم الفني', governorate: 'صنعاء' },
];

// Main Component
export default function PerformancePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [delegateSearch, setDelegateSearch] = useState('');
    const [supportSearch, setSupportSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    
    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const topDelegate = useMemo(() => delegatePerformance.reduce((prev, current) => (prev.deliveries > current.deliveries) ? prev : current), []);
    const topSupport = useMemo(() => supportPerformance.reduce((prev, current) => (prev.ticketsResolved > current.ticketsResolved) ? prev : current), []);

    const filteredDelegates = useMemo(() => delegatePerformance.filter(d => d.name.toLowerCase().includes(delegateSearch.toLowerCase())), [delegateSearch]);
    const filteredSupport = useMemo(() => supportPerformance.filter(s => s.name.toLowerCase().includes(supportSearch.toLowerCase())), [supportSearch]);

    const handleViewProfile = (employee: Employee) => {
        setSelectedEmployee(employee);
    };

    if (isLoading) {
        return <PerformanceLoading />;
    }

    return (
        <>
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
                                                    <TableCell className="text-center"><Button variant="outline" size="sm" onClick={() => handleViewProfile(d)}><FileText/>عرض الملف</Button></TableCell>
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
                                                    <TableCell className="text-center"><Button variant="outline" size="sm" onClick={() => handleViewProfile(s)}><FileText/>عرض الملف</Button></TableCell>
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

            <Dialog open={!!selectedEmployee} onOpenChange={(isOpen) => !isOpen && setSelectedEmployee(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right border-b pb-4">
                    {selectedEmployee && (
                        <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20 border-2 border-primary">
                            <AvatarImage src={selectedEmployee.avatar} alt={selectedEmployee.name} />
                            <AvatarFallback>{selectedEmployee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-right">{selectedEmployee.name}</DialogTitle>
                            <DialogDescription className="text-right text-base text-primary font-semibold">
                            {selectedEmployee.role === 'delegate' ? 'مندوب توصيل' : 'موظف دعم فني'}
                            </DialogDescription>
                        </div>
                        </div>
                    )}
                    </DialogHeader>

                    {selectedEmployee && (
                    <div className="flex-1 overflow-y-auto p-1 pr-2 space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User /> المعلومات الأساسية</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><strong>الهاتف:</strong><span>{selectedEmployee.phone}</span></div>
                                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/><strong>البريد:</strong><span>{selectedEmployee.email}</span></div>
                                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/><strong>العنوان:</strong><span>{selectedEmployee.address}</span></div>
                                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground"/><strong>المحافظة:</strong><span>{selectedEmployee.governorate}</span></div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp /> مؤشرات الأداء</CardTitle></CardHeader>
                            <CardContent>
                                {selectedEmployee.role === 'delegate' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">طلبات موصلة</p><p className="text-xl font-bold">{selectedEmployee.deliveries}</p></div>
                                    <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">متوسط الوقت</p><p className="text-xl font-bold">{selectedEmployee.avgTime} <span className="text-sm">د</span></p></div>
                                    <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">التقييم</p><p className="text-xl font-bold">{selectedEmployee.rating}</p></div>
                                    <div className="p-3 bg-muted rounded-lg md:col-span-2"><p className="text-xs text-muted-foreground">المبالغ المحصلة</p><p className="text-xl font-bold">{selectedEmployee.cashCollected.toLocaleString()} <span className="text-sm">ر.ي</span></p></div>
                                    <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">العجز</p><p className="text-xl font-bold text-destructive">{selectedEmployee.deficit.toLocaleString()} <span className="text-sm">ر.ي</span></p></div>
                                </div>
                                )}
                                {selectedEmployee.role === 'support' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">تذاكر معالجة</p><p className="text-xl font-bold">{selectedEmployee.ticketsResolved}</p></div>
                                    <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">متوسط الرد</p><p className="text-xl font-bold">{selectedEmployee.avgResponseTime} <span className="text-sm">د</span></p></div>
                                    <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">الحضور</p><p className="text-xl font-bold">{selectedEmployee.attendance}</p></div>
                                </div>
                                )}
                            </CardContent>
                        </Card>

                        {'idType' in selectedEmployee && selectedEmployee.idType && (
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileDigit /> الوثائق</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1"><h4 className="font-semibold text-sm">الصورة الشخصية</h4><Image src={selectedEmployee.personalPhotoUrl} alt="Personal" width={150} height={150} className="rounded-lg border object-cover"/></div>
                                <div className="space-y-1"><h4 className="font-semibold text-sm">{selectedEmployee.idType === 'card' ? 'الهوية (الأمام)' : 'الجواز'}</h4><Image src={selectedEmployee.idFrontPhotoUrl} alt="ID Front" width={200} height={120} className="rounded-lg border object-cover"/></div>
                                {selectedEmployee.idType === 'card' && selectedEmployee.idBackPhotoUrl && (<div className="space-y-1"><h4 className="font-semibold text-sm">الهوية (الخلف)</h4><Image src={selectedEmployee.idBackPhotoUrl} alt="ID Back" width={200} height={120} className="rounded-lg border object-cover"/></div>)}
                            </CardContent>
                        </Card>
                        )}
                        
                        {selectedEmployee.role === 'delegate' && selectedEmployee.latitude && (
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin /> موقع المندوب</CardTitle></CardHeader>
                                <CardContent>
                                    <LocationMapViewer mainPosition={{ lat: selectedEmployee.latitude, lng: selectedEmployee.longitude }} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">إغلاق</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
