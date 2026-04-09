'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import AdsLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Megaphone, Link as LinkIcon, Image as ImageIcon, Store as StoreIcon, ShoppingBasket, HandHeart, CalendarIcon, SortAsc, Check, ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { Store } from '../stores/page';
import type { Product } from '../products/page';
import type { DonationCampaign } from '../donations/page';

// Zod Schema
const adBannerSchema = z.object({
  name: z.string().min(3, { message: "اسم الإعلان مطلوب (3 أحرف على الأقل)" }),
  imageUrl: z.string().url({ message: "الرجاء إدخال رابط صورة صحيح" }),
  displayOrder: z.coerce.number().min(0, { message: "ترتيب الظهور يجب أن يكون رقمًا موجبًا" }),
  isActive: z.boolean().default(true),
  expiryDate: z.date().optional().nullable(),
  actionType: z.enum(['none', 'store', 'product', 'campaign']),
  targetId: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.actionType !== 'none' && !data.targetId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'يجب اختيار وجهة للإعلان' });
    }
});

// Types
type AdBannerFormValues = z.infer<typeof adBannerSchema>;
type AdBanner = Omit<AdBannerFormValues, 'expiryDate'> & { 
  id: string;
  expiryDate?: Timestamp | null;
};

type TargetType = 'store' | 'product' | 'campaign';

