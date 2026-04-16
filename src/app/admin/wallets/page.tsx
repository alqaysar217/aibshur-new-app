'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import WalletsLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Search, User, Phone, BadgeCent, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Client } from '../users/page';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import type { BankAccount } from '../bank-accounts/page';
import { depositToWallet } from '@/ai/flows/deposit-wallet-flow';
import { refundFromWallet } from '@/ai/flows/refund-wallet-flow';


// Types
type UserWallet = {
    id: string;
    userId: string;
    pointsBalance: number;
    cashBalance: number;
};
type WalletTransaction = {
    id: string;
    userId: string;
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'adjustment';
    amount: number;
    newBalance: number;
    notes?: string;
    relatedOrderId?: string;
    bankDetails?: { bankName: string; referenceNumber: string; receiptImageUrl?: string; };
    createdAt: Timestamp;
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

    const { toast } = useToast();
    const firestore = useFirestore();

    // Data Fetching
    const { data: clientData, isLoading: isLoadingClientCollection } = useCollection<Client>(useMemoFirebase(() => (firestore && debouncedSearchTerm) ? query(collection(firestore, 'clients'), where('phone', '==', debouncedSearchTerm)) : null, [firestore, debouncedSearchTerm]));
    const { data: userWallet, isLoading: isLoadingWallet } = useDoc<UserWallet>(useMemoFirebase(() => (firestore && foundClient) ? doc(firestore, 'users', foundClient.id, 'wallet', 'main') : null, [firestore, foundClient]));
    const { data: bankAccounts, isLoading: isLoadingBanks } = useCollection<BankAccount>(useMemoFirebase(() => firestore ? collection(firestore, 'bankAccounts') : null, [firestore]));

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
        // This will trigger the useEffect for debouncing
        setDebouncedSearchTerm(searchTerm);
    };

    const handleToggleActive = async () => {
        if (!foundClient || !firestore) return;
        const newStatus = !foundClient.is_active;
        await updateDocumentNonBlocking(doc(firestore, 'clients', foundClient.id), { is_active: newStatus });
        setFoundClient(c => c ? { ...c, is_active: newStatus } : null);
        toast({ title: newStatus ? "تم تفعيل الحساب" : "تم تجميد الحساب" });
    };

    const onDepositSubmit = async (values: z.infer<typeof depositSchema>) => {
        if (!firestore || !foundClient) return;
        setIsSubmitting(true);
        try {
            const result = await depositToWallet({
                clientId: foundClient.id,
                amount: values.amount,
                bankName: values.bankName,
                referenceNumber: values.referenceNumber,
                receiptImageUrl: values.receiptImageUrl,
            });

            if (result.success) {
                toast({ title: "تم الإيداع بنجاح", description: `تمت إضافة ${values.amount} ر.ي إلى محفظة ${foundClient.name}.` });
                depositForm.reset();
            } else {
                throw new Error(result.message);
            }
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: "خطأ", description: e.message || "فشلت عملية الإيداع." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const onRefundSubmit = async (values: z.infer<typeof refundSchema>) => {
        if (!firestore || !foundClient) return false;
        setIsSubmitting(true);
        try {
            const result = await refundFromWallet({
                clientId: foundClient.id,
                amount: values.amount,
                reason: values.reason,
            });

            if (result.success) {
                toast({ title: "تم الاسترجاع بنجاح" });
                refundForm.reset();
                return true; // To close dialog
            } else {
                throw new Error(result.message);
            }
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: "خطأ", description: e.message });
            return false; // To keep dialog open
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
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Form {...depositForm}>
                <form onSubmit={depositForm.handleSubmit(onDepositSubmit)}>
                    <Card>
                    <CardHeader><CardTitle>إضافة رصيد جديد</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField name="amount" control={depositForm.control} render={({ field }) => ( <FormItem> <FormLabel>المبلغ</FormLabel> <FormControl><Input type="number" {...field} className="h-10 rounded-[10px]" /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField
                            name="bankName"
                            control={depositForm.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>البنك</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''} dir="rtl">
                                        <FormControl><SelectTrigger className="h-10 rounded-[10px]">
                                                <SelectValue placeholder="اختر البنك..." />
                                            </SelectTrigger></FormControl>
                                        <SelectContent>
                                            {(bankAccounts || []).map(bank => (
                                                <SelectItem key={bank.id} value={bank.bankName}>{bank.bankName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField name="referenceNumber" control={depositForm.control} render={({ field }) => ( <FormItem> <FormLabel>رقم السند</FormLabel> <FormControl><Input {...field} className="h-10 rounded-[10px]" /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField name="receiptImageUrl" control={depositForm.control} render={({ field }) => ( 
                            <FormItem> 
                                <FormLabel>رابط صورة السند (اختياري)</FormLabel> 
                                <FormControl><Input {...field} value={field.value || ''} className="h-10 rounded-[10px]" placeholder="https://..." dir="ltr"/></FormControl>
                                <ImagePreview url={field.value} />
                                <FormMessage /> 
                            </FormItem> 
                        )} />
                    </CardContent>
                    <CardFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'تأكيد الإيداع'}</Button></CardFooter>
                    </Card>
                </form>
                </Form>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><User/>بيانات العميل</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><strong>الاسم:</strong> {foundClient.name}</p>
                        <p><strong>الهاتف:</strong> {foundClient.phone}</p>
                        <div className="flex items-center gap-2"><strong>الحالة:</strong><Badge variant={foundClient.is_active ? 'default' : 'destructive'}>{foundClient.is_active ? 'نشط' : 'محظور'}</Badge></div>
                    </CardContent>
                </Card>
                <Card className="shadow-md">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Wallet/>الرصيد الحالي</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingWallet ? <Loader2 className="animate-spin"/> : <p className="text-4xl font-extrabold">{userWallet?.cashBalance?.toLocaleString() || 0} <span className="text-base font-normal text-muted-foreground">ر.ي</span></p>}
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
                            <Switch checked={!foundClient.is_active} onCheckedChange={handleToggleActive} />
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
        )}
      </div>
    );
}
