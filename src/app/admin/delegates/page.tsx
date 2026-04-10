'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { doc, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import DelegatesLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Check, X, MessageSquare, CreditCard, BookUser } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Modified Driver type to include status and createdAt
type Driver = {
    id: string;
    name: string;
    phone: string;
    email: string;
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
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    const [isRejectAlertOpen, setIsRejectAlertOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const { toast } = useToast();
    const firestore = useFirestore();

    const driversQuery = useMemoFirebase(() => firestore ? doc(firestore, 'drivers') : null, [firestore]);
    const { data: drivers, isLoading } = useCollection<Driver>(collection(firestore, 'drivers'));

    const pendingApplications = useMemo(() => {
        if (!drivers) return [];
        return drivers
            .filter(d => d.status === 'pending')
            .sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
    }, [drivers]);

    const filteredApplications = useMemo(() => {
        return pendingApplications.filter(app =>
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.phone.includes(searchTerm)
        );
    }, [pendingApplications, searchTerm]);

    const handleViewAttachments = (driver: Driver) => {
        setSelectedDriver(driver);
        setIsAttachmentModalOpen(true);
    };
    
    const handleAccept = (driver: Driver) => {
        if (!firestore) return;
        const driverRef = doc(firestore, 'drivers', driver.id);
        updateDocumentNonBlocking(driverRef, { status: 'active', is_active: true });
        toast({ title: "تم القبول", description: `تم قبول المندوب ${driver.name} وتفعيل حسابه.` });
    };

    const handleReject = (driver: Driver) => {
        setSelectedDriver(driver);
        setIsRejectAlertOpen(true);
    };

    const confirmReject = () => {
        if (!selectedDriver || !firestore) return;
        const driverRef = doc(firestore, 'drivers', selectedDriver.id);
        updateDocumentNonBlocking(driverRef, { status: 'rejected', is_active: false });
        toast({
            variant: "destructive",
            title: "تم الرفض",
            description: `تم رفض طلب المندوب ${selectedDriver.name}.`,
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

    if (isLoading) {
        return <DelegatesLoading />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>مراجعة طلبات المناديب</CardTitle>
                            <CardDescription>مراجعة وقبول أو رفض طلبات انضمام المناديب الجدد.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-auto sm:min-w-64">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ابحث بالاسم أو رقم الهاتف..."
                                className="pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">تاريخ الطلب</TableHead>
                                    <TableHead className="text-center">اسم المندوب</TableHead>
                                    <TableHead className="text-center">رقم الهاتف</TableHead>
                                    <TableHead className="text-center">البريد الإلكتروني</TableHead>
                                    <TableHead className="text-center">نوع الوثيقة</TableHead>
                                    <TableHead className="text-center">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredApplications.length > 0 ? (
                                    filteredApplications.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell className="text-center">
                                                {app.createdAt ? format(app.createdAt.toDate(), 'd MMMM yyyy', { locale: ar }) : 'غير محدد'}
                                            </TableCell>
                                            <TableCell className="font-medium text-center">{app.name}</TableCell>
                                            <TableCell className="text-center" dir="ltr">{app.phone}</TableCell>
                                            <TableCell className="text-center">{app.email}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="gap-1.5">
                                                    {app.idType === 'card' ? <CreditCard/> : <BookUser/>}
                                                    {app.idType === 'card' ? 'بطاقة شخصية' : 'جواز سفر'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewAttachments(app)}><Eye/> عرض المرفقات</Button>
                                                    <Button variant="outline" size="sm" onClick={() => openWhatsApp(app)} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"><MessageSquare/> واتساب</Button>
                                                    <Button variant="default" size="sm" onClick={() => handleAccept(app)}><Check/> قبول</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleReject(app)}><X/> رفض</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            لا توجد طلبات جديدة للمراجعة.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Attachments Modal */}
            <Dialog open={isAttachmentModalOpen} onOpenChange={setIsAttachmentModalOpen}>
                <DialogContent className="max-w-3xl [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>مرفقات المندوب: {selectedDriver?.name}</DialogTitle>
                        <DialogDescription>مراجعة الوثائق المقدمة من المندوب.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] p-1">
                        <div className="space-y-6 py-4 pr-2">
                            {attachments.map((att, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold mb-2">{att.label}</h3>
                                    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
                                        <Image src={att.url} alt={att.label} fill className="object-contain" unoptimized/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
            
            {/* Reject Confirmation Alert */}
            <AlertDialog open={isRejectAlertOpen} onOpenChange={setIsRejectAlertOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right">
                        <AlertDialogTitle>تأكيد الرفض</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من رفض طلب المندوب "{selectedDriver?.name}"؟ سيتم تغيير حالته إلى "مرفوض" ولا يمكن التراجع عن هذا الإجراء.
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
