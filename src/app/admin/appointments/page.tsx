'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, Timestamp, doc, serverTimestamp } from 'firebase/firestore';
import { format, formatDistanceToNow, isToday, isFuture } from 'date-fns';
import { ar } from 'date-fns/locale';

import AppointmentsLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CalendarCheck, Clock, CheckCircle, XCircle, Search, Calendar, FileText, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrderStatusBadge } from '@/components/order-status-badge';
import type { Order as OrderType } from '../orders/page'; // Re-using the processed type from orders page

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

export default function AppointmentsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const appointmentsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders'), where('timestamps.scheduledDeliveryTime', '!=', null)) : null, [firestore]);
    const { data: rawAppointments, isLoading } = useCollection<OrderType>(appointmentsQuery);

    const appointments: Appointment[] = useMemo(() => {
        if (!rawAppointments) return [];
        return rawAppointments
            .filter(o => o.timestamps.scheduledDeliveryTime) // Ensure the scheduled time exists
            .map(o => ({
                ...o,
                timestamps: {
                    ...o.timestamps,
                    createdAt: (o.timestamps.createdAt as unknown as Timestamp).toDate(),
                    scheduledDeliveryTime: (o.timestamps.scheduledDeliveryTime as unknown as Timestamp).toDate(),
                }
            })) as Appointment[];
    }, [rawAppointments]);

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
        completed.sort((a, b) => b.timestamps.scheduledDeliveryTime.getTime() - a.timestamps.scheduledDeliveryTime.getTime());
        cancelled.sort((a, b) => b.timestamps.scheduledDeliveryTime.getTime() - a.timestamps.scheduledDeliveryTime.getTime());
        
        return { upcoming, completed, cancelled };
    }, [appointments]);

    const filteredData = useMemo(() => {
        const dataMap = { upcoming, completed, cancelled };
        const currentData = dataMap[activeTab];
        if (!searchTerm) return currentData;
        return currentData.filter(app =>
            app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [activeTab, searchTerm, upcoming, completed, cancelled]);

    const handleViewDetails = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsDetailsOpen(true);
    };

    const handleConfirm = (appointment: Appointment) => {
        if (!firestore) return;
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
        if (!selectedAppointment || !firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'orders', selectedAppointment.id), {
            status: 'cancelled',
            'timestamps.cancelledAt': serverTimestamp(),
            cancellationReason: 'تم الإلغاء من لوحة تحكم المواعيد'
        });
        toast({ variant: 'destructive', title: "تم إلغاء الموعد" });
        setIsCancelOpen(false);
    };
    
    const formatScheduledTime = (date: Date) => {
        const day = isToday(date) ? 'اليوم' : format(date, 'd MMMM', { locale: ar });
        const time = format(date, 'h:mm a', { locale: ar });
        return `${day}, ${time}`;
    };

    if (isLoading) {
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
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="ابحث بالاسم أو رقم الطلب..." className="pr-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {renderTable(filteredData)}
                            </CardContent>
                        </Card>
                    </div>
                </Tabs>
            </div>
            
            {/* Re-use order details dialog, maybe make a component later */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-lg [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>تفاصيل الموعد</DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                             <p><strong>العميل:</strong> {selectedAppointment.clientName}</p>
                             <p><strong>المتجر:</strong> {selectedAppointment.storeName}</p>
                             <p><strong>الإجمالي:</strong> {selectedAppointment.financials.total.toLocaleString('en-US')} ر.ي</p>
                             <p><strong>وقت الطلب:</strong> {format(selectedAppointment.timestamps.createdAt, 'd MMMM yyyy, h:mm a', { locale: ar })}</p>
                             <p><strong>وقت التسليم المجدول:</strong> {format(selectedAppointment.timestamps.scheduledDeliveryTime, 'd MMMM yyyy, h:mm a', { locale: ar })}</p>
                             <p><strong>الحالة:</strong> <OrderStatusBadge status={selectedAppointment.status}/></p>
                             <h4 className="font-bold pt-2 border-t">المنتجات</h4>
                             <ul>
                                {selectedAppointment.items.map(item => <li key={item.productId}>{item.productName} (x{item.quantity})</li>)}
                             </ul>
                        </div>
                    )}
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
