'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { format, addMonths, addYears } from 'date-fns';
import { ar } from 'date-fns/locale';

import VipLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Gem, CheckCircle, XCircle, Crown, Shield, Rocket, Tag, Calendar, CircleDollarSign, Banknote, Wallet, Receipt, Upload, Search, UserCheck, Image as ImageIcon, ListChecks, FileEdit, MoreVertical, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Client } from '../users/page';
import type { BankAccount } from '../bank-accounts/page';


// Schemas
const featureSchema = z.object({ value: z.string().min(1, "لا يمكن ترك الميزة فارغة") });

const packageSchema = z.object({
  name: z.string().min(2, "اسم الباقة مطلوب"),
  type: z.enum(["bronze", "silver", "gold"], { required_error: "نوع الباقة مطلوب" }),
  price: z.coerce.number().min(0, "السعر لا يمكن أن يكون سالبًا"),
  duration: z.enum(["monthly", "quarterly", "yearly"], { required_error: "يجب تحديد مدة الباقة" }),
  features: z.array(featureSchema).min(1, "يجب إضافة ميزة واحدة على الأقل"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const subscriptionSchema = z.object({
    clientId: z.string().min(1, "يجب اختيار العميل"),
    packageId: z.string().min(1, "يجب اختيار الباقة"),
    paymentMethod: z.enum(['cash', 'wallet', 'bank_transfer']),
    bankDetails: z.object({
        bankAccountId: z.string().optional(),
        receiptNumber: z.string().optional(),
        receiptImageUrl: z.string().optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'bank_transfer') {
        if (!data.bankDetails?.bankAccountId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bankDetails.bankAccountId"], message: "يجب اختيار البنك" });
        if (!data.bankDetails?.receiptNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bankDetails.receiptNumber"], message: "رقم السند مطلوب" });
    }
});

const subscriptionEditSchema = z.object({
    expiryDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
    paymentMethod: z.enum(['cash', 'wallet', 'bank_transfer']),
    bankDetails: z.object({
        bankAccountId: z.string().optional(),
        receiptNumber: z.string().optional(),
        receiptImageUrl: z.string().optional(),
    }).optional(),
    isActive: z.boolean(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'bank_transfer') {
        if (!data.bankDetails?.bankAccountId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bankDetails.bankAccountId"], message: "يجب اختيار البنك" });
        if (!data.bankDetails?.receiptNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bankDetails.receiptNumber"], message: "رقم السند مطلوب" });
    }
});


// Types
type VipPackage = z.infer<typeof packageSchema> & { id: string };
type VipSubscription = {
  id: string;
  clientId: string;
  packageId: string;
  activationDate: Timestamp;
  expiryDate: Timestamp;
  paymentMethod: 'cash' | 'wallet' | 'bank_transfer';
  bankDetails?: {
    bankAccountId?: string;
    receiptNumber?: string;
    receiptImageUrl?: string;
  };
  isActive: boolean;
  status?: 'active' | 'deleted';
  deactivatedAt?: Timestamp;
};

// Modal Management State
type ModalType = 'addPackage' | 'editPackage' | 'deletePackage' | 'editSub' | 'deleteSub' | 'detailsSub';

// Component
export default function VipPage() {
    const [modalState, setModalState] = useState<{
        type: ModalType | null;
        data: VipPackage | VipSubscription | null;
    }>({ type: null, data: null });

    const [clientSearch, setClientSearch] = useState('');
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [subFilters, setSubFilters] = useState({ searchTerm: '', status: 'all' });


    const { toast } = useToast();
    const firestore = useFirestore();

    const packageForm = useForm<z.infer<typeof packageSchema>>({ resolver: zodResolver(packageSchema), defaultValues: { name: '', type: 'bronze', price: 0, duration: 'monthly', features: [{ value: '' }], imageUrl: '', isActive: true } });
    const { fields, append, remove } = useFieldArray({ control: packageForm.control, name: "features" });
    const subscriptionForm = useForm<z.infer<typeof subscriptionSchema>>({ 
        resolver: zodResolver(subscriptionSchema), 
        defaultValues: { 
            clientId: '',
            packageId: '',
            paymentMethod: 'cash',
            bankDetails: { bankAccountId: '', receiptNumber: '', receiptImageUrl: '' }
        } 
    });
    const subscriptionEditForm = useForm<z.infer<typeof subscriptionEditSchema>>({
        resolver: zodResolver(subscriptionEditSchema),
        defaultValues: {
             bankDetails: { bankAccountId: '', receiptNumber: '', receiptImageUrl: '' }
        }
    });

    // Data fetching
    const { data: packages, isLoading: l1 } = useCollection<VipPackage>(useMemoFirebase(() => firestore ? collection(firestore, 'vipPackages') : null, [firestore]));
    const { data: clients, isLoading: l2 } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
    const { data: subscriptions, isLoading: l3 } = useCollection<VipSubscription>(useMemoFirebase(() => firestore ? collection(firestore, 'vipSubscriptions') : null, [firestore]));
    const { data: banks, isLoading: l4 } = useCollection<BankAccount>(useMemoFirebase(() => firestore ? collection(firestore, 'bankAccounts') : null, [firestore]));
    const isLoading = l1 || l2 || l3 || l4;
    
    // Memos
    const clientsMap = useMemo(() => clients?.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}) || {}, [clients]);
    const packagesMap = useMemo(() => packages?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {}, [packages]);
    const banksMap = useMemo(() => banks?.reduce((acc, b) => ({ ...acc, [b.id]: b.bankName }), {}) || {}, [banks]);
    const activePackages = useMemo(() => (packages || []).filter(p => p.isActive), [packages]);
    const paymentMethod = subscriptionForm.watch('paymentMethod');
    const editPaymentMethod = subscriptionEditForm.watch('paymentMethod');

     const sortedAndFilteredSubscriptions = useMemo(() => {
        return (subscriptions || [])
            .filter(sub => {
                if (sub.status === 'deleted') return false;
                const client = clientsMap[sub.clientId];
                const matchesSearch = !subFilters.searchTerm || (client && (client.name.toLowerCase().includes(subFilters.searchTerm.toLowerCase()) || client.phone.includes(subFilters.searchTerm)));
                const matchesStatus = subFilters.status === 'all' || (subFilters.status === 'active' && sub.isActive) || (subFilters.status === 'inactive' && !sub.isActive);
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => b.activationDate.toDate().getTime() - a.activationDate.toDate().getTime());
    }, [subscriptions, clientsMap, subFilters]);
    
    // Handlers
    const handleModalOpen = (type: ModalType, data: VipPackage | VipSubscription | null = null) => {
        if (type === 'addPackage') {
            packageForm.reset({ name: '', type: 'bronze', price: 0, duration: 'monthly', features: [{ value: '' }], imageUrl: '', isActive: true });
        } else if (type === 'editPackage' && data) {
            packageForm.reset({ ...(data as VipPackage), isActive: (data as VipPackage).isActive ?? true });
        } else if (type === 'editSub' && data) {
            subscriptionEditForm.reset({
                expiryDate: (data as VipSubscription).expiryDate.toDate(),
                paymentMethod: (data as VipSubscription).paymentMethod,
                bankDetails: (data as VipSubscription).bankDetails || { bankAccountId: '', receiptNumber: '', receiptImageUrl: '' },
                isActive: (data as VipSubscription).isActive,
            });
        }
        setModalState({ type, data });
    };
    
    const handleModalClose = () => {
        setModalState({ type: null, data: null });
    };
    
    const onPackageSubmit = (values: z.infer<typeof packageSchema>) => {
        if (!firestore) return;
        if (modalState.type === 'editPackage' && modalState.data) {
            updateDocumentNonBlocking(doc(firestore, 'vipPackages', modalState.data.id), { ...values });
            toast({ title: "تم تحديث الباقة" });
        } else {
            addDocumentNonBlocking(collection(firestore, 'vipPackages'), { ...values });
            toast({ title: "تمت إضافة الباقة" });
        }
        handleModalClose();
    };

    const confirmDeletePackage = () => {
        if (modalState.type !== 'deletePackage' || !modalState.data || !firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'vipPackages', modalState.data.id));
        toast({ title: "تم حذف الباقة بنجاح" });
        handleModalClose();
    };

    const handleClientSearch = () => {
        const client = (clients || []).find(c => c.phone === clientSearch);
        setFoundClient(client || null);
        if (client) {
            subscriptionForm.setValue('clientId', client.id);
        } else {
            subscriptionForm.setValue('clientId', '');
            toast({ variant: 'destructive', title: "لم يتم العثور على العميل" });
        }
    };

    const onSubscriptionSubmit = (values: z.infer<typeof subscriptionSchema>) => {
        if (!firestore || !foundClient) return;
        const selectedPackage = packagesMap[values.packageId];
        if (!selectedPackage) return;
        
        const activationDate = new Date();
        let expiryDate;
        if (selectedPackage.duration === 'monthly') expiryDate = addMonths(activationDate, 1);
        else if (selectedPackage.duration === 'quarterly') expiryDate = addMonths(activationDate, 3);
        else expiryDate = addYears(activationDate, 1);

        const subscriptionData: Omit<VipSubscription, 'id'> = {
            clientId: foundClient.id,
            packageId: values.packageId,
            activationDate: Timestamp.fromDate(activationDate),
            expiryDate: Timestamp.fromDate(expiryDate),
            paymentMethod: values.paymentMethod,
            isActive: true,
            status: 'active',
        };

        if (values.paymentMethod === 'bank_transfer' && values.bankDetails) {
            subscriptionData.bankDetails = {
                bankAccountId: values.bankDetails.bankAccountId || '',
                receiptNumber: values.bankDetails.receiptNumber || '',
                receiptImageUrl: values.bankDetails.receiptImageUrl || '',
            };
        }

        addDocumentNonBlocking(collection(firestore, 'vipSubscriptions'), subscriptionData);
        toast({ title: `تم تفعيل اشتراك ${foundClient.name} بنجاح!` });
        subscriptionForm.reset({ 
            clientId: '', packageId: '', paymentMethod: 'cash',
            bankDetails: { bankAccountId: '', receiptNumber: '', receiptImageUrl: '' }
        });
        setClientSearch('');
        setFoundClient(null);
    };
    
    const onSubscriptionEditSubmit = (values: z.infer<typeof subscriptionEditSchema>) => {
        if (modalState.type !== 'editSub' || !modalState.data || !firestore) return;
        const dataToUpdate: Partial<VipSubscription> = {
            ...values,
            expiryDate: Timestamp.fromDate(values.expiryDate),
        };
        if (values.paymentMethod !== 'bank_transfer') {
            dataToUpdate.bankDetails = {};
        }
        updateDocumentNonBlocking(doc(firestore, 'vipSubscriptions', modalState.data.id), dataToUpdate);
        toast({ title: 'تم تحديث الاشتراك بنجاح' });
        handleModalClose();
    };

    const confirmSubscriptionDelete = () => {
        if (modalState.type !== 'deleteSub' || !modalState.data || !firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'vipSubscriptions', modalState.data.id), { status: 'deleted', isActive: false });
        toast({ title: "تم حذف الاشتراك بنجاح" });
        handleModalClose();
    };

    const handleDeactivateSubscription = (subId: string) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'vipSubscriptions', subId), { isActive: false, deactivatedAt: serverTimestamp() });
        toast({ variant: 'destructive', title: 'تم إلغاء تفعيل الاشتراك' });
    }

    const typeInfo = {
        bronze: { label: 'برونزية', color: 'bg-orange-600' },
        silver: { label: 'فضية', color: 'bg-slate-500' },
        gold: { label: 'ذهبية', color: 'bg-amber-500' },
    };
    const durationInfo = { monthly: 'شهرياً', quarterly: 'كل 3 أشهر', yearly: 'سنوياً' };

    if (isLoading) return <VipLoading />;

    return (
        <>
        <Tabs defaultValue="manage" dir="rtl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground">إدارة باقات VIP</h1>
                    <p className="text-muted-foreground mt-1">إدارة الباقات وتفعيل الاشتراكات للعملاء.</p>
                </div>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="manage" className="flex-1 sm:flex-initial gap-2"><Gem/>إدارة الباقات</TabsTrigger>
                    <TabsTrigger value="activate" className="flex-1 sm:flex-initial gap-2"><UserCheck/>تفعيل الاشتراكات</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="manage">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>قائمة الباقات</CardTitle>
                            <Button onClick={() => handleModalOpen('addPackage')}><PlusCircle/>إضافة باقة</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(packages || []).map(pkg => (
                                <Card key={pkg.id} className={cn("flex flex-col", !pkg.isActive && "bg-muted/50")}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge className={cn("text-white", typeInfo[pkg.type].color)}>{typeInfo[pkg.type].label}</Badge>
                                            <Badge variant={pkg.isActive ? 'default' : 'secondary'}>{pkg.isActive ? 'فعالة' : 'معطلة'}</Badge>
                                        </div>
                                        <CardTitle className="pt-2">{pkg.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <div className="text-3xl font-bold">{pkg.price.toLocaleString()} <span className="text-sm text-muted-foreground">ر.ي / {durationInfo[pkg.duration].replace('كل ','')}</span></div>
                                        <ul className="space-y-2 text-sm">
                                            {pkg.features.map((feat, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-primary"/>
                                                    <span>{feat.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleModalOpen('editPackage', pkg)}><Edit/>تعديل</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleModalOpen('deletePackage', pkg)}><Trash/>حذف</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="activate" className="space-y-6">
                <Form {...subscriptionForm}>
                    <form onSubmit={subscriptionForm.handleSubmit(onSubscriptionSubmit)}>
                        <Card>
                            <CardHeader><CardTitle>تفعيل اشتراك جديد</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormItem>
                                    <FormLabel>ابحث عن العميل برقم الهاتف</FormLabel>
                                    <div className="flex gap-2">
                                        <Input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="7XXXXXXXX" />
                                        <Button type="button" onClick={handleClientSearch}><Search/></Button>
                                    </div>
                                </FormItem>
                                {foundClient && (
                                    <div className="p-3 bg-primary/10 rounded-lg text-sm space-y-2">
                                        <div><strong>اسم العميل:</strong> {foundClient.name}</div>
                                        <div className="flex items-center gap-2">
                                            <strong>الحالة:</strong> 
                                            <Badge variant={foundClient.is_active ? 'default' : 'destructive'}>{foundClient.is_active ? 'نشط' : 'محظور'}</Badge>
                                        </div>
                                    </div>
                                )}
                                <FormField control={subscriptionForm.control} name="packageId" render={({ field }) => (
                                    <FormItem><FormLabel>اختر الباقة</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={!foundClient}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر باقة..." /></SelectTrigger></FormControl>
                                            <SelectContent>{activePackages.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString()} ر.ي</SelectItem>)}</SelectContent>
                                        </Select><FormMessage/>
                                    </FormItem>
                                )}/>
                                <FormField control={subscriptionForm.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem><FormLabel>طريقة الدفع</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={!foundClient}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر طريقة الدفع..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="cash"><Wallet className="inline-block ml-2"/>كاش</SelectItem>
                                                <SelectItem value="wallet"><Wallet className="inline-block ml-2"/>محفظة</SelectItem>
                                                <SelectItem value="bank_transfer"><Banknote className="inline-block ml-2"/>تحويل بنكي</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>
                                {paymentMethod === 'bank_transfer' && (
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <FormField control={subscriptionForm.control} name="bankDetails.bankAccountId" render={({ field }) => (
                                            <FormItem><FormLabel>اختر البنك</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ''} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر بنك..."/></SelectTrigger></FormControl>
                                                <SelectContent>{(banks || []).map(b => <SelectItem key={b.id} value={b.id}>{b.bankName}</SelectItem>)}</SelectContent></Select><FormMessage/>
                                            </FormItem>
                                        )}/>
                                        <FormField control={subscriptionForm.control} name="bankDetails.receiptNumber" render={({ field }) => (
                                            <FormItem><FormLabel>رقم السند</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                                        )}/>
                                        <FormField control={subscriptionForm.control} name="bankDetails.receiptImageUrl" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>رابط صورة السند (اختياري)</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} placeholder="https://..." dir="ltr" /></FormControl>
                                                {field.value && <div className="mt-2 flex justify-center rounded-lg border border-dashed p-1"><Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-md object-contain" unoptimized/></div>}
                                                <FormMessage/>
                                            </FormItem>
                                        )}/>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={!subscriptionForm.formState.isValid}>تفعيل الاشتراك</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
                
                <Card>
                    <CardHeader>
                        <CardTitle>سجل الاشتراكات</CardTitle>
                        <CardDescription>عرض وتصفية وإدارة جميع اشتراكات العملاء.</CardDescription>
                         <div className="flex flex-col sm:flex-row gap-2 pt-4">
                           <Input placeholder="ابحث باسم العميل أو رقمه..." value={subFilters.searchTerm} onChange={e => setSubFilters(f => ({...f, searchTerm: e.target.value}))} className="w-full sm:w-64" />
                           <Select value={subFilters.status} onValueChange={status => setSubFilters(f => ({...f, status: status as 'all'|'active'|'inactive'}))}>
                             <SelectTrigger className="w-full sm:w-48"><SelectValue/></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">كل الحالات</SelectItem>
                               <SelectItem value="active">فعال</SelectItem>
                               <SelectItem value="inactive">غير فعال</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">العميل</TableHead>
                                    <TableHead className="text-center">الباقة</TableHead>
                                    <TableHead className="text-center">تاريخ التفعيل</TableHead>
                                    <TableHead className="text-center">تاريخ الانتهاء</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center">إجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(sortedAndFilteredSubscriptions || []).map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="text-center">{clientsMap[sub.clientId]?.name || 'غير معروف'}</TableCell>
                                        <TableCell className="text-center">{packagesMap[sub.packageId]?.name || 'محذوفة'}</TableCell>
                                        <TableCell className="text-center">{format(sub.activationDate.toDate(), 'd MMM yyyy', { locale: ar })}</TableCell>
                                        <TableCell className="text-center">{format(sub.expiryDate.toDate(), 'd MMM yyyy', { locale: ar })}</TableCell>
                                        <TableCell className="text-center"><Badge variant={sub.isActive ? 'default' : 'secondary'}>{sub.isActive ? 'فعال' : 'منتهي'}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleModalOpen('detailsSub', sub)}><FileText className="ml-2"/> عرض التفاصيل</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleModalOpen('editSub', sub)}><FileEdit className="ml-2"/> تعديل</DropdownMenuItem>
                                                    {sub.isActive && <DropdownMenuItem onClick={() => handleDeactivateSubscription(sub.id)} className="text-yellow-600 focus:text-yellow-600"><XCircle className="ml-2"/> إلغاء التفعيل</DropdownMenuItem>}
                                                    <DropdownMenuItem onClick={() => handleModalOpen('deleteSub', sub)} className="text-destructive focus:text-destructive"><Trash className="ml-2"/> حذف</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* Package Dialog */}
        <Dialog open={modalState.type === 'addPackage' || modalState.type === 'editPackage'} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>{modalState.type === 'editPackage' ? 'تعديل باقة' : 'إضافة باقة جديدة'}</DialogTitle>
                    <DialogDescription>أدخل تفاصيل الباقة والمميزات التي تقدمها.</DialogDescription>
                </DialogHeader>
                <Form {...packageForm}>
                    <form onSubmit={packageForm.handleSubmit(onPackageSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={packageForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Tag/>اسم الباقة</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                            <FormField control={packageForm.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Gem/>نوع الباقة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع..."/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="bronze">برونزية</SelectItem>
                                            <SelectItem value="silver">فضية</SelectItem>
                                            <SelectItem value="gold">ذهبية</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                            <FormField control={packageForm.control} name="price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><CircleDollarSign/>السعر (ر.ي)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                            <FormField control={packageForm.control} name="duration" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Calendar/>المدة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر المدة..."/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="monthly">شهرية</SelectItem>
                                            <SelectItem value="quarterly">ربع سنوية (3 أشهر)</SelectItem>
                                            <SelectItem value="yearly">سنوية</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                        </div>
                         <FormField control={packageForm.control} name="imageUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><ImageIcon/>رابط صورة الباقة (اختياري)</FormLabel>
                                <FormControl><Input {...field} dir="ltr" placeholder="https://... or /image.png"/></FormControl>
                                {field.value && <div className="mt-2 flex justify-center rounded-lg border border-dashed p-1"><Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-md object-contain" unoptimized/></div>}
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        
                        <div>
                            <FormLabel className="flex items-center gap-2 mb-2"><ListChecks /> مميزات الباقة</FormLabel>
                            <div className="space-y-2 pt-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center">
                                        <FormField control={packageForm.control} name={`features.${index}.value`} render={({ field: itemField }) => (
                                            <FormItem className="flex-grow">
                                                <FormControl>
                                                    <div className="relative">
                                                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input {...itemField} placeholder={`ميزة #${index + 1}`} className="pr-10"/>
                                                    </div>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive shrink-0"><Trash/></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="w-full" onClick={() => append({ value: '' })}>إضافة ميزة</Button>
                                <FormMessage>{packageForm.formState.errors.features?.message || packageForm.formState.errors.features?.root?.message}</FormMessage>
                            </div>
                        </div>
                        
                        <FormField control={packageForm.control} name="isActive" render={({ field }) => (
                            <FormItem>
                                <FormLabel>حالة الباقة</FormLabel>
                                <FormControl>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)} className="h-11"><CheckCircle />فعالة</Button>
                                        <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)} className="h-11"><XCircle />معطلة</Button>
                                    </div>
                                </FormControl>
                            </FormItem>
                        )} />
                        
                        <DialogFooter className="pt-4 flex-row-reverse sm:justify-start gap-2">
                            <Button type="submit">حفظ</Button>
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={modalState.type === 'deletePackage'} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
             <AlertDialogContent dir="rtl">
                <AlertDialogHeader className="text-right">
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>سيتم حذف الباقة بشكل دائم.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
                    <AlertDialogAction onClick={confirmDeletePackage}>نعم، قم بالحذف</AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={modalState.type === 'editSub'} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
            <DialogContent dir="rtl">
                 <DialogHeader className="text-right">
                    <DialogTitle>تعديل الاشتراك</DialogTitle>
                    {modalState.data && <DialogDescription>تحديث تفاصيل اشتراك العميل: {clientsMap[(modalState.data as VipSubscription).clientId]?.name}</DialogDescription>}
                </DialogHeader>
                <Form {...subscriptionEditForm}>
                    <form onSubmit={subscriptionEditForm.handleSubmit(onSubscriptionEditSubmit)} className="space-y-4">
                        <FormField control={subscriptionEditForm.control} name="expiryDate" render={({ field }) => (
                            <FormItem><FormLabel>تاريخ الانتهاء</FormLabel>
                                <FormControl>
                                    <Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} />
                                </FormControl><FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={subscriptionEditForm.control} name="paymentMethod" render={({ field }) => (
                            <FormItem><FormLabel>طريقة الدفع</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">كاش</SelectItem><SelectItem value="wallet">محفظة</SelectItem><SelectItem value="bank_transfer">تحويل بنكي</SelectItem></SelectContent></Select></FormItem>
                        )}/>
                        {editPaymentMethod === 'bank_transfer' && (
                            <div className="p-3 border rounded-lg space-y-3">
                                <FormField control={subscriptionEditForm.control} name="bankDetails.bankAccountId" render={({ field }) => (
                                    <FormItem><FormLabel>البنك</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر..."/></SelectTrigger></FormControl><SelectContent>{(banks || []).map(b => <SelectItem key={b.id} value={b.id}>{b.bankName}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                                )}/>
                                <FormField control={subscriptionEditForm.control} name="bankDetails.receiptNumber" render={({ field }) => (
                                    <FormItem><FormLabel>رقم السند</FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage/></FormItem>
                                )}/>
                                 <FormField control={subscriptionEditForm.control} name="bankDetails.receiptImageUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رابط صورة السند (اختياري)</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ''} placeholder="https://..." dir="ltr" /></FormControl>
                                        {field.value && <div className="mt-2 flex justify-center rounded-lg border border-dashed p-1"><Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-md object-contain" unoptimized/></div>}
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                            </div>
                        )}
                         <FormField control={subscriptionEditForm.control} name="isActive" render={({ field }) => (
                            <FormItem><FormLabel>حالة الاشتراك</FormLabel><FormControl>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)}>فعال</Button>
                                    <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)}>غير فعال</Button>
                                </div>
                            </FormControl></FormItem>
                        )}/>
                         <DialogFooter className="pt-4 flex-row-reverse sm:justify-start gap-2">
                            <Button type="submit">حفظ التعديلات</Button>
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={modalState.type === 'deleteSub'} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
            <AlertDialogContent dir="rtl">
                <AlertDialogHeader className="text-right">
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>هل أنت متأكد من حذف هذا الاشتراك؟ سيتم تغيير حالته إلى "محذوف" وإخفاؤه من القائمة.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
                    <AlertDialogAction onClick={confirmSubscriptionDelete}>نعم، قم بالحذف</AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={modalState.type === 'detailsSub'} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
            <DialogContent className="max-w-lg [&>button]:right-auto [&>button]:left-4" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>تفاصيل الاشتراك</DialogTitle>
                </DialogHeader>
                {modalState.type === 'detailsSub' && modalState.data && (() => {
                    const sub = modalState.data as VipSubscription;
                    const client = clientsMap[sub.clientId];
                    const pkg = packagesMap[sub.packageId];
                    return (
                        <div className="space-y-4 pt-2 text-sm">
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base">بيانات العميل</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div><strong>الاسم:</strong> {client?.name || 'غير معروف'}</div>
                                    <div><strong>الرقم:</strong> {client?.phone || 'غير معروف'}</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base">بيانات الباقة</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div><strong>الباقة:</strong> {pkg?.name || 'باقة محذوفة'}</div>
                                    <div><strong>السعر:</strong> {pkg ? `${pkg.price.toLocaleString()} ر.ي` : 'N/A'}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base">بيانات الاشتراك</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div><strong>تاريخ التفعيل:</strong> {sub.activationDate ? format(sub.activationDate.toDate(), 'd MMMM yyyy', { locale: ar }) : 'غير محدد'}</div>
                                    <div><strong>تاريخ الانتهاء:</strong> {sub.expiryDate ? format(sub.expiryDate.toDate(), 'd MMMM yyyy', { locale: ar }) : 'غير محدد'}</div>
                                    {sub.deactivatedAt && <div className="text-yellow-600"><strong>تاريخ إلغاء التفعيل:</strong> {format(sub.deactivatedAt.toDate(), 'd MMMM yyyy', { locale: ar })}</div>}
                                    <div className="flex items-center gap-2"><strong>الحالة:</strong> <Badge variant={sub.isActive ? 'default' : 'secondary'}>{sub.isActive ? 'فعال' : 'غير فعال'}</Badge></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base">بيانات الدفع</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div><strong>طريقة الدفع:</strong> {sub.paymentMethod === 'cash' ? 'كاش' : sub.paymentMethod === 'wallet' ? 'محفظة' : 'تحويل بنكي'}</div>
                                    {sub.paymentMethod === 'bank_transfer' && sub.bankDetails && (
                                        <div className="mt-2 space-y-2 border-t pt-2">
                                            <div><strong>البنك:</strong> {banksMap[sub.bankDetails.bankAccountId || ''] || 'غير محدد'}</div>
                                            <div><strong>رقم السند:</strong> {sub.bankDetails.receiptNumber || 'لم يحدد'}</div>
                                            {sub.bankDetails.receiptImageUrl && (
                                                <div>
                                                    <strong>صورة السند:</strong>
                                                    <Image src={sub.bankDetails.receiptImageUrl} alt="إيصال" width={100} height={100} className="mt-1 rounded-md border"/>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })()}
            </DialogContent>
        </Dialog>
        </>
    );
}
