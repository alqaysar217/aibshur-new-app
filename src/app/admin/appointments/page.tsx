'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, Timestamp, doc, serverTimestamp } from 'firebase/firestore';
import { format, formatDistanceToNow, isToday, isFuture } from 'date-fns';
import { ar } from 'date-fns/locale';
import dynamic from 'next/dynamic';

import AppointmentsLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { Separator } from '@/components/ui/separator';

import { 
    CalendarCheck, Clock, CheckCircle, XCircle, Search, Calendar as CalendarIcon, FileText, Check, X,
    User, Phone, MapPin, Store as StoreIcon, ShoppingBasket, BadgeDollarSign, Contact, FileDown
} from 'lucide-react';
import type { Order as OrderType } from '../orders/page';
import type { Store as StoreType } from '../stores/page';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


const LocationMapViewer = dynamic(() => import('@/components/location-map-viewer').then(mod => mod.LocationMapViewer), { ssr: false, loading: () => <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });

// We will consider orders with a 'scheduledDeliveryTime' in the future as appointments.
type Appointment = OrderType & {
    timestamps: {
        createdAt: Date;
        scheduledDeliveryTime: Date;
        confirmedAt?: Date;
        dispatchedAt?: Date;
        deliveredAt?: Date;
        cancelledAt?: Date;
    };
};

// MOCK DATA for demonstration when Firestore is empty
const mockAppointments: OrderType[] = [
    {
        id: 'APP001',
        clientName: 'علي محمد',
        clientPhone: '771234567',
        storeName: 'مطعم البيت الصنعاني',
        status: 'incoming',
        financials: { subtotal: 10000, deliveryFee: 500, discount: 0, tip: 0, total: 10500 },
        items: [{ productId: 'p1', productName: 'مندي دجاج', quantity: 5, price: 2000 }],
        timestamps: {
            createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
            scheduledDeliveryTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // In 2 days
        },
        address: { description: 'شارع حدة، أمام متجر الزهور', latitude: 15.34, longitude: 44.20 },
        payment: { method: 'cash', status: 'pending' },
        clientId: 'c1',
        storeId: 's1',
    },
    {
        id: 'APP002',
        clientName: 'فاطمة عبدالله',
        clientPhone: '731234567',
        storeName: 'حلويات النجمة',
        status: 'delivered',
        financials: { subtotal: 25000, deliveryFee: 1000, discount: 2000, tip: 0, total: 24000 },
        items: [{ productId: 'p2', productName: 'كيكة عيد ميلاد', quantity: 1, price: 25000 }],
        timestamps: {
            createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
            scheduledDeliveryTime: new Date(new Date().setDate(new Date().getDate() - 2)),
            deliveredAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        },
        address: { description: 'حي الجامعة الجديد', latitude: 15.35, longitude: 44.21 },
        payment: { method: 'wallet', status: 'paid' },
        clientId: 'c2',
        storeId: 's2',
    },
    {
        id: 'APP003',
        clientName: 'سالم أحمد',
        clientPhone: '711234567',
        storeName: 'كافيتيريا مزاج',
        status: 'cancelled',
        financials: { subtotal: 5000, deliveryFee: 300, discount: 0, tip: 0, total: 5300 },
        items: [{ productId: 'p3', productName: 'قهوة وحلويات متنوعة', quantity: 10, price: 500 }],
        timestamps: {
            createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
            scheduledDeliveryTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
            cancelledAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        },
        address: { description: 'الدائري، جوار مول العاصمة', latitude: 15.36, longitude: 44.19, addressType: 'other', receiverName: 'أحمد سالم', receiverPhone: '777111222' },
        payment: { method: 'cash', status: 'pending' },
        cancellationReason: 'العميل ألغى الطلب',
        clientId: 'c3',
        storeId: 's3',
    }
];


