'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, query, where, Timestamp, runTransaction } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import LoyaltyLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Star, Scale, Inbox, History, Search, Check, X, Calendar, Filter, Wand2, CircleDollarSign, Hash, Settings, Repeat, TrendingUp, Sparkles, Package, Award, CalendarDays, ArrowRightLeft, ListChecks, User, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Client } from '../users/page';

// Schemas
const dayMultiplierSchema = z.object({
  day: z.enum(["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]),
  multiplier: z.coerce.number().min(1, "المضاعف يجب أن يكون 1 أو أكثر"),
});

const loyaltyRuleSchema = z.discriminatedUnion("strategy", [
  z.object({
    strategy: z.literal("order_value"),
    basePointsRatio: z.coerce.number().min(1, "يجب تحديد قيمة أكبر من صفر (مثال: 1000)"),
    valueThreshold: z.coerce.number().min(0, "لا يمكن أن يكون سالبًا").optional(),
    valueMultiplier: z.coerce.number().min(1, "يجب أن يكون 1 أو أكثر").optional(),
    conversionRate: z.coerce.number().min(0.01, "يجب تحديد قيمة أكبر من صفر"),
    dayMultipliers: z.array(dayMultiplierSchema),
  }),
  z.object({
    strategy: z.literal("order_count"),
    ordersForPoints: z.coerce.number().min(1, "يجب أن يكون عدد الطلبات 1 أو أكثر"),
    pointsPerOrderSet: z.coerce.number().min(1, "يجب أن تكون النقاط 1 أو أكثر"),
    conversionRate: z.coerce.number().min(0.01, "يجب تحديد قيمة أكبر من صفر"),
    dayMultipliers: z.array(dayMultiplierSchema),
  }),
]);


const manualConversionSchema = z.object({
    clientId: z.string(),
    points: z.coerce.number().min(1, "الرجاء إدخال عدد النقاط"),
    notes: z.string().min(5, "الرجاء كتابة ملاحظة (5 أحرف على الأقل)"),
});

// Types
type LoyaltyRule = z.infer<typeof loyaltyRuleSchema>;
type PointRequest = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  pointsToRedeem: number;
  amountInYER: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
};
type UserWallet = {
    id: string;
    userId: string;
    pointsBalance: number;
    cashBalance: number;
}
type LoyaltyLog = {
    id: string;
    userId: string;
    type: 'earn' | 'redeem_request' | 'redeem_manual' | 'manual_add' | 'manual_deduct' | 'correction';
    points: number;
    newPointsBalance: number;
    notes?: string;
    createdAt: Timestamp;
}

const arabicDays = { saturday: "السبت", sunday: "الأحد", monday: "الإثنين", tuesday: "الثلاثاء", wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة" };

export default function LoyaltyPage() {
    const [alertState, setAlertState] = useState<{ isOpen: boolean, data: PointRequest | null, type: 'approve' | 'reject' | null }>({ isOpen: false, data: null, type: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [logFilters, setLogFilters] = useState<{ type: string, dateRange: { from?: Date, to?: Date } }>({ type: 'all', dateRange: {} });
    
    const { toast } = useToast();
    const firestore = useFirestore();

    // Data Fetching
    const rulesQuery = useMemoFirebase(() => firestore ? doc(firestore, 'loyaltyRules', 'main_rules') : null, [firestore]);
    const { data: rules, isLoading: isLoadingRules } = useDoc<LoyaltyRule>(rulesQuery);
    
    const requestsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'point_requests'), where('status', '==', 'pending')) : null, [firestore]);
    const { data: requests, isLoading: isLoadingRequests } = useCollection<PointRequest>(requestsQuery);

    const clientQuery = useMemoFirebase(() => (firestore && debouncedSearchTerm) ? query(collection(firestore, 'clients'), where('phone', '==', debouncedSearchTerm)) : null, [firestore, debouncedSearchTerm]);
    const { data: foundClients } = useCollection<Client>(clientQuery);

    const walletQuery = useMemoFirebase(() => (firestore && foundClient) ? doc(firestore, 'users', foundClient.id, 'wallet', 'main') : null, [firestore, foundClient]);
    const { data: userWallet } = useDoc<UserWallet>(walletQuery);
    
    const logsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'loyaltyLogs') : null, [firestore]);
    const { data: allLogs, isLoading: isLoadingLogs } = useCollection<LoyaltyLog>(logsQuery);
    
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
    const clientsMap = useMemo(() => clients?.reduce((acc, c) => ({...acc, [c.id]: c.name}), {}) || {}, [clients]);
    
    // Forms
    const rulesForm = useForm<LoyaltyRule>({
      resolver: zodResolver(loyaltyRuleSchema),
      defaultValues: {
        strategy: 'order_value',
        basePointsRatio: 1000,
        valueThreshold: 0,
        valueMultiplier: 1,
        ordersForPoints: 5,
        pointsPerOrderSet: 10,
        conversionRate: 0.5,
        dayMultipliers: [],
      }
    });
    const { fields, append, remove } = useFieldArray({ control: rulesForm.control, name: "dayMultipliers" });
    const manualConversionForm = useForm<z.infer<typeof manualConversionSchema>>({
      resolver: zodResolver(manualConversionSchema),
      defaultValues: { clientId: '', points: 0, notes: '' }
    });

    const strategy = rulesForm.watch('strategy');

    // Effects
    useEffect(() => { if (rules) rulesForm.reset(rules); }, [rules, rulesForm]);
    useEffect(() => { const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500); return () => clearTimeout(handler); }, [searchTerm]);
    useEffect(() => { if (foundClients && foundClients.length > 0) { setFoundClient(foundClients[0]); manualConversionForm.setValue('clientId', foundClients[0].id); } else { setFoundClient(null); } }, [foundClients, manualConversionForm]);
    
    const filteredLogs = useMemo(() => {
        return (allLogs || []).filter(log => {
            const matchesType = logFilters.type === 'all' || log.type === logFilters.type;
            const logDate = log.createdAt.toDate();
            const matchesDate = (!logFilters.dateRange.from || logDate >= logFilters.dateRange.from) && (!logFilters.dateRange.to || logDate <= logFilters.dateRange.to);
            return matchesType && matchesDate;
        }).sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    }, [allLogs, logFilters]);


    // Handlers
    const onRulesSubmit = (values: LoyaltyRule) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'loyaltyRules', 'main_rules'), values);
        toast({ title: 'تم تحديث قواعد الولاء بنجاح' });
    };

    const handleRequestAction = (request: PointRequest, type: 'approve' | 'reject') => {
        setAlertState({ isOpen: true, data: request, type });
    };

    const confirmRequestAction = async () => {
        if (!alertState.data || !alertState.type || !firestore) return;
        const { data: request, type } = alertState;

        const newStatus = type === 'approve' ? 'approved' : 'rejected';
        const requestRef = doc(firestore, 'point_requests', request.id);
        
        try {
            if (type === 'approve') {
                await runTransaction(firestore, async (transaction) => {
                    const walletRef = doc(firestore, 'users', request.userId, 'wallet', 'main');
                    const walletDoc = await transaction.get(walletRef);
                    if (!walletDoc.exists()) throw new Error("Wallet not found!");

                    const currentPoints = walletDoc.data().pointsBalance || 0;
                    const currentCash = walletDoc.data().cashBalance || 0;
                    if (currentPoints < request.pointsToRedeem) throw new Error("Insufficient points!");

                    transaction.update(walletRef, {
                        pointsBalance: currentPoints - request.pointsToRedeem,
                        cashBalance: currentCash + request.amountInYER,
                    });
                    transaction.update(requestRef, { status: newStatus, processedAt: serverTimestamp() });
                });
            } else {
                 await updateDocumentNonBlocking(requestRef, { status: newStatus, processedAt: serverTimestamp() });
            }
             toast({ title: `تم ${type === 'approve' ? 'قبول' : 'رفض'} الطلب بنجاح` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'حدث خطأ', description: error.message });
        }
        setAlertState({ isOpen: false, data: null, type: null });
    };

    const onManualConversionSubmit = async (values: z.infer<typeof manualConversionSchema>) => {
        if (!firestore || !foundClient || !userWallet || !rules) return;
        
        const conversionAmount = values.points * rules.conversionRate;

        try {
            await runTransaction(firestore, async (transaction) => {
                const walletRef = doc(firestore, 'users', foundClient.id, 'wallet', 'main');
                const walletDoc = await transaction.get(walletRef);
                if (!walletDoc.exists()) throw new Error("Wallet not found!");
                
                const currentPoints = walletDoc.data().pointsBalance || 0;
                if (currentPoints < values.points) throw new Error("نقاط العميل غير كافية!");
                
                transaction.update(walletRef, {
                    pointsBalance: currentPoints - values.points
                });

                const logRef = doc(collection(firestore, 'loyaltyLogs'));
                transaction.set(logRef, {
                    userId: foundClient.id,
                    type: 'redeem_manual',
                    points: -values.points,
                    newPointsBalance: currentPoints - values.points,
                    notes: `تحويل يدوي: ${conversionAmount.toLocaleString()} ر.ي. ${values.notes}`,
                    createdAt: serverTimestamp(),
                });
            });
            toast({title: 'تم التحويل بنجاح', description: `تم خصم ${values.points} نقطة من ${foundClient.name}.`});
            manualConversionForm.reset({ clientId: '', points: 0, notes: '' });
            setSearchTerm('');
            setFoundClient(null);
        } catch(e: any) {
            toast({variant: 'destructive', title: 'خطأ في التحويل', description: e.message});
        }
    };
    
    const isLoading = isLoadingRules || isLoadingRequests || isLoadingLogs || isLoadingClients;
    if (isLoading) return <LoyaltyLoading />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Star className="h-8 w-8 text-amber-400 fill-amber-300" />
                 <div>
                    <h1 className="text-3xl font-black text-foreground">نظام الولاء الذكي</h1>
                    <p className="text-muted-foreground mt-1">إدارة قواعد احتساب النقاط، طلبات التحويل، والسجلات.</p>
                </div>
            </div>

             <Tabs defaultValue="rules" dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rules" className="gap-2"><Scale/>القواعد</TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2"><Inbox/>طلبات التحويل</TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2"><History/>السجلات والتحويل اليدوي</TabsTrigger>
                </TabsList>
                
                <TabsContent value="rules" className="mt-4">
                    <Form {...rulesForm}>
                        <form onSubmit={rulesForm.handleSubmit(onRulesSubmit)}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Wand2 />محرك قواعد احتساب وصرف النقاط</CardTitle>
                                    <CardDescription>اختر الاستراتيجية المناسبة لعملك واضبط الإعدادات.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={rulesForm.control}
                                        name="strategy"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="flex items-center gap-2"><ListChecks />اختر استراتيجية اكتساب النقاط:</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                    >
                                                    <FormItem className="flex items-center space-x-3 space-y-0 space-x-reverse">
                                                        <FormControl>
                                                            <Card className={cn("p-4 flex-1 cursor-pointer", field.value === 'order_value' && "border-primary ring-2 ring-primary")}>
                                                                <RadioGroupItem value="order_value" id="order_value" className="sr-only"/>
                                                                <FormLabel htmlFor="order_value" className="font-normal cursor-pointer w-full">
                                                                    <div className="flex items-center justify-between">
                                                                         <div className="flex flex-col text-right">
                                                                            <span className="font-bold">على أساس قيمة الطلب</span>
                                                                            <p className="text-muted-foreground text-sm mt-1">
                                                                                مكافأة العملاء بناءً على قيمة مشترياتهم.
                                                                            </p>
                                                                         </div>
                                                                         <CircleDollarSign className="h-8 w-8 text-primary mr-4"/>
                                                                    </div>
                                                                </FormLabel>
                                                            </Card>
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 space-x-reverse">
                                                         <FormControl>
                                                            <Card className={cn("p-4 flex-1 cursor-pointer", field.value === 'order_count' && "border-primary ring-2 ring-primary")}>
                                                                <RadioGroupItem value="order_count" id="order_count" className="sr-only"/>
                                                                <FormLabel htmlFor="order_count" className="font-normal cursor-pointer w-full">
                                                                    <div className="flex items-center justify-between">
                                                                         <div className="flex flex-col text-right">
                                                                            <span className="font-bold">على أساس عدد الطلبات</span>
                                                                            <p className="text-muted-foreground text-sm mt-1">
                                                                                مكافأة ولاء العملاء بناءً على تكرار طلباتهم.
                                                                            </p>
                                                                         </div>
                                                                         <Hash className="h-8 w-8 text-primary mr-4"/>
                                                                    </div>
                                                                </FormLabel>
                                                            </Card>
                                                        </FormControl>
                                                    </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <div className="space-y-4 rounded-lg border p-4">
                                        <h3 className="font-semibold flex items-center gap-2"><Settings/>إعدادات الاستراتيجية المختارة</h3>
                                        {strategy === 'order_value' && (
                                            <div className="space-y-4">
                                                <FormField control={rulesForm.control} name="basePointsRatio" render={({field}) => <FormItem><FormLabel className="flex items-center gap-2"><Repeat/>المعدل الأساسي للنقاط</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>كل كم ريال يساوي 1 نقطة. (مثال: 1000)</FormDescription><FormMessage/></FormItem>} />
                                                <div className="space-y-2">
                                                    <FormLabel className="flex items-center gap-2"><Sparkles/>مضاعف قيمة الطلب (اختياري)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={rulesForm.control} name="valueThreshold" render={({field}) => <FormItem><FormLabel className="text-xs flex items-center gap-1"><TrendingUp/>إذا تجاوز الطلب (ريال)</FormLabel><FormControl><Input type="number" {...field} placeholder="مثال: 5000"/></FormControl><FormMessage/></FormItem>} />
                                                        <FormField control={rulesForm.control} name="valueMultiplier" render={({field}) => <FormItem><FormLabel className="text-xs flex items-center gap-1"><Sparkles/>اضرب النقاط في</FormLabel><FormControl><Input type="number" {...field} placeholder="مثال: 2"/></FormControl><FormMessage/></FormItem>} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {strategy === 'order_count' && (
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <FormField control={rulesForm.control} name="ordersForPoints" render={({field}) => <FormItem><FormLabel className="flex items-center gap-2"><Package/>عدد الطلبات لاكتساب النقاط</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>بعد كل كم طلب يحصل على نقاط؟ (مثال: 5)</FormDescription><FormMessage/></FormItem>} />
                                                <FormField control={rulesForm.control} name="pointsPerOrderSet" render={({field}) => <FormItem><FormLabel className="flex items-center gap-2"><Award/>النقاط المكتسبة</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>كم نقطة يكتسبها؟ (مثال: 10)</FormDescription><FormMessage/></FormItem>} />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-4 rounded-lg border p-4">
                                        <h3 className="font-semibold flex items-center gap-2"><Settings/>الإعدادات العامة</h3>
                                        <FormField control={rulesForm.control} name="conversionRate" render={({field}) => <FormItem><FormLabel className="flex items-center gap-2"><ArrowRightLeft/>سعر صرف النقطة</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormDescription>كل 1 نقطة تساوي كم ريال. (مثال: 0.5)</FormDescription><FormMessage/></FormItem>} />
                                        <div>
                                            <FormLabel className="flex items-center gap-2"><CalendarDays/>مضاعفات الأيام الخاصة</FormLabel>
                                            <div className="space-y-2 mt-2">
                                                {fields.map((item, index) => (
                                                    <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                                        <FormField control={rulesForm.control} name={`dayMultipliers.${index}.day`} render={({field}) => <FormItem className="flex-1"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{Object.entries(arabicDays).map(([key, val]) => <SelectItem key={key} value={key}>{val}</SelectItem>)}</SelectContent></Select></FormItem>}/>
                                                        <FormField control={rulesForm.control} name={`dayMultipliers.${index}.multiplier`} render={({field}) => <FormItem><FormControl><Input type="number" {...field} placeholder="المضاعف (e.g. 2)" /></FormControl></FormItem>}/>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="text-destructive"/></Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" size="sm" onClick={() => append({day: 'friday', multiplier: 2})}><PlusCircle/>إضافة يوم</Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter><Button type="submit">حفظ القواعد</Button></CardFooter>
                            </Card>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="requests" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Inbox/>طلبات تحويل النقاط المعلقة</CardTitle></CardHeader>
                        <CardContent><Table>
                            <TableHeader><TableRow>
                                <TableHead className="text-center">العميل</TableHead>
                                <TableHead className="text-center">نقاط</TableHead>
                                <TableHead className="text-center">مبلغ</TableHead>
                                <TableHead className="text-center">تاريخ الطلب</TableHead>
                                <TableHead className="text-center">إجراء</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>{(requests || [])?.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="flex items-center gap-2 justify-center"><User className="text-muted-foreground"/>{req.userName} ({req.userPhone})</TableCell>
                                    <TableCell className="text-center font-mono">{req.pointsToRedeem}</TableCell>
                                    <TableCell className="text-center font-mono">{req.amountInYER.toLocaleString()} ر.ي</TableCell>
                                    <TableCell className="text-center">{format(req.createdAt.toDate(), 'd MMM yyyy, h:mm a', {locale: ar})}</TableCell>
                                    <TableCell className="text-center space-x-2 space-x-reverse">
                                        <Button size="sm" onClick={() => handleRequestAction(req, 'approve')}><Check/>قبول</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleRequestAction(req, 'reject')}><X/>رفض</Button>
                                    </TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manual" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus />تحويل يدوي لرصيد النقاط</CardTitle></CardHeader>
                         <Form {...manualConversionForm}>
                            <form onSubmit={manualConversionForm.handleSubmit(onManualConversionSubmit)}>
                                <CardContent className="space-y-4">
                                    <FormItem><FormLabel>ابحث عن العميل برقم الهاتف</FormLabel><div className="flex gap-2"><Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="7XXXXXXXX" /><Button type="button"><Search/></Button></div></FormItem>
                                    {foundClient && (
                                        <div className="p-3 bg-primary/10 rounded-lg text-sm space-y-2">
                                            <div className="font-bold">العميل: {foundClient.name}</div>
                                            <div>الرصيد الحالي: <span className="font-bold">{userWallet?.pointsBalance?.toLocaleString() || 0} نقطة</span></div>
                                            {rules && <div>تساوي تقريباً: <span className="font-bold">{( (userWallet?.pointsBalance || 0) * rules.conversionRate ).toLocaleString()} ر.ي</span></div>}
                                        </div>
                                    )}
                                    {foundClient && (<>
                                        <FormField control={manualConversionForm.control} name="points" render={({field}) => <FormItem><FormLabel>النقاط المراد تحويلها</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>}/>
                                        <FormField control={manualConversionForm.control} name="notes" render={({field}) => <FormItem><FormLabel>ملاحظات العملية</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage/></FormItem>}/>
                                    </>)}
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={!foundClient || !manualConversionForm.formState.isValid}>تنفيذ التحويل</Button>
                                </CardFooter>
                            </form>
                         </Form>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><History/>سجلات عمليات الولاء</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-4">
                                <Select value={logFilters.type} onValueChange={v => setLogFilters(f => ({...f, type: v}))}>
                                    <SelectTrigger className="w-48"><div className="flex items-center gap-2"><Filter/> <SelectValue/></div></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل العمليات</SelectItem>
                                        <SelectItem value="earn">اكتساب</SelectItem>
                                        <SelectItem value="redeem_request">طلب تحويل</SelectItem>
                                        <SelectItem value="redeem_manual">تحويل يدوي</SelectItem>
                                        <SelectItem value="manual_add">إضافة يدوية</SelectItem>
                                        <SelectItem value="manual_deduct">خصم يدوي</SelectItem>
                                        <SelectItem value="correction">تصحيح</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" className="w-64 justify-start text-left font-normal gap-2"><CalendarIcon />{logFilters.dateRange.from ? (logFilters.dateRange.to ? `${format(logFilters.dateRange.from, "LLL d, y")} - ${format(logFilters.dateRange.to, "LLL d, y")}` : format(logFilters.dateRange.from, "LLL d, y")) : "تحديد تاريخ"}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="range" selected={logFilters.dateRange} onSelect={(range) => setLogFilters(f => ({...f, dateRange: range || {}}))} numberOfMonths={2}/></PopoverContent>
                                </Popover>
                            </div>
                            <div className="border rounded-lg">
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead className="text-center">التاريخ</TableHead>
                                    <TableHead className="text-center">العميل</TableHead>
                                    <TableHead className="text-center">العملية</TableHead>
                                    <TableHead className="text-center">النقاط</TableHead>
                                    <TableHead className="text-center">الرصيد الجديد</TableHead>
                                    <TableHead className="text-center">ملاحظات</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>{filteredLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-center">{format(log.createdAt.toDate(), 'd MMM, h:mm a', {locale: ar})}</TableCell>
                                        <TableCell className="text-center">{clientsMap[log.userId] || log.userId}</TableCell>
                                        <TableCell className="text-center"><Badge variant="secondary">{log.type}</Badge></TableCell>
                                        <TableCell className={cn("text-center font-mono", log.points > 0 ? 'text-green-600' : 'text-red-600')}>{log.points > 0 && '+'}{log.points.toLocaleString()}</TableCell>
                                        <TableCell className="text-center font-mono">{log.newPointsBalance.toLocaleString()}</TableCell>
                                        <TableCell className="text-center">{log.notes || '—'}</TableCell>
                                    </TableRow>
                                ))}</TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
             </Tabs>

             <AlertDialog open={alertState.isOpen} onOpenChange={(open) => !open && setAlertState({ isOpen: false, data: null, type: null })}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right">
                        <AlertDialogTitle>تأكيد الإجراء</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من {alertState.type === 'approve' ? 'قبول' : 'رفض'} طلب تحويل {alertState.data?.pointsToRedeem} نقطة للعميل {alertState.data?.userName}؟</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                        <AlertDialogAction onClick={confirmRequestAction}>نعم، تأكيد</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
        </div>
    );
}
