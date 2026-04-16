'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, query, where, Timestamp, runTransaction, serverTimestamp, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import WalletsLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Search, User, Phone, BadgeCent, Loader2, List, History, FileText, Filter, Calendar, Building, Hash, Paperclip, CircleDollarSign, ListChecks, Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Client } from '../users/page';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import type { BankAccount } from '../bank-accounts/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { updateDoc } from 'firebase/firestore';


// Types
type UserWallet = {
    id: string;
    userId: string;
    pointsBalance: number;
    cashBalance: number;
};

type WalletTransaction = {
    id: string;
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'adjustment';
    amount: number;
    newBalance: number;
    notes: string;
    createdAt: Timestamp;
    bankDetails?: {
        bankName: string;
        referenceNumber: string;
        receiptImageUrl?: string;
    };
};


// Zod Schemas
const depositSchema = z.object({
  amount: z.coerce.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
  bankName: z.string().min(1, "الرجاء اختيار البنك"),
  referenceNumber: z.string().min(1, "رقم السند مطلوب"),
  receiptImageUrl: z.string().optional(),
});

const refundSchema = z.object({
    amount: z.coerce.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
    reason: z.string().min(10, "الرجاء كتابة سبب واضح للاسترجاع"),
});

const ImagePreview = ({ url }: { url?: string }) => {
    if (!url) return null;
    return (
        <div className="mt-2 flex justify-center rounded-lg border border-dashed p-1">
            <Image src={url} alt="معاينة" width={80} height={80} className="rounded-md object-contain" unoptimized />
        </div>
    )
};