export default function AdsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<AdBanner | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<AdBannerFormValues>({
        resolver: zodResolver(adBannerSchema),
        defaultValues: { name: '', imageUrl: '', displayOrder: 0, isActive: true, actionType: 'none' },
    });
    
    // Data Fetching
    const { data: adBanners, isLoading: isLoadingBanners } = useCollection<AdBanner>(useMemoFirebase(() => firestore ? collection(firestore, 'adBanners') : null, [firestore]));
    const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]));
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]));
    const { data: campaigns, isLoading: isLoadingCampaigns } = useCollection<DonationCampaign>(useMemoFirebase(() => firestore ? collection(firestore, 'donationCampaigns') : null, [firestore]));

    // Memoized Maps for display
    const storesMap = useMemo(() => stores?.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}) || {}, [stores]);
    const productsMap = useMemo(() => products?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {}, [products]);
    const campaignsMap = useMemo(() => campaigns?.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}) || {}, [campaigns]);

    const targetDataMap = { store: stores || [], product: products || [], campaign: campaigns || [] };
    const targetNameMap = { store: storesMap, product: productsMap, campaign: campaignsMap };
    
    const sortedBanners = useMemo(() => adBanners?.sort((a, b) => a.displayOrder - b.displayOrder) || [], [adBanners]);

    // Handlers
    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedBanner(null);
        form.reset({ name: '', imageUrl: '', displayOrder: (adBanners?.length || 0) + 1, isActive: true, actionType: 'none', targetId: null, expiryDate: null });
        setIsDialogOpen(true);
    };

    const handleEdit = (banner: AdBanner) => {
        setIsEditing(true);
        setSelectedBanner(banner);
        form.reset({ ...banner, expiryDate: banner.expiryDate?.toDate() });
        setIsDialogOpen(true);
    };

    const handleDelete = (banner: AdBanner) => {
        setSelectedBanner(banner);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedBanner && firestore) {
            deleteDocumentNonBlocking(doc(firestore, 'adBanners', selectedBanner.id));
            toast({ title: "تم حذف الإعلان بنجاح" });
            setIsAlertOpen(false);
        }
    };
    
    const handleStatusChange = (banner: AdBanner, isActive: boolean) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'adBanners', banner.id), { isActive });
        toast({ title: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الإعلان` });
    };

    const onSubmit = (values: AdBannerFormValues) => {
        if (!firestore) return;
        const dataToSave = { ...values, targetId: values.actionType === 'none' ? null : values.targetId, updatedAt: serverTimestamp() };
        if (isEditing && selectedBanner) {
            updateDocumentNonBlocking(doc(firestore, 'adBanners', selectedBanner.id), dataToSave);
            toast({ title: "تم تحديث الإعلان بنجاح" });
        } else {
            addDocumentNonBlocking(collection(firestore, 'adBanners'), { ...dataToSave, createdAt: serverTimestamp() });
            toast({ title: "تمت إضافة الإعلان بنجاح" });
        }
        setIsDialogOpen(false);
    };
    
    const actionType = form.watch('actionType');

    const isLoading = isLoadingBanners || isLoadingStores || isLoadingProducts || isLoadingCampaigns;
    if (isLoading) return <AdsLoading />;
    
    const renderTarget = (ad: AdBanner) => {
        if (ad.actionType === 'none' || !ad.targetId) return <Badge variant="secondary">إعلان عادي</Badge>;
        let target, icon;
        switch (ad.actionType) {
            case 'store':
                target = storesMap[ad.targetId];
                icon = <StoreIcon className="h-4 w-4" />;
                break;
            case 'product':
                target = productsMap[ad.targetId];
                icon = <ShoppingBasket className="h-4 w-4" />;
                break;
            case 'campaign':
                target = campaignsMap[ad.targetId];
                icon = <HandHeart className="h-4 w-4" />;
                break;
        }
        if (!target) return <Badge variant="outline">غير معروف</Badge>;
        return <div className="flex items-center gap-2"><Image src={target.imageUrl} alt={target.name || target.title} width={32} height={32} className="rounded-md object-cover" /> {target.name || target.title}</div>
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>إدارة الإعلانات</CardTitle>
                            <CardDescription>إضافة وتعديل وحذف الإعلانات المتحركة في الصفحة الرئيسية.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}><PlusCircle /> إضافة إعلان</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px] text-center">معاينة</TableHead>
                                    <TableHead className="text-center">اسم الإعلان</TableHead>
                                    <TableHead className="text-center">وجهة الإعلان</TableHead>
                                    <TableHead className="text-center">الترتيب</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedBanners.map(ad => (
                                    <TableRow key={ad.id} className={cn(!ad.isActive && "text-muted-foreground bg-muted/50")}>
                                        <TableCell><Image src={ad.imageUrl} alt={ad.name} width={100} height={50} className="rounded-md object-cover mx-auto" unoptimized /></TableCell>
                                        <TableCell className="font-medium text-center">{ad.name}</TableCell>
                                        <TableCell className="text-center">{renderTarget(ad)}</TableCell>
                                        <TableCell className="text-center">{ad.displayOrder}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Switch checked={ad.isActive} onCheckedChange={(val) => handleStatusChange(ad, val)} aria-label="تفعيل الإعلان" />
                                                {ad.expiryDate && new Date(ad.expiryDate.toDate()) < new Date() && !ad.isActive && (
                                                    <Badge variant="destructive" className="text-xs font-normal">منتهي</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEdit(ad)}><Edit /></Button>
                                                <Button variant="outline" size="icon" onClick={() => handleDelete(ad)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">{isEditing ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}</DialogTitle>
                        <DialogDescription className="text-right">أدخل تفاصيل الإعلان ووجهته.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>اسم الإعلان (داخلي)</FormLabel><FormControl><Input {...field} placeholder="مثال: عرض رمضان 2024" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رابط صورة الإعلان</FormLabel>
                                    <div className="relative">
                                        <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl><Input {...field} dir="ltr" className="pl-4 pr-10" placeholder="https://..." /></FormControl>
                                    </div>
                                    {field.value && <Image src={field.value} alt="معاينة" width={200} height={100} className="rounded-lg object-cover mt-2 border p-1 mx-auto" unoptimized />}
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="displayOrder" render={({ field }) => (
                                    <FormItem><FormLabel>ترتيب الظهور</FormLabel><div className="relative"><SortAsc className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="number" {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>تاريخ الانتهاء (اختياري)</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal", !field.value && "text-muted-foreground")}>
                                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر تاريخاً</span>}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                        </Popover><FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            
                            <FormField control={form.control} name="actionType" render={({ field }) => (
                                <FormItem><FormLabel>نوع التفاعل عند النقر</FormLabel>
                                    <Select onValueChange={value => { field.onChange(value); form.setValue('targetId', null); }} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر نوع التفاعل..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">إعلان عادي (بدون رابط)</SelectItem>
                                            <SelectItem value="store">ربط بمتجر</SelectItem>
                                            <SelectItem value="product">ربط بمنتج</SelectItem>
                                            <SelectItem value="campaign">ربط بحملة تبرع</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage /></FormItem>
                            )} />

                            {actionType !== 'none' && (
                                <FormField control={form.control} name="targetId" render={({ field }) => (
                                    <FormItem><FormLabel>اختر الوجهة</FormLabel>
                                        <TargetSelector
                                            targetType={actionType as TargetType}
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={targetDataMap[actionType as TargetType]}
                                            optionsMap={targetNameMap[actionType as TargetType]}
                                        />
                                    <FormMessage /></FormItem>
                                )} />
                            )}
                            
                             <FormField control={form.control} name="isActive" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5"><FormLabel>تفعيل الإعلان</FormLabel><FormDescription>هل تريد عرض هذا الإعلان للمستخدمين؟</FormDescription></div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                             )} />

                            <DialogFooter className="pt-4 flex-row-reverse sm:justify-start gap-2">
                                <Button type="submit">حفظ الإعلان</Button>
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>هذا الإجراء سيحذف الإعلان بشكل دائم.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// Sub-component for selecting target
function TargetSelector({ targetType, value, onChange, options, optionsMap }: {
    targetType: TargetType,
    value: string | null | undefined,
    onChange: (value: string) => void,
    options: any[],
    optionsMap: any,
}) {
    const [open, setOpen] = useState(false);
    const selectedName = value ? (optionsMap[value]?.name || optionsMap[value]?.title) : '';

    const typePlaceholders = {
        store: "ابحث عن متجر...",
        product: "ابحث عن منتج...",
        campaign: "ابحث عن حملة...",
    };
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {value ? selectedName : `اختر ${targetType === 'store' ? 'متجراً' : targetType === 'product' ? 'منتجاً' : 'حملة'}...`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder={typePlaceholders[targetType]} />
                    <CommandList>
                        <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                        <CommandGroup>
                            {options.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={item.id}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                                    {item.name || item.title}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
