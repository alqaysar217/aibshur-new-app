'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import DelegatesLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Check, X, MessageSquare, CreditCard, BookUser, Mail, MapPin, Calendar, User, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type Driver = {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    idType: 'passport' | 'card';
    personalPhotoUrl: string;
    idFrontPhotoUrl: string;
    idBackPhotoUrl?: string;
    is_active: boolean;
    status?: 'pending' | 'active' | 'rejected';
    createdAt?: Timestamp;
};

type Attachment = {
    label: string;
    url: string;
};

export default function DelegateRequestsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected'>('pending');
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    const [isRejectAlertOpen, setIsRejectAlertOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const { toast } = useToast();
    const firestore = useFirestore();

    const driversQuery = useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]);
    const { data: drivers, isLoading } = useCollection<Driver>(driversQuery);

    const { pendingApplications, activeDrivers, rejectedDrivers } = useMemo(() => {
        const pending: Driver[] = [];
        const active: Driver[] = [];
        const rejected: Driver[] = [];
        (drivers || []).forEach(d => {
            if (d.status === 'active') active.push(d);
            else if (d.status === 'rejected') rejected.push(d);
            else pending.push(d); // Default to pending
        });
        pending.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
        active.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
        rejected.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
        return { pendingApplications: pending, activeDrivers: active, rejectedDrivers: rejected };
    }, [drivers]);

    const filteredData = useMemo(() => {
        const dataMap = {
            pending: pendingApplications,
            active: activeDrivers,
            rejected: rejectedDrivers,
        };
        const currentData = dataMap[activeTab];
        if (!searchTerm) return currentData;
        return currentData.filter(app =>
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.phone.includes(searchTerm)
        );
    }, [activeTab, searchTerm, pendingApplications, activeDrivers, rejectedDrivers]);


    const handleViewAttachments = (driver: Driver) => {
        setSelectedDriver(driver);
        setIsAttachmentModalOpen(true);
    };
    
    const handleAccept = (driver: Driver) => {
        if (!firestore) return;
        const driverRef = doc(firestore, 'drivers', driver.id);
        updateDocumentNonBlocking(driverRef, { status: 'active', is_active: true });
        
        const message = encodeURIComponent(`مرحباً ${driver.name}، يسعدنا إخبارك بقبول طلب انضمامك لفريق مناديب أبشر! يمكنك الآن تسجيل الدخول إلى تطبيق المناديب والبدء في استقبال الطلبات. بالتوفيق!`);
        window.open(`https://wa.me/${driver.phone}?text=${message}`, '_blank');
        
        toast({ title: "تم القبول", description: `تم قبول المندوب ${driver.name} وإرسال رسالة ترحيب.` });
    };

    const handleReject = (driver: Driver) => {
        setSelectedDriver(driver);
        setIsRejectAlertOpen(true);
    };

    const confirmReject = () => {
        if (!selectedDriver || !firestore) return;
        const driverRef = doc(firestore, 'drivers', selectedDriver.id);
        updateDocumentNonBlocking(driverRef, { status: 'rejected', is_active: false });

        const message = encodeURIComponent(`مرحباً ${selectedDriver.name}، نشكرك على اهتمامك بالانضمام لفريق أبشر. نعتذر لإبلاغك بعدم قبول طلبك في الوقت الحالي. نتمنى لك كل التوفيق.`);
        window.open(`https://wa.me/${selectedDriver.phone}?text=${message}`, '_blank');
        
        toast({
            variant: "destructive",
            title: "تم الرفض",
            description: `تم رفض طلب المندوب ${selectedDriver.name} وإرسال رسالة اعتذار.`,
        });
        setIsRejectAlertOpen(false);
        setSelectedDriver(null);
    };
    
    const openWhatsApp = (driver: Driver) => {
        const message = encodeURIComponent(`مرحباً بك يا ${driver.name}، قمنا باستقبال طلبك للانضمام كمندوب، ونحن الآن نجري مراجعته. شكراً لصبرك`);
        window.open(`https://wa.me/${driver.phone}?text=${message}`, '_blank');
    };
    
    const attachments: Attachment[] = useMemo(() => {
        if (!selectedDriver) return [];
        const driver = selectedDriver;
        const list: Attachment[] = [
            { label: 'الصورة الشخصية', url: driver.personalPhotoUrl }
        ];

        if (driver.idType === 'passport') {
            list.push({ label: 'صورة الجواز', url: driver.idFrontPhotoUrl });
        } else {
            list.push({ label: 'صورة الهوية (الأمام)', url: driver.idFrontPhotoUrl });
            if (driver.idBackPhotoUrl) {
                list.push({ label: 'صورة الهوية (الخلف)', url: driver.idBackPhotoUrl });
            }
        }
        return list;
    }, [selectedDriver]);

    if (isLoading && (!drivers || drivers.length === 0)) {
        return <DelegatesLoading />;
    }

    const renderTable = (data: Driver[], type: 'pending' | 'active' | 'rejected') => (
         <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">تاريخ الطلب</TableHead>
                        <TableHead className="text-center">اسم المندوب</TableHead>
                        <TableHead className="text-center">رقم الهاتف</TableHead>
                        {type !== 'pending' && <TableHead className="text-center">البريد الإلكتروني</TableHead>}
                        {type !== 'pending' && <TableHead className="text-center">الحالة</TableHead>}
                        {type === 'pending' && <TableHead className="text-center">الإجراءات</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell className="text-center">
                                    {app.createdAt ? format(app.createdAt.toDate(), 'd MMMM yyyy', { locale: ar }) : 'غير محدد'}
                                </TableCell>
                                <TableCell className="font-medium text-center">{app.name}</TableCell>
                                <TableCell className="text-center" dir="ltr">{app.phone}</TableCell>
                                {type !== 'pending' && <TableCell className="text-center">{app.email}</TableCell>}
                                {type !== 'pending' && <TableCell className="text-center"><Badge variant={type === 'active' ? 'default' : 'destructive'}>{type === 'active' ? 'مقبول' : 'مرفوض'}</Badge></TableCell>}
                                {type === 'pending' && (
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <TooltipProvider>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => handleViewAttachments(app)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>عرض المرفقات</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => openWhatsApp(app)} className="text-green-600 border-green-600/20 hover:bg-green-50 hover:text-green-700"><MessageSquare className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>تواصل مبدئي عبر واتساب</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => handleAccept(app)} className="text-primary border-primary/20 hover:bg-primary/10 hover:text-primary"><Check className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>قبول وإرسال رسالة</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => handleReject(app)} className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>رفض وإرسال رسالة</p></TooltipContent></Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={type === 'pending' ? 4 : 5} className="h-32 text-center text-muted-foreground">
                                لا توجد طلبات في هذه الفئة.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );


    return (
        <>
            <Tabs defaultValue="pending" dir="rtl" onValueChange={(value) => setActiveTab(value as any)}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground">مراجعة طلبات المناديب</h1>
                        <p className="text-muted-foreground mt-1">مراجعة وقبول أو رفض طلبات انضمام المناديب الجدد.</p>
                    </div>
                     <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="pending" className="flex-1 sm:flex-initial gap-2">الطلبات الجديدة</TabsTrigger>
                        <TabsTrigger value="active" className="flex-1 sm:flex-initial gap-2">المقبولة</TabsTrigger>
                        <TabsTrigger value="rejected" className="flex-1 sm:flex-initial gap-2">المرفوضة</TabsTrigger>
                    </TabsList>
                </div>
                
                 <div className="relative w-full sm:w-auto sm:max-w-xs mb-4">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        className="pr-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <TabsContent value="pending">
                    <Card><CardContent className="p-4">{renderTable(filteredData, 'pending')}</CardContent></Card>
                </TabsContent>
                 <TabsContent value="active">
                    <Card><CardContent className="p-4">{renderTable(filteredData, 'active')}</CardContent></Card>
                </TabsContent>
                 <TabsContent value="rejected">
                    <Card><CardContent className="p-4">{renderTable(filteredData, 'rejected')}</CardContent></Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isAttachmentModalOpen} onOpenChange={setIsAttachmentModalOpen}>
                <DialogContent className="max-w-3xl [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">مرفقات المندوب: {selectedDriver?.name}</DialogTitle>
                        <DialogDescription className="text-right">مراجعة الوثائق المقدمة من المندوب.</DialogDescription>
                    </DialogHeader>
                    
                    {selectedDriver && (
                        <Card className="my-4">
                            <CardHeader><CardTitle className="text-base">بيانات الطلب</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/><strong>الاسم:</strong><span>{selectedDriver.name}</span></div>
                                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><strong>الهاتف:</strong><span>{selectedDriver.phone}</span></div>
                                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/><strong>البريد:</strong><span>{selectedDriver.email}</span></div>
                                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/><strong>العنوان:</strong><span>{selectedDriver.address}</span></div>
                                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground"/><strong>الوثيقة:</strong><span>{selectedDriver.idType === 'card' ? 'بطاقة شخصية' : 'جواز سفر'}</span></div>
                                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/><strong>تاريخ الطلب:</strong><span>{selectedDriver.createdAt ? format(selectedDriver.createdAt.toDate(), 'd MMMM yyyy', { locale: ar }) : 'غير محدد'}</span></div>
                            </CardContent>
                        </Card>
                    )}
                    
                    <ScrollArea className="max-h-[50vh] p-1">
                        <div className="grid grid-cols-2 gap-4 py-4 pr-2">
                            {attachments.map((att, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold mb-2 text-sm">{att.label}</h3>
                                    <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden border">
                                        <Image src={att.url} alt={att.label} fill className="object-contain" unoptimized/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={isRejectAlertOpen} onOpenChange={setIsRejectAlertOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right">
                        <AlertDialogTitle className="text-right">تأكيد الرفض</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            هل أنت متأكد من رفض طلب المندوب "{selectedDriver?.name}"؟ سيتم تغيير حالته إلى "مرفوض" وإرسال رسالة اعتذار.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                        <AlertDialogAction onClick={confirmReject}>نعم، قم بالرفض</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
