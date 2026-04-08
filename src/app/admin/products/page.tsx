'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

import ProductsLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Star, Package, FileText, Store as StoreIcon, LayoutGrid, Filter, Link as LinkIcon, CircleDollarSign, Layers, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Store } from '../stores/page';
import type { AppCategory, StoreFilter } from '../categories/page';

// Zod schemas
const variantSchema = z.object({
  name: z.string().min(1, { message: 'اسم النوع مطلوب' }),
  price: z.coerce.number().min(1, { message: 'السعر مطلوب ويجب أن يكون أكبر من صفر' }),
  imageUrl: z.string().url({ message: "الرجاء إدخال رابط صحيح" }).optional().or(z.literal('')),
});

const productSchema = z.object({
  name: z.string().min(2, { message: "اسم المنتج مطلوب" }),
  description: z.string().min(10, { message: "الوصف مطلوب (10 أحرف على الأقل)" }),
  mainImageUrl: z.string().url({ message: "رابط الصورة الرئيسية مطلوب" }),
  storeId: z.string({ required_error: "يجب اختيار المتجر" }),
  categoryId: z.string({ required_error: "يجب اختيار القسم" }),
  filterId: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).default(0),
  is_active: z.boolean().default(true),
  hasVariants: z.boolean().default(false),
  basePrice: z.coerce.number().optional(),
  variants: z.array(variantSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.hasVariants) {
    if (!data.variants || data.variants.length < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["variants"], message: "يجب إضافة نوع واحد على الأقل." });
    }
  } else {
    if (!data.basePrice || data.basePrice <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["basePrice"], message: "السعر الأساسي مطلوب ويجب أن يكون أكبر من صفر." });
    }
  }
});

// Types
type ProductFormValues = z.infer<typeof productSchema>;
type Product = ProductFormValues & { id: string };

