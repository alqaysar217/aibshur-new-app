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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Megaphone, Link as LinkIcon, Image as ImageIcon, Store as StoreIcon, ShoppingBasket, HandHeart, CalendarIcon, SortAsc, CheckCircle, XCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { Store } from '../stores/page';
import type { Product } from '../products/page';
import type { DonationCampaign } from '../donations/page';
import type { Province } from '../governorates/page';


// Zod Schema
const adBannerSchema = z.object({
  name: z.string().min(3, { message: "اسم الإعلان مطلوب (3 أحرف على الأقل)" }),
  imageUrl: z.string().min(1, { message: "الرجاء إدخال رابط أو مسار صحيح للصورة" }),
  displayOrder: z.coerce.number().min(0, { message: "ترتيب الظهور يجب أن يكون رقمًا موجبًا" }),
  isActive: z.boolean().default(true),
  expiryDate: z.date().optional().nullable(),
  actionType: z.enum(['none', 'store', 'product', 'campaign']),
  targetIds: z.array(z.string()).optional().default([]),
}).superRefine((data, ctx) => {
    if (data.actionType !== 'none' && (!data.targetIds || data.targetIds.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetIds'], message: 'يجب اختيار وجهة واحدة على الأقل' });
    }
});

// Types
type AdBannerFormValues = z.infer<typeof adBannerSchema>;
type AdBanner = Omit<AdBannerFormValues, 'expiryDate'> & { 
  id: string;
  expiryDate?: Timestamp | null;
};

const defaultAdValues: AdBannerFormValues = {
    name: '',
    imageUrl: '',
    displayOrder: 0,
    isActive: true,
    expiryDate: null,
    actionType: 'none',
    targetIds: [],
};

type TargetType = 'store' | 'product' | 'campaign';

export default function AdsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<AdBanner | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [customSearch, setCustomSearch] = useState('');
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<AdBannerFormValues>({
        resolver: zodResolver(adBannerSchema),
        defaultValues: defaultAdValues,
    });
    
    // Data Fetching
    const adBannersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'adBanners') : null, [firestore]);
    const { data: adBanners, isLoading: isLoadingBanners } = useCollection<AdBanner>(adBannersQuery);

    const storesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]);
    const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);
    
    const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const campaignsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'donationCampaigns') : null, [firestore]);
    const { data: campaigns, isLoading: isLoadingCampaigns } = useCollection<DonationCampaign>(campaignsQuery);
    
    const provincesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'app_provinces') : null, [firestore]);
    const { data: provinces, isLoading: isLoadingProvinces } = useCollection<Province>(provincesQuery);


    // Memoized Maps for display
    const storesMap = useMemo(() => stores?.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}) || {}, [stores]);
    const productsMap = useMemo(() => products?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {}, [products]);
    const campaignsMap = useMemo(() => campaigns?.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}) || {}, [campaigns]);
    const provincesMap = useMemo(() => provinces?.reduce((acc, p) => ({ ...acc, [p.id]: p.province_name }), {}) || {}, [provinces]);

    const targetDataMap = { store: stores || [], product: products || [], campaign: campaigns || [] };
    
    const filteredStores = useMemo(() =>(stores || []).filter(s => s.name.toLowerCase().includes(customSearch.toLowerCase())), [stores, customSearch]);
    const filteredProducts = useMemo(() =>(products || []).filter(p => p.name.toLowerCase().includes(customSearch.toLowerCase())), [products, customSearch]);
    const filteredCampaigns = useMemo(() =>(campaigns || []).filter(c => c.title.toLowerCase().includes(customSearch.toLowerCase())), [campaigns, customSearch]);
    
    const sortedBanners = useMemo(() => adBanners?.sort((a, b) => a.displayOrder - b.displayOrder) || [], [adBanners]);

    // Handlers
    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedBanner(null);
        form.reset(defaultAdValues);
        setIsDialogOpen(true);
    };

    const handleEdit = (banner: AdBanner) => {
        setIsEditing(true);
        setSelectedBanner(banner);
        form.reset({ 
            ...banner, 
            expiryDate: banner.expiryDate?.toDate(),
            targetIds: banner.targetIds || []
        });
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
    
    const onSubmit = (values: AdBannerFormValues) => {
        if (!firestore) return;
        const dataToSave = { ...values, targetIds: values.actionType === 'none' ? [] : values.targetIds, updatedAt: serverTimestamp() };
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

    const isLoading = isLoadingBanners || isLoadingStores || isLoadingProducts || isLoadingCampaigns || isLoadingProvinces;
    if (isLoading) return <AdsLoading />;
    
    const renderTarget = (ad: AdBanner) => {
        if (ad.actionType === 'none' || !ad.targetIds || ad.targetIds.length === 0) return <Badge variant="secondary">إعلان عادي</Badge>;
        
        const firstTargetId = ad.targetIds[0];
        let target: any, icon;
        switch (ad.actionType) {
            case 'store': target = storesMap[firstTargetId]; icon = <StoreIcon className="h-4 w-4" />; break;
            case 'product': target = productsMap[firstTargetId]; icon = <ShoppingBasket className="h-4 w-4" />; break;
            case 'campaign': target = campaignsMap[firstTargetId]; icon = <HandHeart className="h-4 w-4" />; break;
        }

        if (!target) return <Badge variant="outline">وجهة غير معروفة</Badge>;

        return (
            <div className="flex items-center justify-center gap-2">
                <Image src={target.imageUrl || target.mainImageUrl} alt={target.name || target.title} width={32} height={32} className="rounded-md object-cover" /> 
                <span>{target.name || target.title}</span>
                {ad.targetIds.length > 1 && <Badge variant="outline">+{ad.targetIds.length - 1} آخر</Badge>}
            </div>
        );
    }

    const renderTableForSelection = () => {
        const itemIds = form.watch('targetIds') || [];
        
        const handleCheckboxChange = (id: string, checked: boolean | 'indeterminate') => {
            const currentIds = form.getValues('targetIds') || [];
            const newIds = checked
                ? [...currentIds, id]
                : currentIds.filter(val => val !== id);
            form.setValue('targetIds', newIds, { shouldValidate: true });
        };
    
        switch(actionType) {
            case 'store':
                return filteredStores.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="text-center"><Checkbox checked={itemIds.includes(item.id)} onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)} /></TableCell>
                        <TableCell className="text-center"><Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md object-cover" /></TableCell>
                        <TableCell className="text-right font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{provincesMap[item.provinceId]}</TableCell>
                    </TableRow>
                ));
            case 'product':
                return filteredProducts.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="text-center"><Checkbox checked={itemIds.includes(item.id)} onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)} /></TableCell>
                        <TableCell className="text-center"><Image src={item.mainImageUrl} alt={item.name} width={40} height={40} className="rounded-md object-cover" /></TableCell>
                        <TableCell className="text-right font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{storesMap[item.storeId]?.name}</TableCell>
                    </TableRow>
                ));
            case 'campaign':
                return filteredCampaigns.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="text-center"><Checkbox checked={itemIds.includes(item.id)} onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)} /></TableCell>
                        <TableCell className="text-center"><Image src={item.imageUrl} alt={item.title} width={40} height={40} className="rounded-md object-cover" /></TableCell>
                        <TableCell className="text-right font-medium">{item.title}</TableCell>
                        <TableCell className="text-right font-mono">{item.goalAmount.toLocaleString('en-US')} ر.ي</TableCell>
                    </TableRow>
                ));
            default:
                return null;
        }
    };
    

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
                                                <Badge variant={ad.isActive ? 'default' : 'secondary'}>{ad.isActive ? 'نشط' : 'غير نشط'}</Badge>
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
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                             <Tabs defaultValue="basic" className="w-full" dir="rtl">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                                    <TabsTrigger value="destination">وجهة الإعلان</TabsTrigger>
                                </TabsList>
                                <TabsContent value="basic" className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>اسم الإعلان (داخلي)</FormLabel><FormControl><Input {...field} placeholder="مثال: عرض رمضان 2024" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="displayOrder" render={({ field }) => (
                                            <FormItem><FormLabel>ترتيب الظهور</FormLabel><div className="relative"><SortAsc className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="number" {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                     </div>
                                      <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>رابط صورة الإعلان</FormLabel>
                                            <div className="relative">
                                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <FormControl><Input {...field} dir="ltr" className="pl-4 pr-10" placeholder="https://... or /logo.png" /></FormControl>
                                            </div>
                                            {field.value && <Image src={field.value} alt="معاينة" width={200} height={100} className="rounded-lg object-cover mt-2 border p-1 mx-auto" unoptimized />}
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField
                                        control={form.control}
                                        name="expiryDate"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>تاريخ الانتهاء (اختياري)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="date"
                                                    value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''}
                                                    onChange={(e) => {
                                                        const date = new Date(e.target.value);
                                                        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                                        field.onChange(new Date(date.getTime() + userTimezoneOffset));
                                                    }}
                                                    className="w-full text-right"
                                                    dir="rtl"
                                                />
                                            </FormControl>
                                            <FormDescription>سيتم تعطيل الإعلان بعد هذا التاريخ.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="isActive" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>حالة الإعلان</FormLabel>
                                            <FormDescription>هل تريد عرض هذا الإعلان للمستخدمين؟</FormDescription>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)} className="h-11"><CheckCircle />نشط</Button>
                                                    <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)} className="h-11"><XCircle />غير نشط</Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </TabsContent>
                                <TabsContent value="destination" className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                                     <FormField control={form.control} name="actionType" render={({ field }) => (
                                        <FormItem><FormLabel>نوع التفاعل عند النقر</FormLabel>
                                            <Select onValueChange={value => { field.onChange(value); form.setValue('targetIds', []); setCustomSearch(''); }} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="اختر نوع التفاعل..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none" className="text-right justify-end">إعلان عادي (بدون رابط)</SelectItem>
                                                    <SelectItem value="store" className="text-right justify-end">ربط بمتجر</SelectItem>
                                                    <SelectItem value="product" className="text-right justify-end">ربط بمنتج</SelectItem>
                                                    <SelectItem value="campaign" className="text-right justify-end">ربط بحملة تبرع</SelectItem>
                                                </SelectContent>
                                            </Select><FormMessage /></FormItem>
                                    )} />
                                    {actionType !== 'none' && (
                                        <div className="space-y-2 pt-4">
                                            <div className="relative">
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={`ابحث عن ${actionType === 'store' ? 'متجر' : actionType === 'product' ? 'منتج' : 'حملة'}...`}
                                                    className="pr-10"
                                                    value={customSearch}
                                                    onChange={(e) => setCustomSearch(e.target.value)}
                                                />
                                            </div>
                                            <ScrollArea className="h-48 rounded-md border">
                                                <Table dir="rtl">
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-12 text-center">تحديد</TableHead>
                                                            <TableHead className="w-16 text-center">صورة</TableHead>
                                                            <TableHead className="text-right">الاسم</TableHead>
                                                            <TableHead className="text-right">تفاصيل إضافية</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {renderTableForSelection()}
                                                    </TableBody>
                                                </Table>
                                            </ScrollArea>
                                            <FormMessage>{form.formState.errors.targetIds?.message}</FormMessage>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>

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
