'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import CouponsLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Ticket, Percent, CircleDollarSign, ArrowDownNarrowWide, CalendarIcon, Globe, Store as StoreIcon, ShoppingBasket, Activity, Tag, MoreHorizontal, Info, Power, CheckCircle, XCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Store } from '../stores/page';
import type { Product } from '../products/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

// Zod Schema
const couponSchema = z.object({
  code: z.string().min(4, { message: "الكود يجب أن يكون 4 أحرف على الأقل" }),
  discountType: z.enum(['percentage', 'fixed'], { required_error: "نوع الخصم مطلوب" }),
  value: z.coerce.number().min(0.01, { message: "القيمة يجب أن تكون أكبر من صفر" }),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).default(0),
  expiryDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
  maxUses: z.coerce.number().min(1, { message: "يجب تحديد عدد مرات الاستخدام" }),
  scope: z.enum(['global', 'stores', 'products'], { required_error: "يجب تحديد نطاق الكوبون" }),
  storeIds: z.array(z.string()).optional().default([]),
  productIds: z.array(z.string()).optional().default([]),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.scope === 'stores' && (!data.storeIds || data.storeIds.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['storeIds'], message: 'يجب اختيار متجر واحد على الأقل' });
    }
    if (data.scope === 'products' && (!data.productIds || data.productIds.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['productIds'], message: 'يجب اختيار منتج واحد على الأقل' });
    }
});

// Types
type CouponFormValues = z.infer<typeof couponSchema>;
type Coupon = Omit<CouponFormValues, 'expiryDate'> & { 
  id: string;
  currentUses: number;
  expiryDate: Timestamp; 
};

// Default expiry date (30 days from now)
const defaultDate = new Date();
defaultDate.setDate(defaultDate.getDate() + 30);

const defaultFormValues: CouponFormValues = {
    code: '',
    discountType: 'percentage',
    value: 10,
    minOrderAmount: 0,
    maxDiscount: 0,
    expiryDate: defaultDate,
    maxUses: 100,
    scope: 'global',
    storeIds: [],
    productIds: [],
    isActive: true,
};

