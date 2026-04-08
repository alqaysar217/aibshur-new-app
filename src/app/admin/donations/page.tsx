'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, HandHeart, User, Phone, CircleDollarSign, Banknote, Wallet, Link as LinkIcon, FileImage, Hash, Megaphone, Target, BadgeDollarSign, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import DonationsLoading from './loading';
import type { BankAccount } from '../bank-accounts/page';
import type { DonationType } from '../donation-types/page';

// Zod Schemas
const donationSchema = z.object({
  donorName: z.string().min(2, { message: 'اسم المتبرع مطلوب' }),
  donorPhone: z.string().optional(),
  amount: z.coerce.number().min(1, { message: 'المبلغ يجب أن يكون أكبر من صفر' }),
  typeId: z.string({ required_error: 'يجب اختيار نوع التبرع' }).min(1, { message: 'يجب اختيار نوع التبرع' }),
  paymentMethod: z.enum(['cash', 'wallet', 'bank_transfer'], { required_error: 'طريقة التبرع مطلوبة' }),
  bankAccountId: z.string().optional(),
  receiptNumber: z.string().optional(),
  receiptImageUrl: z.string().optional(),
  donationDate: z.date({ required_error: 'تاريخ التبرع مطلوب' }),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'bank_transfer') {
        if (!data.bankAccountId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bankAccountId"], message: "يجب اختيار البنك." });
        if (!data.receiptNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["receiptNumber"], message: "رقم السند مطلوب." });
    }
});

const campaignSchema = z.object({
    title: z.string().min(5, { message: "عنوان الحملة مطلوب" }),
    goalAmount: z.coerce.number().min(1, { message: "الهدف المالي مطلوب" }),
    imageUrl: z.string().min(1, { message: "رابط الصورة مطلوب" }),
});

// Types
type DonationFormValues = z.infer<typeof donationSchema>;
// Adjust Donation to handle Firestore Timestamp
type Donation = Omit<DonationFormValues, 'donationDate'> & { 
  id: string;
  donationDate: Timestamp; 
};

type CampaignFormValues = z.infer<typeof campaignSchema>;
type Campaign = CampaignFormValues & { id: string };

const defaultDonationValues: DonationFormValues = {
    donorName: '',
    donorPhone: '',
    amount: 0,
    typeId: '',
    paymentMethod: 'cash',
    bankAccountId: '',
    receiptNumber: '',
    receiptImageUrl: '',
    donationDate: new Date(),
};

const defaultCampaignValues: CampaignFormValues = {
    title: '',
    goalAmount: 0,
    imageUrl: '',
};