export default function AppointmentsPage() {
    const [filters, setFilters] = useState({ searchTerm: '', storeId: 'all', date: undefined as DateRange | undefined });
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const appointmentsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders'), where('timestamps.scheduledDeliveryTime', '!=', null)) : null, [firestore]);
    const { data: rawAppointments, isLoading: isLoadingAppointments } = useCollection<OrderType>(appointmentsQuery);
    const { data: stores, isLoading: isLoadingStores } = useCollection<StoreType>(useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]));
    
    const isLoading = isLoadingAppointments || isLoadingStores;

    const appointments: Appointment[] = useMemo(() => {
        // Use mock data if firestore returns nothing, to make the page look populated
        const dataToProcess = (!rawAppointments || rawAppointments.length === 0) ? mockAppointments : rawAppointments;
        if (!dataToProcess) return [];

        return dataToProcess
            .filter(o => o.timestamps.scheduledDeliveryTime)
            .map(o => {
                const newTimestamps: Appointment['timestamps'] = {
                    createdAt: o.timestamps.createdAt instanceof Timestamp ? o.timestamps.createdAt.toDate() : o.timestamps.createdAt,
                    scheduledDeliveryTime: o.timestamps.scheduledDeliveryTime instanceof Timestamp ? o.timestamps.scheduledDeliveryTime.toDate() : o.timestamps.scheduledDeliveryTime!,
                };
                if(o.timestamps.confirmedAt) newTimestamps.confirmedAt = o.timestamps.confirmedAt instanceof Timestamp ? o.timestamps.confirmedAt.toDate() : o.timestamps.confirmedAt;
                if(o.timestamps.dispatchedAt) newTimestamps.dispatchedAt = o.timestamps.dispatchedAt instanceof Timestamp ? o.timestamps.dispatchedAt.toDate() : o.timestamps.dispatchedAt;
                if(o.timestamps.deliveredAt) newTimestamps.deliveredAt = o.timestamps.deliveredAt instanceof Timestamp ? o.timestamps.deliveredAt.toDate() : o.timestamps.deliveredAt;
                if(o.timestamps.cancelledAt) newTimestamps.cancelledAt = o.timestamps.cancelledAt instanceof Timestamp ? o.timestamps.cancelledAt.toDate() : o.timestamps.cancelledAt;

                return {
                    ...o,
                    timestamps: newTimestamps
                } as Appointment;
            });
    }, [rawAppointments]);

    const uniqueStores = useMemo(() => {
        if (!appointments) return [];
        const storeMap = new Map<string, string>();
        appointments.forEach(order => {
            if (!storeMap.has(order.storeId)) {
                storeMap.set(order.storeId, order.storeName);
            }
        });
        return Array.from(storeMap.entries());
    }, [appointments]);


    const { upcoming, completed, cancelled } = useMemo(() => {
        const upcoming: Appointment[] = [];
        const completed: Appointment[] = [];
        const cancelled: Appointment[] = [];
        
        (appointments || []).forEach(app => {
            if (app.status === 'cancelled') {
                cancelled.push(app);
            } else if (app.status === 'delivered') {
                completed.push(app);
            } else {
                upcoming.push(app);
            }
        });
        
        upcoming.sort((a, b) => a.timestamps.scheduledDeliveryTime.getTime() - b.timestamps.scheduledDeliveryTime.getTime());
        completed.sort((a, b) => (b.timestamps.deliveredAt?.getTime() || 0) - (a.timestamps.deliveredAt?.getTime() || 0));
        cancelled.sort((a, b) => (b.timestamps.cancelledAt?.getTime() || 0) - (a.timestamps.cancelledAt?.getTime() || 0));

        return { upcoming, completed, cancelled };
    }, [appointments]);

    const filteredData = useMemo(() => {
        const dataMap = { upcoming, completed, cancelled };
        const currentData = dataMap[activeTab];
        
        return currentData.filter(app => {
            const matchesSearch = !filters.searchTerm || 
                app.clientName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                app.storeName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                app.id.toLowerCase().includes(filters.searchTerm.toLowerCase());

            const matchesStore = filters.storeId === 'all' || app.storeId === filters.storeId;
            
            const scheduledDate = app.timestamps.scheduledDeliveryTime;
            const matchesDate = !filters.date || !filters.date.from || (
                scheduledDate >= filters.date.from && 
                (!filters.date.to || scheduledDate <= new Date(new Date(filters.date.to).setHours(23, 59, 59, 999)))
            );

            return matchesSearch && matchesStore && matchesDate;
        });
    }, [activeTab, filters, upcoming, completed, cancelled]);

    const handleViewDetails = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsDetailsOpen(true);
    };

    const handleConfirm = (appointment: Appointment) => {
        if (!firestore || (!rawAppointments || rawAppointments.length === 0)) { // Don't run on mock data
            toast({ title: 'لا يمكن تأكيد موعد وهمي', description: 'هذا الإجراء متاح للبيانات الحقيقية فقط.' });
            return;
        }
        updateDocumentNonBlocking(doc(firestore, 'orders', appointment.id), {
            status: 'confirmed',
            'timestamps.confirmedAt': serverTimestamp()
        });
        toast({ title: "تم تأكيد الموعد", description: `تم تحويل الموعد #${appointment.id.substring(0, 6)} إلى طلب نشط.` });
    };

    const handleCancel = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsCancelOpen(true);
    };

    const confirmCancel = () => {
        if (!selectedAppointment) return;
        if (!firestore || (!rawAppointments || rawAppointments.length === 0)) { // Don't run on mock data
            toast({ variant: 'destructive', title: 'لا يمكن إلغاء موعد وهمي', description: 'هذا الإجراء متاح للبيانات الحقيقية فقط.' });
            setIsCancelOpen(false);
            return;
        }
        updateDocumentNonBlocking(doc(firestore, 'orders', selectedAppointment.id), {
            status: 'cancelled',
            'timestamps.cancelledAt': serverTimestamp(),
            cancellationReason: 'تم الإلغاء من لوحة تحكم المواعيد'
        });
        toast({ variant: 'destructive', title: "تم إلغاء الموعد" });
        setIsCancelOpen(false);
    };
    
    const handleExport = () => {
        if (!filteredData.length) {
            toast({ title: "لا توجد بيانات للتصدير", description: "البيانات الحالية لا تحتوي على مواعيد." });
            return;
        }

        const headers = ["ID", "Client Name", "Store Name", "Scheduled Time", "Total", "Status"];
        const csvRows = [headers.join(",")];

        for (const app of filteredData) {
            const row = [
                app.id,
                `"${app.clientName}"`,
                `"${app.storeName}"`,
                app.timestamps.scheduledDeliveryTime.toISOString(),
                app.financials.total,
                app.status
            ];
            csvRows.push(row.join(","));
        }

        const csvString = csvRows.join("\n");
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `appointments_export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "تم بدء التصدير", description: `يتم تنزيل ${filteredData.length} موعد.` });
    };

    const formatScheduledTime = (date: Date) => {
        const day = isToday(date) ? 'اليوم' : format(date, 'd MMMM', { locale: ar });
        const time = format(date, 'h:mm a', { locale: ar });
        return `${day}, ${time}`;
    };

    if (isLoading && !mockAppointments.length) {
        return <AppointmentsLoading />;
    }
    
    const renderTable = (data: Appointment[]) => (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">وقت التسليم المجدول</TableHead>
                        <TableHead className="text-center">العميل</TableHead>
                        <TableHead className="text-center">المتجر</TableHead>
                        <TableHead className="text-center">الإجمالي</TableHead>
                        <TableHead className="text-center">حالة الطلب</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? data.map(app => (
                        <TableRow key={app.id}>
                            <TableCell className="text-center font-medium">
                                <div className="flex flex-col items-center">
                                    <span>{formatScheduledTime(app.timestamps.scheduledDeliveryTime)}</span>
                                    <span className="text-xs text-muted-foreground">({formatDistanceToNow(app.timestamps.scheduledDeliveryTime, { locale: ar, addSuffix: true })})</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">{app.clientName}</TableCell>
                            <TableCell className="text-center">{app.storeName}</TableCell>
                            <TableCell className="text-center font-semibold" dir="ltr">{app.financials.total.toLocaleString('en-US')}&nbsp;ر.ي</TableCell>
                            <TableCell className="text-center"><OrderStatusBadge status={app.status}/></TableCell>
                            <TableCell className="text-center">
                                {activeTab === 'upcoming' ? (
                                    <div className="flex justify-center gap-2">
                                        <Button variant="default" size="sm" onClick={() => handleConfirm(app)}><Check/> تأكيد</Button>
                                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(app)}><FileText/> تفاصيل</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleCancel(app)}><X/> إلغاء</Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(app)}><FileText/> تفاصيل</Button>
                                )}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">لا توجد مواعيد في هذه الفئة.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
    
    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground">إدارة المواعيد</h1>
                        <p className="text-muted-foreground mt-1">متابعة وتأكيد الطلبات المجدولة مسبقًا.</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} dir="rtl">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="upcoming" className="gap-2"><Clock/>المواعيد القادمة</TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2"><CheckCircle/>المواعيد المكتملة</TabsTrigger>
                        <TabsTrigger value="cancelled" className="gap-2"><XCircle/>المواعيد الملغية</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-4">
                        <Card>
                             <CardHeader>
                                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                    <div className="relative flex-grow">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="ابحث بالاسم أو رقم الطلب..." 
                                            value={filters.searchTerm} 
                                            onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))} 
                                            className="w-full pr-10" 
                                        />
                                    </div>
                                    <Select value={filters.storeId} onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}>
                                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">كل المتاجر</SelectItem>
                                            {uniqueStores.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                            "w-full sm:w-64 justify-start text-left font-normal",
                                            !filters.date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                            {filters.date?.from ? (
                                            filters.date.to ? (
                                                <>
                                                {format(filters.date.from, "LLL dd, y")} -{" "}
                                                {format(filters.date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(filters.date.from, "LLL dd, y")
                                            )
                                            ) : (
                                            <span>اختر تاريخ</span>
                                            )}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={filters.date?.from}
                                            selected={filters.date}
                                            onSelect={(date) => setFilters(f => ({...f, date}))}
                                            numberOfMonths={2}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <Button onClick={handleExport} variant="outline"><FileDown/> تصدير</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {renderTable(filteredData)}
                            </CardContent>
                        </Card>
                    </div>
                </Tabs>
            </div>
            
             <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-2xl font-bold text-right">تفاصيل الموعد: #{selectedAppointment?.id.substring(0, 8)}</DialogTitle>
                         <div className="flex justify-start items-center gap-4 text-sm pt-1">
                            {selectedAppointment && <OrderStatusBadge status={selectedAppointment.status} />}
                            {selectedAppointment && <span className="flex items-center gap-1.5 text-muted-foreground"><CalendarIcon className="h-4 w-4"/>{format(selectedAppointment.timestamps.scheduledDeliveryTime, 'd MMMM yyyy, h:mm a', { locale: ar })}</span>}
                        </div>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4 flex-1 overflow-y-auto p-1 pr-4">
                             <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5 text-primary"/>بيانات العميل</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground"/>
                                        <span><strong>الاسم:</strong> {selectedAppointment.clientName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground"/>
                                        <span><strong>الهاتف:</strong></span>
                                        <span dir="ltr">{selectedAppointment.clientPhone}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                        <span><strong>العنوان:</strong> {selectedAppointment.address.description}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {selectedAppointment.address.addressType === 'other' && selectedAppointment.address.receiverName && (
                               <Card>
                                   <CardHeader><CardTitle className="text-base flex items-center gap-2"><Contact className="h-5 w-5 text-primary"/>بيانات المستلم</CardTitle></CardHeader>
                                   <CardContent className="text-sm space-y-3">
                                       <div className="flex items-center gap-2">
                                           <User className="h-4 w-4 text-muted-foreground"/>
                                           <span><strong>الاسم:</strong> {selectedAppointment.address.receiverName}</span>
                                       </div>
                                       {selectedAppointment.address.receiverPhone && 
                                       <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground"/>
                                            <span><strong>الهاتف:</strong></span>
                                           <span dir="ltr">{selectedAppointment.address.receiverPhone}</span>
                                        </div>}
                                   </CardContent>
                               </Card>
                            )}
                            
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/>موقع التوصيل</CardTitle></CardHeader>
                                <CardContent>
                                    <LocationMapViewer mainPosition={{ lat: selectedAppointment.address.latitude, lng: selectedAppointment.address.longitude }} />
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><StoreIcon className="h-5 w-5 text-primary"/>تفاصيل الطلب</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="mb-2"><strong>المتجر:</strong> {selectedAppointment.storeName}</p>
                                    <Table>
                                        <TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="w-[80px] text-center">الكمية</TableHead></TableRow></TableHeader>
                                        <TableBody>{selectedAppointment.items.map(item => (
                                            <TableRow key={item.productId}><TableCell className="font-medium">{item.productName}</TableCell><TableCell className="text-center">{item.quantity.toLocaleString('en-US')}</TableCell></TableRow>
                                        ))}</TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BadgeDollarSign className="h-5 w-5 text-primary"/>الملخص المالي</CardTitle></CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>إجمالي المنتجات</span><span dir="ltr">{selectedAppointment.financials.subtotal.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                                    <div className="flex justify-between"><span>رسوم التوصيل</span><span dir="ltr">{selectedAppointment.financials.deliveryFee.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                                    {selectedAppointment.financials.discount > 0 && <div className="flex justify-between text-destructive"><span>خصم</span><span dir="ltr">-{selectedAppointment.financials.discount.toLocaleString('en-US')}&nbsp;ر.ي</span></div>}
                                    <Separator/>
                                    <div className="flex justify-between font-bold text-base"><span>الإجمالي النهائي</span><span dir="ltr">{selectedAppointment.financials.total.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-base">بيانات الموعد</CardTitle></CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                     <div><strong>وقت الإنشاء:</strong> {format(selectedAppointment.timestamps.createdAt, 'd MMMM yyyy, h:mm a', { locale: ar })}</div>
                                     <div><strong>وقت التسليم المجدول:</strong> {format(selectedAppointment.timestamps.scheduledDeliveryTime, 'd MMMM yyyy, h:mm a', { locale: ar })}</div>
                                </CardContent>
                             </Card>
                        </div>
                    )}
                     <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">إغلاق</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الإلغاء</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من إلغاء هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                    </AlertDialogHeader>
                     <AlertDialogFooter className="flex-row-reverse sm:justify-start">
                        <AlertDialogAction onClick={confirmCancel}>نعم، قم بالإلغاء</AlertDialogAction>
                        <AlertDialogCancel>تراجع</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