export default function WalletsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [isLoadingClient, setIsLoadingClient] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logFilters, setLogFilters] = useState({ searchTerm: '', type: 'all' });
    const [detailsDialogState, setDetailsDialogState] = useState<{ isOpen: boolean, transaction: WalletTransaction | null }>({ isOpen: false, transaction: null });

    const { toast } = useToast();
    const firestore = useFirestore();

    // Data Fetching
    const { data: clientData, isLoading: isLoadingClientCollection } = useCollection<Client>(useMemoFirebase(() => (firestore && debouncedSearchTerm) ? query(collection(firestore, 'clients'), where('phone', '==', debouncedSearchTerm)) : null, [firestore, debouncedSearchTerm]));
    const { data: userWallet, isLoading: isLoadingWallet } = useDoc<UserWallet>(useMemoFirebase(() => (firestore && foundClient) ? doc(firestore, 'users', foundClient.id, 'wallet', 'main') : null, [firestore, foundClient]));
    const { data: bankAccounts, isLoading: isLoadingBanks } = useCollection<BankAccount>(useMemoFirebase(() => firestore ? collection(firestore, 'bankAccounts') : null, [firestore]));
    
    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !foundClient) return null;
        return query(collection(firestore, 'users', foundClient.id, 'walletTransactions'), orderBy('createdAt', 'desc'));
    }, [firestore, foundClient]);

    const { data: rawTransactions, isLoading: isLoadingTransactions, error: transactionsError } = useCollection<WalletTransaction>(transactionsQuery);

    const transactions = useMemo(() => {
        if (!rawTransactions) return [];
        return rawTransactions.map(tx => ({
            ...tx,
            createdAt: tx.createdAt,
        }));
    }, [rawTransactions]);

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => {
            const matchesType = logFilters.type === 'all' || tx.type === logFilters.type;
            const searchTermLower = logFilters.searchTerm.toLowerCase();
            const matchesSearch = !logFilters.searchTerm ||
                tx.notes.toLowerCase().includes(searchTermLower) ||
                (tx.bankDetails && tx.bankDetails.referenceNumber && tx.bankDetails.referenceNumber.toLowerCase().includes(searchTermLower)) ||
                (tx.bankDetails && tx.bankDetails.bankName && tx.bankDetails.bankName.toLowerCase().includes(searchTermLower));
            return matchesType && matchesSearch;
        });
    }, [transactions, logFilters]);


    useEffect(() => {
        if (transactionsError) {
            console.error("Failed to get wallet transactions:", transactionsError);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: `فشل في تحميل سجل العمليات: ${transactionsError.message}`,
            });
        }
    }, [transactionsError, toast]);

    
    // Forms
    const depositForm = useForm<z.infer<typeof depositSchema>>({ resolver: zodResolver(depositSchema), defaultValues: { amount: 0, bankName: '', referenceNumber: '', receiptImageUrl: '' }});
    const refundForm = useForm<z.infer<typeof refundSchema>>({ resolver: zodResolver(refundSchema), defaultValues: { amount: 0, reason: '' }});

    // Effects
    useEffect(() => { const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500); return () => clearTimeout(handler); }, [searchTerm]);
    
    useEffect(() => {
        if (!isLoadingClientCollection) {
            const client = clientData?.[0] || null;
            setFoundClient(client);
            setIsLoadingClient(false);
        }
    }, [clientData, isLoadingClientCollection]);
    
    // Handlers
    const handleSearch = () => {
        setIsLoadingClient(true);
        setDebouncedSearchTerm(searchTerm);
    };

    const handleToggleActive = async () => {
        if (!foundClient || !firestore) return;
        const newStatus = !foundClient.is_active;
        await updateDoc(doc(firestore, 'clients', foundClient.id), { is_active: newStatus });
        setFoundClient(c => c ? { ...c, is_active: newStatus } : null);
        toast({ title: newStatus ? "تم تفعيل الحساب" : "تم تجميد الحساب" });
    };

    const onDepositSubmit = async (values: z.infer<typeof depositSchema>) => {
        if (!firestore || !foundClient) return;
        setIsSubmitting(true);
        
        const { amount, bankName, referenceNumber, receiptImageUrl } = values;
        const clientId = foundClient.id;

        try {
            await runTransaction(firestore, async (transaction) => {
                const walletRef = doc(firestore, 'users', clientId, 'wallet', 'main');
                const walletDoc = await transaction.get(walletRef);
                
                const currentBalance = walletDoc.exists() ? walletDoc.data().cashBalance : 0;
                const newBalance = currentBalance + amount;

                if (walletDoc.exists()) {
                    transaction.update(walletRef, { cashBalance: newBalance });
                } else {
                    transaction.set(walletRef, { userId: clientId, cashBalance: newBalance, pointsBalance: 0 });
                }

                const logRef = doc(collection(firestore, 'users', clientId, 'walletTransactions'));
                transaction.set(logRef, {
                    userId: clientId,
                    type: 'deposit',
                    amount: amount,
                    newBalance: newBalance,
                    notes: `إيداع عبر ${bankName}`,
                    bankDetails: { bankName, referenceNumber, receiptImageUrl: receiptImageUrl || '' },
                    createdAt: serverTimestamp(),
                });
            });

            toast({ title: 'تم الإيداع بنجاح', description: `تمت إضافة ${amount} ر.ي إلى محفظة ${foundClient.name}.` });
            depositForm.reset();
        } catch (e: any) {
            console.error("Deposit transaction failed:", e);
            toast({ variant: 'destructive', title: 'فشل الإيداع', description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const onRefundSubmit = async (values: z.infer<typeof refundSchema>) => {
        if (!firestore || !foundClient) return false;
        setIsSubmitting(true);
        
        const { amount, reason } = values;
        const clientId = foundClient.id;
    
        try {
            await runTransaction(firestore, async (transaction) => {
                const walletRef = doc(firestore, 'users', clientId, 'wallet', 'main');
                const walletDoc = await transaction.get(walletRef);
    
                if (!walletDoc.exists()) {
                    throw new Error("لم يتم العثور على محفظة العميل.");
                }
                
                const currentBalance = walletDoc.data().cashBalance || 0;
                if (currentBalance < amount) {
                    throw new Error("رصيد العميل غير كافٍ لعملية الاسترجاع.");
                }
                const newBalance = currentBalance - amount;
    
                transaction.update(walletRef, { cashBalance: newBalance });
    
                const logRef = doc(collection(firestore, 'users', clientId, 'walletTransactions'));
                transaction.set(logRef, {
                    userId: clientId,
                    type: 'refund',
                    amount: -amount,
                    newBalance: newBalance,
                    notes: `استرجاع رصيد: ${reason}`,
                    createdAt: serverTimestamp(),
                });
            });
            toast({ title: "تم الاسترجاع بنجاح" });
            refundForm.reset();
            return true; // for closing dialog
        } catch (e: any) {
            console.error("Refund transaction failed:", e);
            toast({ variant: 'destructive', title: 'فشل الاسترجاع', description: e.message });
            return false; // for not closing dialog
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingClientCollection || isLoadingBanks) {
        return <WalletsLoading />;
    }

    return (
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-black text-foreground">إدارة المحافظ</h1>
          <p className="text-muted-foreground mt-1">
            إدارة أرصدة العملاء، إضافة رصيد، وتتبع العمليات المالية.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>البحث عن عميل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="أدخل رقم هاتف العميل (7...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
              <Button onClick={handleSearch} disabled={isLoadingClient}>
                {isLoadingClient ? <Loader2 className="animate-spin" /> : <Search />} تحقق
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoadingClient && <div className="text-center"><Loader2 className="animate-spin text-primary"/></div>}

        {debouncedSearchTerm && !isLoadingClient && !foundClient && (
            <Card className="border-destructive"><CardContent className="p-4 text-center text-destructive">لم يتم العثور على عميل بهذا الرقم.</CardContent></Card>
        )}

        {foundClient && (
          <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User/>بيانات العميل</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div>
                        <p><strong>الاسم:</strong> {foundClient.name}</p>
                        <p><strong>الهاتف:</strong> {foundClient.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={foundClient.is_active ? 'default' : 'destructive'}>{foundClient.is_active ? 'نشط' : 'محظور'}</Badge>
                    </div>
                </CardContent>
            </Card>
            
            <Tabs defaultValue="actions" dir="rtl">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="actions" className="gap-2"><Wallet/>إجراءات المحفظة</TabsTrigger>
                    <TabsTrigger value="log" className="gap-2"><History/>سجل العمليات</TabsTrigger>
                </TabsList>
                
                <TabsContent value="actions" className="mt-4">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                             <Form {...depositForm}>
                                <form onSubmit={depositForm.handleSubmit(onDepositSubmit)}>
                                    <Card>
                                        <CardHeader><CardTitle>إضافة رصيد جديد</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField name="amount" control={depositForm.control} render={({ field }) => ( <FormItem> <FormLabel>المبلغ</FormLabel> <FormControl><Input type="number" {...field} className="h-10 rounded-[10px]" /></FormControl> <FormMessage /> </FormItem> )} />
                                            <FormField name="bankName" control={depositForm.control} render={({ field }) => ( <FormItem> <FormLabel>البنك</FormLabel> <Select onValueChange={field.onChange} value={field.value || ''} dir="rtl"> <FormControl><SelectTrigger className="h-10 rounded-[10px]"> <SelectValue placeholder="اختر البنك..." /> </SelectTrigger></FormControl> <SelectContent> {(bankAccounts || []).map(bank => ( <SelectItem key={bank.id} value={bank.bankName}>{bank.bankName}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                                            <FormField name="referenceNumber" control={depositForm.control} render={({ field }) => ( <FormItem> <FormLabel>رقم السند</FormLabel> <FormControl><Input {...field} className="h-10 rounded-[10px]" /></FormControl> <FormMessage /> </FormItem> )} />
                                            <FormField name="receiptImageUrl" control={depositForm.control} render={({ field }) => ( <FormItem> <FormLabel>رابط صورة السند (اختياري)</FormLabel> <FormControl><Input {...field} value={field.value || ''} className="h-10 rounded-[10px]" placeholder="https://..." dir="ltr"/></FormControl> <ImagePreview url={field.value} /> <FormMessage /> </FormItem> )} />
                                        </CardContent>
                                        <CardFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'تأكيد الإيداع'}</Button></CardFooter>
                                    </Card>
                                </form>
                            </Form>
                        </div>
                        <div className="space-y-6">
                           <Card className="shadow-md">
                                <CardHeader><CardTitle className="flex items-center gap-2"><Wallet/>الرصيد الحالي</CardTitle></CardHeader>
                                <CardContent>
                                    {isLoadingWallet ? <Loader2 className="animate-spin"/> : <p className="text-4xl font-extrabold">{userWallet?.cashBalance?.toLocaleString('en-US') || 0} <span className="text-base font-normal text-muted-foreground">ر.ي</span></p>}
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>إجراءات التحكم</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <h4 className="font-semibold">تجميد الحساب</h4>
                                            <p className="text-xs text-muted-foreground">منع العميل من استخدام رصيده.</p>
                                        </div>
                                        <Switch dir="ltr" checked={!foundClient.is_active} onCheckedChange={handleToggleActive} />
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild><Button variant="destructive" className="w-full"><BadgeCent/>استرجاع رصيد</Button></DialogTrigger>
                                        <DialogContent dir="rtl">
                                            <DialogHeader><DialogTitle>استرجاع رصيد من المحفظة</DialogTitle><DialogDescription>سيتم خصم المبلغ من رصيد العميل وتسجيل العملية كسجل استرجاع.</DialogDescription></DialogHeader>
                                            <Form {...refundForm}>
                                                <form onSubmit={refundForm.handleSubmit(async (values) => { const success = await onRefundSubmit(values); if(success) { (document.querySelector('[data-radix-dialog-close-refund]') as HTMLElement)?.click() } })} className="space-y-4">
                                                    <FormField name="amount" control={refundForm.control} render={({ field }) => ( <FormItem> <FormLabel>المبلغ المراد استرجاعه</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                                    <FormField name="reason" control={refundForm.control} render={({ field }) => ( <FormItem> <FormLabel>سبب الاسترجاع</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                                    <DialogFooter className="gap-2 flex-row-reverse sm:justify-start">
                                                        <Button type="submit" variant="destructive" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'تأكيد الاسترجاع'}</Button>
                                                        <DialogClose asChild><button type="button" data-radix-dialog-close-refund style={{display:'none'}}>close</button></DialogClose>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="log" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>سجل العمليات لـ {foundClient.name}</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                <Input placeholder="ابحث في الملاحظات أو رقم السند..." value={logFilters.searchTerm} onChange={e => setLogFilters(f => ({ ...f, searchTerm: e.target.value }))} className="w-full sm:w-auto flex-grow" />
                                <Select value={logFilters.type} onValueChange={v => setLogFilters(f => ({...f, type: v}))}>
                                    <SelectTrigger className="w-full sm:w-48"><div className="flex items-center gap-2"><Filter/> <SelectValue /></div></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل الأنواع</SelectItem>
                                        <SelectItem value="deposit">إيداع</SelectItem>
                                        <SelectItem value="withdrawal">سحب</SelectItem>
                                        <SelectItem value="payment">دفع</SelectItem>
                                        <SelectItem value="refund">استرجاع</SelectItem>
                                        <SelectItem value="adjustment">تعديل</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center"><div className="flex items-center justify-center gap-2"><Calendar className="h-4 w-4" />التاريخ</div></TableHead>
                                        <TableHead className="text-center"><div className="flex items-center justify-center gap-2"><ListChecks className="h-4 w-4" />النوع</div></TableHead>
                                        <TableHead className="text-center"><div className="flex items-center justify-center gap-2"><CircleDollarSign className="h-4 w-4" />المبلغ</div></TableHead>
                                        <TableHead className="text-center"><div className="flex items-center justify-center gap-2"><Wallet className="h-4 w-4" />الرصيد الجديد</div></TableHead>
                                        <TableHead className="text-center">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingTransactions ? (
                                        <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                                    ) : filteredTransactions && filteredTransactions.length > 0 ? (
                                        filteredTransactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="text-center font-mono">{tx.createdAt ? format(tx.createdAt.toDate(), 'd MMM yyyy, h:mm a', {locale: ar}) : '...'}</TableCell>
                                                <TableCell className="text-center"><Badge variant={tx.type === 'deposit' ? 'default' : 'secondary'}>{tx.type}</Badge></TableCell>
                                                <TableCell className={cn("text-center font-mono", tx.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                                                    {tx.amount > 0 ? `+${tx.amount.toLocaleString('en-US')}` : tx.amount.toLocaleString('en-US')}
                                                </TableCell>
                                                <TableCell className="text-center font-mono">{tx.newBalance.toLocaleString('en-US')}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="sm" onClick={() => setDetailsDialogState({ isOpen: true, transaction: tx })}>
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">لا توجد عمليات لهذه المحفظة.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
          </>
        )}
        <Dialog open={detailsDialogState.isOpen} onOpenChange={(isOpen) => setDetailsDialogState({ isOpen, transaction: isOpen ? detailsDialogState.transaction : null })}>
            <DialogContent dir="rtl" className="max-w-lg rounded-xl [&>button]:right-auto [&>button]:left-4">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileText className="text-primary"/>
                        تفاصيل العملية المالية
                    </DialogTitle>
                    <DialogDescription className="text-right">عرض تفصيلي لبيانات العملية المسجلة.</DialogDescription>
                </DialogHeader>
                {detailsDialogState.transaction && (
                    <div className="py-4 space-y-4 text-sm">
                        <Card className="bg-muted/50">
                            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="text-muted-foreground">التاريخ والوقت</div>
                                        <div className="font-semibold">{format(detailsDialogState.transaction.createdAt.toDate(), 'd MMMM yyyy, h:mm a', {locale: ar})}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ListChecks className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="text-muted-foreground">نوع العملية</div>
                                        <div><Badge variant={detailsDialogState.transaction.type === 'deposit' ? 'default' : 'secondary'}>{detailsDialogState.transaction.type}</Badge></div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CircleDollarSign className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="text-muted-foreground">المبلغ</div>
                                        <div className={cn("font-bold font-mono text-lg", detailsDialogState.transaction.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                                            {detailsDialogState.transaction.amount > 0 ? `+${detailsDialogState.transaction.amount.toLocaleString('en-US')}` : detailsDialogState.transaction.amount.toLocaleString('en-US')} ر.ي
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Wallet className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="text-muted-foreground">الرصيد الجديد</div>
                                        <div className="font-bold font-mono text-lg">{detailsDialogState.transaction.newBalance.toLocaleString('en-US')} ر.ي</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardContent className="p-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="text-muted-foreground">الملاحظات</div>
                                        <div className="font-semibold">{detailsDialogState.transaction.notes}</div>
                                    </div>
                                </div>
                                {detailsDialogState.transaction.bankDetails && (
                                    <div className="border-t pt-4 mt-4 space-y-4">
                                        <h4 className="font-bold flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/> تفاصيل بنكية</h4>
                                        <div className="flex items-start gap-3">
                                            <Building className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                            <div>
                                                <div className="text-muted-foreground">البنك</div>
                                                <div className="font-semibold">{detailsDialogState.transaction.bankDetails.bankName}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Hash className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                            <div>
                                                <div className="text-muted-foreground">رقم السند</div>
                                                <div className="font-semibold">{detailsDialogState.transaction.bankDetails.referenceNumber}</div>
                                            </div>
                                        </div>
                                        {detailsDialogState.transaction.bankDetails.receiptImageUrl && (
                                            <div className="flex items-start gap-3">
                                                <Paperclip className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                                <div>
                                                    <div className="text-muted-foreground">صورة السند</div>
                                                    <ImagePreview url={detailsDialogState.transaction.bankDetails.receiptImageUrl} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    );
}