export default function ProductsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: '', description: '', mainImageUrl: '', rating: 0, is_active: true, hasVariants: false, basePrice: 0, variants: [] },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });

    // Data fetching
    const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const storesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]);
    const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);
    
    const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'app_categories') : null, [firestore]);
    const { data: categories, isLoading: isLoadingCategories } = useCollection<AppCategory>(categoriesQuery);

    const storeFiltersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'store_filters') : null, [firestore]);
    const { data: storeFilters, isLoading: isLoadingFilters } = useCollection<StoreFilter>(storeFiltersQuery);
    
    // Create maps for display names
    const storesMap = useMemo(() => stores?.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {}) || {}, [stores]);

    // Derived state for dependent dropdown
    const watchedStoreId = form.watch("storeId");
    const availableFilters = useMemo(() => {
        if (!storeFilters || !watchedStoreId) return [];
        return storeFilters.filter(f => f.parent_store_id === watchedStoreId);
    }, [storeFilters, watchedStoreId]);

    // Effect to reset filter when store changes
    useEffect(() => {
        if (form.getValues('storeId') !== selectedProduct?.storeId) {
            form.setValue('filterId', undefined);
        }
    }, [watchedStoreId, form, selectedProduct]);

    // Handlers
    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedProduct(null);
        form.reset({ name: '', description: '', mainImageUrl: '', storeId: undefined, categoryId: undefined, filterId: undefined, rating: 0, is_active: true, hasVariants: false, basePrice: 0, variants: [] });
        setIsDialogOpen(true);
    };

    const handleEdit = (product: Product) => {
        setIsEditing(true);
        setSelectedProduct(product);
        form.reset({ ...product, is_active: product.is_active ?? true, basePrice: product.basePrice ?? 0, variants: product.variants ?? [] });
        setIsDialogOpen(true);
    };

    const handleDelete = (product: Product) => {
        setSelectedProduct(product);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedProduct && firestore) {
            deleteDocumentNonBlocking(doc(firestore, 'products', selectedProduct.id));
            toast({ title: "تم حذف المنتج بنجاح" });
            setIsAlertOpen(false);
        }
    };

    const onSubmit = (values: ProductFormValues) => {
        if (!firestore) return;
        const dataToSave = { ...values, updatedAt: serverTimestamp() };
        try {
            if (isEditing && selectedProduct) {
                updateDocumentNonBlocking(doc(firestore, 'products', selectedProduct.id), dataToSave);
                toast({ title: "تم تحديث المنتج بنجاح" });
            } else {
                addDocumentNonBlocking(collection(firestore, 'products'), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: "تمت إضافة المنتج بنجاح" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            toast({ variant: "destructive", title: "حدث خطأ", description: "لم نتمكن من حفظ التغييرات." });
        }
    };

    const hasVariants = form.watch("hasVariants");
    const isLoading = isLoadingProducts || isLoadingStores || isLoadingCategories || isLoadingFilters;

    if (isLoading) return <ProductsLoading />;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>إدارة المنتجات</CardTitle>
                            <CardDescription>إضافة وتعديل وحذف المنتجات المعروضة في التطبيق.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}><PlusCircle /> إضافة منتج جديد</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center w-[80px]">الصورة</TableHead>
                                    <TableHead className="text-center">اسم المنتج</TableHead>
                                    <TableHead className="text-center">المتجر</TableHead>
                                    <TableHead className="text-center">التقييم</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products?.map((product) => (
                                    <TableRow key={product.id} className={cn(!product.is_active && "text-muted-foreground bg-muted/50")}>
                                        <TableCell><Image src={product.mainImageUrl} alt={product.name} width={56} height={56} className="rounded-lg object-cover mx-auto" unoptimized/></TableCell>
                                        <TableCell className="font-medium text-center">{product.name}</TableCell>
                                        <TableCell className="text-center">{storesMap[product.storeId] || 'غير محدد'}</TableCell>
                                        <TableCell className="text-center flex items-center justify-center gap-1"><Star className="h-4 w-4 text-amber-400" /> {product.rating}</TableCell>
                                        <TableCell className="text-center"><Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'مفعل' : 'ملغى'}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEdit(product)}><Edit/></Button>
                                                <Button variant="outline" size="icon" onClick={() => handleDelete(product)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash/></Button>
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
                <DialogContent className="max-w-4xl" dir="rtl">
                    <DialogHeader className='text-right'>
                        <DialogTitle className='text-right'>{isEditing ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
                        <DialogDescription className='text-right'>أدخل تفاصيل المنتج والأقسام والأسعار الخاصة به.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-2">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>اسم المنتج</FormLabel><div className="relative"><Package className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>وصف المنتج</FormLabel><div className="relative"><FileText className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" /><FormControl><Textarea {...field} className="pr-10 min-h-[120px]" /></FormControl></div><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="mainImageUrl" render={({ field }) => (
                                        <FormItem><FormLabel>رابط الصورة الرئيسية</FormLabel><div className="relative"><LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} dir="ltr" className="pr-10" /></FormControl></div>
                                        {field.value && <Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-lg object-contain mt-2 border p-2" unoptimized />}
                                        <FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="space-y-6">
                                    <FormField control={form.control} name="storeId" render={({ field }) => (
                                        <FormItem><FormLabel>المتجر التابع له</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl"><FormControl><SelectTrigger><div className="flex items-center gap-2"><StoreIcon /><SelectValue placeholder="اختر المتجر..." /></div></SelectTrigger></FormControl>
                                                <SelectContent>{stores?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="categoryId" render={({ field }) => (
                                        <FormItem><FormLabel>القسم العام (Category)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl"><FormControl><SelectTrigger><div className="flex items-center gap-2"><LayoutGrid /><SelectValue placeholder="اختر القسم..." /></div></SelectTrigger></FormControl>
                                                <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="filterId" render={({ field }) => (
                                        <FormItem><FormLabel>الفلتر الداخلي (Filter)</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={!watchedStoreId || availableFilters.length === 0}><FormControl><SelectTrigger><div className="flex items-center gap-2"><Filter /><SelectValue placeholder="اختر الفلتر..." /></div></SelectTrigger></FormControl>
                                                <SelectContent>{availableFilters.map(f => <SelectItem key={f.id} value={f.id}>{f.filter_name}</SelectItem>)}</SelectContent>
                                            </Select>
                                            {!watchedStoreId && <FormDescription>يجب اختيار متجر أولاً.</FormDescription>}
                                            {watchedStoreId && availableFilters.length === 0 && <FormDescription>هذا المتجر لا يحتوي على فلاتر.</FormDescription>}
                                            <FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="rating" render={({ field }) => (
                                        <FormItem><FormLabel>التقييم الافتراضي</FormLabel><div className="relative"><Star className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="number" step="0.1" min="0" max="5" {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                    )} />
                                </div>
                           </div>
                           <Separator />
                           <div className='space-y-4'>
                                <FormField control={form.control} name="hasVariants" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5"><FormLabel>هل للمنتج أنواع/أحجام متعددة؟</FormLabel><FormDescription>فعّل هذا الخيار لإضافة أسعار وأحجام مختلفة.</FormDescription></div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}/>

                                {!hasVariants ? (
                                    <FormField control={form.control} name="basePrice" render={({ field }) => (
                                        <FormItem><FormLabel>السعر الأساسي</FormLabel><div className="relative"><CircleDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="number" {...field} className="pr-10" placeholder='0.00' /></FormControl></div><FormMessage /></FormItem>
                                    )} />
                                ) : (
                                    <div className="space-y-4">
                                        <FormLabel className="flex items-center gap-2"><Layers /> أنواع وأسعار المنتج</FormLabel>
                                        {fields.map((item, index) => (
                                            <div key={item.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end border p-3 rounded-lg bg-muted/50">
                                                <FormField control={form.control} name={`variants.${index}.name`} render={({ field }) => (<FormItem><FormLabel>اسم النوع</FormLabel><FormControl><Input {...field} placeholder="مثال: كبير" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem><FormLabel>السعر</FormLabel><FormControl><Input type="number" {...field} placeholder="0.00" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`variants.${index}.imageUrl`} render={({ field }) => (<FormItem><FormLabel>رابط الصورة (اختياري)</FormLabel><FormControl><Input {...field} placeholder="https://" dir="ltr" /></FormControl>
                                                {field.value && <Image src={field.value} alt="معاينة" width={40} height={40} className="rounded-md object-contain mt-1 border p-1" unoptimized />}
                                                <FormMessage /></FormItem>)} />
                                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash /></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" className="w-full" onClick={() => append({ name: '', price: 0, imageUrl: ''})}><PlusCircle /> إضافة نوع جديد</Button>
                                        <FormMessage>{form.formState.errors.variants?.message}</FormMessage>
                                    </div>
                                )}

                           </div>

                            <DialogFooter className="pt-4 flex-row-reverse sm:justify-start gap-2">
                                <Button type="submit">حفظ المنتج</Button>
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right">
                        <AlertDialogTitle className="text-right">هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">هذا الإجراء سيحذف المنتج بشكل دائم.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start">
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