export default function CouponsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [customSearch, setCustomSearch] = useState('');
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema),
        defaultValues: defaultFormValues,
    });
    
    const scope = form.watch('scope');
    const discountType = form.watch('discountType');
    const selectedStoreIds = form.watch('storeIds') || [];
    const selectedProductIds = form.watch('productIds') || [];


    const { data: coupons, isLoading: isLoadingCoupons } = useCollection<Coupon>(useMemoFirebase(() => firestore ? collection(firestore, 'coupons') : null, [firestore]));
    const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]));
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]));

    const filteredStores = useMemo(() =>
        (stores || []).filter(s => s.name.toLowerCase().includes(customSearch.toLowerCase())),
        [stores, customSearch]
    );
    const filteredProducts = useMemo(() =>
        (products || []).filter(p => p.name.toLowerCase().includes(customSearch.toLowerCase())),
        [products, customSearch]
    );

    const activeCoupons = useMemo(() => coupons?.filter(c => c.isActive).length || 0, [coupons]);
    const totalUses = useMemo(() => coupons?.reduce((acc, c) => acc + (c.currentUses || 0), 0) || 0, [coupons]);

    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedCoupon(null);
        form.reset(defaultFormValues);
        setIsDialogOpen(true);
    };

    const handleEdit = (coupon: Coupon) => {
        setIsEditing(true);
        setSelectedCoupon(coupon);
        form.reset({
            ...coupon,
            expiryDate: coupon.expiryDate?.toDate() || defaultDate,
            minOrderAmount: coupon.minOrderAmount || 0,
            maxDiscount: coupon.maxDiscount || 0,
            storeIds: coupon.storeIds || [],
            productIds: coupon.productIds || [],
            isActive: coupon.isActive ?? true,
        });
        setIsDialogOpen(true);
    };
    
    const handleDuplicate = (coupon: Coupon) => {
        setIsEditing(false);
        setSelectedCoupon(null);
        form.reset({
            ...coupon,
            code: `${coupon.code}-COPY`,
            expiryDate: coupon.expiryDate?.toDate() || defaultDate,
            minOrderAmount: coupon.minOrderAmount || 0,
            maxDiscount: coupon.maxDiscount || 0,
            storeIds: coupon.storeIds || [],
            productIds: coupon.productIds || [],
            isActive: coupon.isActive ?? true,
        });
        setIsDialogOpen(true);
    }

    const handleDelete = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedCoupon && firestore) {
            deleteDocumentNonBlocking(doc(firestore, 'coupons', selectedCoupon.id));
            toast({ title: "تم حذف الكوبون بنجاح" });
            setIsAlertOpen(false);
        }
    };

    const handleStatusChange = (coupon: Coupon, isActive: boolean) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'coupons', coupon.id), { isActive });
        toast({ title: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الكوبون` });
    };

    const onSubmit = (values: CouponFormValues) => {
        if (!firestore) return;
        const dataToSave = { ...values, updatedAt: serverTimestamp() };
        if (isEditing && selectedCoupon) {
            updateDocumentNonBlocking(doc(firestore, 'coupons', selectedCoupon.id), dataToSave);
            toast({ title: "تم تحديث الكوبون بنجاح" });
        } else {
            addDocumentNonBlocking(collection(firestore, 'coupons'), { ...dataToSave, createdAt: serverTimestamp(), currentUses: 0 });
            toast({ title: "تمت إضافة الكوبون بنجاح" });
        }
        setIsDialogOpen(false);
    };

    const isLoading = isLoadingCoupons || isLoadingStores || isLoadingProducts;
    if (isLoading) return <CouponsLoading />;

    const ScopeIcon = ({ scope, className }: { scope: Coupon['scope'], className?: string }) => {
        switch (scope) {
            case 'global': return <Globe className={cn("h-4 w-4", className)} />;
            case 'stores': return <StoreIcon className={cn("h-4 w-4", className)} />;
            case 'products': return <ShoppingBasket className={cn("h-4 w-4", className)} />;
            default: return <Info className={cn("h-4 w-4", className)} />;
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الكوبونات النشطة</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeCoupons}</div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي الاستخدامات</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalUses.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>إدارة الكوبونات</CardTitle>
                                <CardDescription>إضافة وتعديل وحذف الكوبونات والعروض.</CardDescription>
                            </div>
                            <Button onClick={handleAddNew}><PlusCircle /> إضافة كوبون</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">الكود</TableHead>
                                        <TableHead className="text-center">القيمة</TableHead>
                                        <TableHead className="text-center">النطاق</TableHead>
                                        <TableHead className="text-center">تاريخ الانتهاء</TableHead>
                                        <TableHead className="text-center">الحالة</TableHead>
                                        <TableHead className="text-center">إجراء</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons?.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="text-center font-mono"><Badge variant="secondary">{c.code}</Badge></TableCell>
                                            <TableCell className="text-center font-semibold">{c.value}{c.discountType === 'percentage' ? '%' : ' ر.ي'}</TableCell>
                                            <TableCell className="text-center"><Badge variant="outline" className='gap-1.5'><ScopeIcon scope={c.scope}/> {c.scope}</Badge></TableCell>
                                            <TableCell className="text-center text-muted-foreground">{format(c.expiryDate.toDate(), "d MMMM yyyy", { locale: ar })}</TableCell>
                                            <TableCell className="text-center">
                                                 <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'نشط' : 'غير نشط'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal/></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(c)}><Edit/> تعديل</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicate(c)}><PlusCircle/> تكرار</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(c)} className="text-destructive"><Trash/> حذف</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">{isEditing ? 'تعديل كوبون' : 'إضافة كوبون جديد'}</DialogTitle>
                        <DialogDescription className="text-right">أدخل تفاصيل الكوبون.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Tabs defaultValue="basic" className="w-full" dir="rtl">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                                    <TabsTrigger value="scope">نطاق الكوبون</TabsTrigger>
                                </TabsList>
                                <TabsContent value="basic" className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="code" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Tag/>كود الكوبون</FormLabel>
                                                <FormControl><Input {...field} /></FormControl><FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="discountType" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    {discountType === 'percentage' ? <Percent/> : <CircleDollarSign/>}
                                                    نوع الخصم
                                                </FormLabel>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="grid grid-cols-2 gap-2 pt-1"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0 space-x-reverse">
                                                        <FormControl><RadioGroupItem value="percentage" /></FormControl>
                                                        <FormLabel className="font-normal">نسبة مئوية</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0 space-x-reverse">
                                                        <FormControl><RadioGroupItem value="fixed" /></FormControl>
                                                        <FormLabel className="font-normal">مبلغ ثابت</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                                <FormMessage/>
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="value" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><CircleDollarSign/>قيمة الخصم</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl><FormMessage />
                                            </FormItem>
                                        )}/>
                                        {discountType === 'percentage' && (
                                        <FormField control={form.control} name="maxDiscount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><ArrowDownNarrowWide/>الحد الأعلى للخصم (ر.ي)</FormLabel>
                                                <FormControl><Input type="number" {...field} placeholder="0 (يعني لا يوجد حد)" /></FormControl><FormMessage />
                                            </FormItem>
                                        )}/>
                                        )}
                                        <FormField control={form.control} name="minOrderAmount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><ArrowDownNarrowWide/>الحد الأدنى للطلب (ر.ي)</FormLabel>
                                                <FormControl><Input type="number" {...field} placeholder="0 (يعني لا يوجد حد)" /></FormControl><FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="maxUses" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Ticket/>إجمالي مرات الاستخدام</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl><FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="expiryDate"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2"><CalendarIcon />تاريخ الانتهاء</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="date"
                                                            value={
                                                                field.value instanceof Date 
                                                                ? format(field.value, 'yyyy-MM-dd') 
                                                                : ''
                                                            }
                                                            onChange={(e) => {
                                                                const date = new Date(e.target.value);
                                                                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                                                field.onChange(new Date(date.getTime() + userTimezoneOffset));
                                                            }}
                                                            className="w-full text-left"
                                                            dir="ltr"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>سيتم تعطيل الكوبون بعد هذا التاريخ.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="isActive"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Power />حالة الكوبون</FormLabel>
                                                <FormDescription>
                                                    اختر ما إذا كان الكوبون فعالاً.
                                                </FormDescription>
                                                <FormControl>
                                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                                        <Button
                                                            type="button"
                                                            variant={field.value ? 'default' : 'outline'}
                                                            onClick={() => field.onChange(true)}
                                                        >
                                                            <CheckCircle />
                                                            نشط
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={!field.value ? 'destructive' : 'outline'}
                                                            onClick={() => field.onChange(false)}
                                                        >
                                                            <XCircle />
                                                            غير نشط
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                   </div>
                                </TabsContent>
                                <TabsContent value="scope" className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                                   <FormField control={form.control} name="scope" render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="flex items-center gap-2"><ScopeIcon scope={scope}/>نطاق الكوبون</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setCustomSearch('');
                                                    }}
                                                    value={field.value}
                                                    className="space-y-2"
                                                >
                                                    <FormItem className="flex items-center space-x-3 space-y-0 space-x-reverse">
                                                        <FormControl><RadioGroupItem value="global" /></FormControl>
                                                        <FormLabel className="font-normal">عام (على كل التطبيق)</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 space-x-reverse">
                                                        <FormControl><RadioGroupItem value="stores" /></FormControl>
                                                        <FormLabel className="font-normal">متاجر محددة</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 space-x-reverse">
                                                        <FormControl><RadioGroupItem value="products" /></FormControl>
                                                        <FormLabel className="font-normal">منتجات محددة</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    
                                    {(scope === 'stores' || scope === 'products') && (
                                        <div className="space-y-2 pt-4">
                                            <div className="relative">
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={`ابحث عن ${scope === 'stores' ? 'متجر' : 'منتج'}...`}
                                                    className="pr-10"
                                                    value={customSearch}
                                                    onChange={(e) => setCustomSearch(e.target.value)}
                                                />
                                            </div>
                                            <ScrollArea className="h-48 rounded-md border p-2">
                                                <div className="space-y-1">
                                                    {(scope === 'stores' ? filteredStores : filteredProducts).map(item => (
                                                        <FormField
                                                            key={item.id}
                                                            control={form.control}
                                                            name={scope === 'stores' ? 'storeIds' : 'productIds'}
                                                            render={() => (
                                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 space-x-reverse p-2 hover:bg-muted rounded-md transition-colors">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={(scope === 'stores' ? selectedStoreIds : selectedProductIds).includes(item.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                const currentIds = scope === 'stores' ? selectedStoreIds : selectedProductIds;
                                                                                const newIds = checked
                                                                                    ? [...currentIds, item.id]
                                                                                    : currentIds.filter(id => id !== item.id);
                                                                                form.setValue(scope === 'stores' ? 'storeIds' : 'productIds', newIds, { shouldValidate: true });
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal flex-1 cursor-pointer">
                                                                        {item.name}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                {(scope === 'stores' && filteredStores.length === 0) && <p className="text-center text-sm text-muted-foreground py-4">لا توجد متاجر مطابقة.</p>}
                                                {(scope === 'products' && filteredProducts.length === 0) && <p className="text-center text-sm text-muted-foreground py-4">لا توجد منتجات مطابقة.</p>}
                                            </ScrollArea>
                                            <FormMessage>{scope === 'stores' ? form.formState.errors.storeIds?.message : form.formState.errors.productIds?.message}</FormMessage>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                            <DialogFooter className="pt-4 flex-row-reverse sm:justify-start gap-2">
                                <Button type="submit">حفظ الكوبون</Button>
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>هذا الإجراء سيحذف الكوبون بشكل دائم.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter  className="flex-row-reverse sm:justify-start gap-2">
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    