export default function DonationsPage() {
    const [dialogState, setDialogState] = useState<{ isOpen: boolean; isEditing: boolean; data: Donation | Campaign | null; type: 'donation' | 'campaign' }>({ isOpen: false, isEditing: false, data: null, type: 'donation' });
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const { toast } = useToast();
    const firestore = useFirestore();

    const donationForm = useForm<DonationFormValues>({ resolver: zodResolver(donationSchema), defaultValues: defaultDonationValues });
    const campaignForm = useForm<CampaignFormValues>({ resolver: zodResolver(campaignSchema), defaultValues: defaultCampaignValues });
    
    // Data Fetching
    const { data: donations, isLoading: isLoadingDonations } = useCollection<Donation>(useMemoFirebase(() => firestore ? collection(firestore, 'donations') : null, [firestore]));
    const { data: campaigns, isLoading: isLoadingCampaigns } = useCollection<Campaign>(useMemoFirebase(() => firestore ? collection(firestore, 'donationCampaigns') : null, [firestore]));
    const { data: donationTypes, isLoading: isLoadingTypes } = useCollection<DonationType>(useMemoFirebase(() => firestore ? collection(firestore, 'donationTypes') : null, [firestore]));
    const { data: bankAccounts, isLoading: isLoadingBanks } = useCollection<BankAccount>(useMemoFirebase(() => firestore ? collection(firestore, 'bankAccounts') : null, [firestore]));

    const donationTypesMap = useMemo(() => donationTypes?.reduce((acc, item) => ({ ...acc, [item.id]: item.name }), {}) || {}, [donationTypes]);
    const bankAccountsMap = useMemo(() => bankAccounts?.reduce((acc, item) => ({ ...acc, [item.id]: item.bankName }), {}) || {}, [bankAccounts]);
    
    const paymentMethod = donationForm.watch('paymentMethod');

    // Handlers
    const handleOpenDialog = (type: 'donation' | 'campaign', isEditing = false, data: Donation | Campaign | null = null) => {
        if (type === 'donation') {
            if (isEditing && data) {
                const d = data as Donation;
                donationForm.reset({
                    ...defaultDonationValues, // Provide base defaults
                    ...d, // Spread fetched data
                    donationDate: d.donationDate?.toDate ? d.donationDate.toDate() : new Date(), // Convert timestamp
                });
            } else {
                donationForm.reset(defaultDonationValues);
            }
        } else { // campaign
            if (isEditing && data) {
                campaignForm.reset({
                    ...defaultCampaignValues,
                    ...(data as Campaign),
                });
            } else {
                campaignForm.reset(defaultCampaignValues);
            }
        }
        setDialogState({ isOpen: true, isEditing, data, type });
    };

    const handleDelete = (type: 'donation' | 'campaign', data: Donation | Campaign) => {
        setDialogState(prev => ({ ...prev, data, type }));
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        const { data, type } = dialogState;
        if (!data || !firestore) return;
        const collectionName = type === 'donation' ? 'donations' : 'donationCampaigns';
        deleteDocumentNonBlocking(doc(firestore, collectionName, data.id));
        toast({ title: "تم الحذف بنجاح" });
        setIsAlertOpen(false);
    };

    const onDonationSubmit = (values: DonationFormValues) => {
        if (!firestore) return;
        const dataToSave = { ...values, timestamp: serverTimestamp() };
        if (dialogState.isEditing && dialogState.data) {
            updateDocumentNonBlocking(doc(firestore, 'donations', dialogState.data.id), dataToSave);
            toast({ title: "تم تحديث التبرع بنجاح" });
        } else {
            addDocumentNonBlocking(collection(firestore, 'donations'), dataToSave);
            toast({ title: "تمت إضافة التبرع بنجاح" });
        }
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

     const onCampaignSubmit = (values: CampaignFormValues) => {
        if (!firestore) return;
        if (dialogState.isEditing && dialogState.data) {
            updateDocumentNonBlocking(doc(firestore, 'donationCampaigns', dialogState.data.id), values);
            toast({ title: "تم تحديث الحملة بنجاح" });
        } else {
            addDocumentNonBlocking(collection(firestore, 'donationCampaigns'), values);
            toast({ title: "تمت إضافة الحملة بنجاح" });
        }
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    const totalDonations = useMemo(() => donations?.reduce((sum, d) => sum + d.amount, 0) || 0, [donations]);
    const today = new Date().setHours(0, 0, 0, 0);
    const todayDonations = useMemo(() => {
        if (!donations) return 0;
        return donations
            .filter(d => d.donationDate && new Date(d.donationDate.toDate()).setHours(0,0,0,0) === today)
            .reduce((sum, d) => sum + d.amount, 0);
    }, [donations, today]);


    const isLoading = isLoadingDonations || isLoadingCampaigns || isLoadingTypes || isLoadingBanks;
    if (isLoading) return <DonationsLoading />;

    return (
        <>
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي التبرعات</CardTitle>
                            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" dir="ltr">{totalDonations.toLocaleString()} ر.ي</div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">تبرعات اليوم</CardTitle>
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" dir="ltr">{todayDonations.toLocaleString()} ر.ي</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="donations" dir="rtl">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="donations" className="gap-2"><HandHeart />إدارة التبرعات</TabsTrigger>
                        <TabsTrigger value="campaigns" className="gap-2"><Megaphone />إدارة الحملات</TabsTrigger>
                    </TabsList>

                    <TabsContent value="donations" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>سجل التبرعات</CardTitle>
                                        <CardDescription>عرض وتعديل وحذف التبرعات المسجلة.</CardDescription>
                                    </div>
                                    <Button onClick={() => handleOpenDialog('donation')}><PlusCircle className="mr-2 h-4 w-4" /> إضافة تبرع</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader><TableRow>
                                            <TableHead className="text-center">نوع التبرع</TableHead>
                                            <TableHead className="text-center">اسم المتبرع</TableHead>
                                            <TableHead className="text-center">المبلغ</TableHead>
                                            <TableHead className="text-center">طريقة الدفع</TableHead>
                                            <TableHead className="text-center">الإجراءات</TableHead>
                                        </TableRow></TableHeader>
                                        <TableBody>
                                            {donations?.map(d => (
                                                <TableRow key={d.id}>
                                                    <TableCell className="text-center font-medium">{donationTypesMap[d.typeId] || 'غير محدد'}</TableCell>
                                                    <TableCell className="text-center">{d.donorName}</TableCell>
                                                    <TableCell className="text-center font-semibold" dir="ltr">{d.amount.toLocaleString()} ر.ي</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">
                                                            {d.paymentMethod === 'cash' ? 'نقد' : d.paymentMethod === 'wallet' ? 'محفظة' : 'تحويل بنكي'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog('donation', true, d)}><Edit /></Button>
                                                            <Button variant="outline" size="icon" onClick={() => handleDelete('donation', d)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash /></Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="campaigns" className="mt-4">
                        <Card>
                             <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>حملات التبرع</CardTitle>
                                        <CardDescription>إدارة الحملات الإعلانية لجمع التبرعات.</CardDescription>
                                    </div>
                                    <Button onClick={() => handleOpenDialog('campaign')}><PlusCircle className="mr-2 h-4 w-4" /> إضافة حملة</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <Table>
                                         <TableHeader><TableRow>
                                            <TableHead className="text-center w-[120px]">الصورة</TableHead>
                                            <TableHead className="text-center">عنوان الحملة</TableHead>
                                            <TableHead className="text-center">الهدف المالي</TableHead>
                                            <TableHead className="text-center w-[120px]">الإجراءات</TableHead>
                                        </TableRow></TableHeader>
                                        <TableBody>
                                            {campaigns?.map(c => (
                                                <TableRow key={c.id}>
                                                    <TableCell><Image src={c.imageUrl} alt={c.title} width={80} height={80} className="rounded-lg object-cover mx-auto" unoptimized /></TableCell>
                                                    <TableCell className="text-center font-medium">{c.title}</TableCell>
                                                    <TableCell className="text-center font-semibold" dir="ltr">{c.goalAmount.toLocaleString()} ر.ي</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog('campaign', true, c)}><Edit /></Button>
                                                            <Button variant="outline" size="icon" onClick={() => handleDelete('campaign', c)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash /></Button>
                                                        </div>
                                                    </TableCell>
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

            {/* DIALOGS */}
            <Dialog open={dialogState.isOpen} onOpenChange={(isOpen) => setDialogState(prev => ({...prev, isOpen}))}>
                <DialogContent className="sm:max-w-lg [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">
                            {dialogState.type === 'donation' ? (dialogState.isEditing ? 'تعديل تبرع' : 'إضافة تبرع جديد') : (dialogState.isEditing ? 'تعديل حملة' : 'إضافة حملة جديدة')}
                        </DialogTitle>
                        <DialogDescription className="text-right">أكمل الحقول التالية.</DialogDescription>
                    </DialogHeader>
                    
                    {dialogState.type === 'donation' ? (
                        <Form {...donationForm}>
                            <form onSubmit={donationForm.handleSubmit(onDonationSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                                 <FormField control={donationForm.control} name="typeId" render={({ field }) => (
                                    <FormItem><FormLabel>نوع التبرع</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><div className="flex items-center gap-2"><HandHeart /><SelectValue placeholder="اختر نوع التبرع..." /></div></SelectTrigger></FormControl>
                                            <SelectContent>{donationTypes?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem>
                                )} />
                                <FormField control={donationForm.control} name="donorName" render={({ field }) => (
                                    <FormItem><FormLabel>اسم المتبرع</FormLabel><div className="relative"><User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                )} />
                                <FormField control={donationForm.control} name="donorPhone" render={({ field }) => (
                                    <FormItem><FormLabel>رقم هاتف المتبرع (اختياري)</FormLabel><div className="relative"><Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="tel" {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                )} />
                                <FormField control={donationForm.control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel>المبلغ</FormLabel><div className="relative"><CircleDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="number" {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                )} />

                                <FormField control={donationForm.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem><FormLabel>طريقة الدفع</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><div className="flex items-center gap-2"><Wallet /><SelectValue placeholder="اختر الطريقة..." /></div></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="cash">نقد</SelectItem>
                                                <SelectItem value="wallet">محفظة إلكترونية</SelectItem>
                                                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem>
                                )} />

                                {paymentMethod === 'bank_transfer' && (
                                    <div className="space-y-4 rounded-lg border p-4">
                                        <FormField control={donationForm.control} name="bankAccountId" render={({ field }) => (
                                            <FormItem><FormLabel>البنك المحول إليه</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><div className="flex items-center gap-2"><Banknote /><SelectValue placeholder="اختر البنك..." /></div></SelectTrigger></FormControl>
                                                    <SelectContent>{bankAccounts?.map(b => <SelectItem key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</SelectItem>)}</SelectContent>
                                                </Select><FormMessage /></FormItem>
                                        )} />
                                         <FormField control={donationForm.control} name="receiptNumber" render={({ field }) => (
                                            <FormItem><FormLabel>رقم السند</FormLabel><div className="relative"><Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={donationForm.control} name="receiptImageUrl" render={({ field }) => (
                                            <FormItem><FormLabel>رابط صورة السند (اختياري)</FormLabel><div className="relative"><FileImage className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} dir="ltr" className="pr-10" /></FormControl></div>
                                            {field.value && <Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-lg object-contain mt-2 border p-2" unoptimized />}
                                            <FormMessage /></FormItem>
                                        )} />
                                    </div>
                                )}
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                    <Button type="submit">حفظ</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    ) : (
                         <Form {...campaignForm}>
                            <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-4 py-4">
                                <FormField control={campaignForm.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>عنوان الحملة</FormLabel><div className="relative"><Megaphone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                )} />
                                <FormField control={campaignForm.control} name="goalAmount" render={({ field }) => (
                                    <FormItem><FormLabel>الهدف المالي (ر.ي)</FormLabel><div className="relative"><Target className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="number" {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                )} />
                                <FormField control={campaignForm.control} name="imageUrl" render={({ field }) => (
                                    <FormItem><FormLabel>رابط صورة الحملة</FormLabel><div className="relative"><LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} dir="ltr" className="pr-10" /></FormControl></div>
                                    {field.value && <Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-lg object-contain mt-2 border p-2 mx-auto" unoptimized />}
                                    <FormMessage /></FormItem>
                                )} />
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                    <Button type="submit">حفظ</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Alert Dialog for Delete */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right">
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
