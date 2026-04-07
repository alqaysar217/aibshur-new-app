'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';
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
import { PlusCircle, Trash, Edit, Link2, CheckCircle, XCircle, LayoutGrid, Filter, Store, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import CategoriesLoading from './loading';

// Zod schemas
const appCategorySchema = z.object({
  name: z.string().min(2, { message: 'اسم الفئة مطلوب' }),
  image: z.string().min(1, { message: 'رابط الصورة مطلوب' }),
  is_active: z.boolean().default(true),
});

const storeFilterSchema = z.object({
  filter_name: z.string().min(2, { message: 'اسم الفلتر مطلوب' }),
  filter_image: z.string().min(1, { message: 'رابط الصورة مطلوب' }),
  parent_store_id: z.string({ required_error: 'يجب اختيار المتجر الرئيسي' }).min(1, { message: 'يجب اختيار المتجر الرئيسي' }),
  is_active: z.boolean().default(true),
});

// Types
type AppCategoryFormValues = z.infer<typeof appCategorySchema>;
type AppCategory = AppCategoryFormValues & { id: string };

type StoreFilterFormValues = z.infer<typeof storeFilterSchema>;
type StoreFilter = StoreFilterFormValues & { id: string };

type Store = { id: string; name: string };

type DialogState = {
    isOpen: boolean;
    isEditing: boolean;
    data: AppCategory | StoreFilter | null;
    type: 'category' | 'filter';
};

export default function CategoriesPage() {
    const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, isEditing: false, data: null, type: 'category' });
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const categoryForm = useForm<AppCategoryFormValues>({
        resolver: zodResolver(appCategorySchema),
        defaultValues: {
            name: '',
            image: '',
            is_active: true,
        },
    });
    const filterForm = useForm<StoreFilterFormValues>({
        resolver: zodResolver(storeFilterSchema),
        defaultValues: {
            filter_name: '',
            filter_image: '',
            parent_store_id: '',
            is_active: true,
        },
    });

    // Data fetching
    const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'app_categories') : null, [firestore]);
    const { data: categories, isLoading: isLoadingCategories } = useCollection<AppCategory>(categoriesQuery);

    const filtersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'store_filters') : null, [firestore]);
    const { data: filters, isLoading: isLoadingFilters } = useCollection<StoreFilter>(filtersQuery);

    const storesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]);
    const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);

    const storesMap = useMemo(() => stores?.reduce((acc, store) => ({ ...acc, [store.id]: store.name }), {}) || {}, [stores]);

    // Handlers
    const handleOpenDialog = (type: 'category' | 'filter', isEditing = false, data: AppCategory | StoreFilter | null = null) => {
        if (isEditing && data) {
            const form = type === 'category' ? categoryForm : filterForm;
            form.reset({ ...data, is_active: data.is_active ?? true });
        } else {
            if (type === 'category') {
                categoryForm.reset({ name: '', image: '', is_active: true });
            } else {
                filterForm.reset({ filter_name: '', filter_image: '', parent_store_id: '', is_active: true });
            }
        }
        setDialogState({ isOpen: true, isEditing, data, type });
    };

    const handleDelete = (type: 'category' | 'filter', data: AppCategory | StoreFilter) => {
        setDialogState({ ...dialogState, data, type });
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        const { data, type } = dialogState;
        if (!data || !firestore) return;
        const collectionName = type === 'category' ? 'app_categories' : 'store_filters';
        deleteDocumentNonBlocking(doc(firestore, collectionName, data.id));
        toast({ title: "تم الحذف بنجاح" });
        setIsAlertOpen(false);
    };

    const onCategorySubmit = (values: AppCategoryFormValues) => {
        if (!firestore) return;
        const collectionRef = collection(firestore, 'app_categories');
        if (dialogState.isEditing && dialogState.data) {
            updateDocumentNonBlocking(doc(collectionRef, dialogState.data.id), values);
            toast({ title: "تم التحديث بنجاح" });
        } else {
            addDocumentNonBlocking(collectionRef, values);
            toast({ title: "تمت الإضافة بنجاح" });
        }
        setDialogState({ ...dialogState, isOpen: false });
    };

    const onFilterSubmit = (values: StoreFilterFormValues) => {
        if (!firestore) return;
        const collectionRef = collection(firestore, 'store_filters');
        if (dialogState.isEditing && dialogState.data) {
            updateDocumentNonBlocking(doc(collectionRef, dialogState.data.id), values);
            toast({ title: "تم التحديث بنجاح" });
        } else {
            addDocumentNonBlocking(collectionRef, values);
            toast({ title: "تمت الإضافة بنجاح" });
        }
        setDialogState({ ...dialogState, isOpen: false });
    };

    const isLoading = isLoadingCategories || isLoadingFilters || isLoadingStores;

    if (isLoading) {
        return <CategoriesLoading />;
    }

    return (
        <>
            <Tabs defaultValue="global_categories" dir="rtl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground">إدارة الفئات</h1>
                        <p className="text-muted-foreground mt-1">إدارة الفئات العامة للمتاجر والفلاتر الداخلية لكل متجر.</p>
                    </div>
                    <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="global_categories" className="flex-1 sm:flex-initial gap-2"><LayoutGrid/>الفئات العامة</TabsTrigger>
                        <TabsTrigger value="store_filters" className="flex-1 sm:flex-initial gap-2"><Filter/>فلاتر المتاجر</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="global_categories">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>الفئات العامة للمتاجر</CardTitle>
                                    <CardDescription>إضافة وتعديل وحذف الفئات التي تظهر في التطبيق.</CardDescription>
                                </div>
                                <Button onClick={() => handleOpenDialog('category')}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> إضافة فئة
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center w-[120px]">الصورة</TableHead>
                                            <TableHead>الاسم</TableHead>
                                            <TableHead className="text-center">الحالة</TableHead>
                                            <TableHead className="text-center w-[120px]">إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories?.map((cat) => (
                                            <TableRow key={cat.id} className={cn(!cat.is_active && "text-muted-foreground bg-muted/50")}>
                                                <TableCell><Image src={cat.image} alt={cat.name} width={64} height={64} className="rounded-lg object-contain mx-auto" /></TableCell>
                                                <TableCell className="font-medium">{cat.name}</TableCell>
                                                <TableCell className="text-center"><Badge variant={cat.is_active ? 'default' : 'secondary'}>{cat.is_active ? 'نشط' : 'غير نشط'}</Badge></TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog('category', true, cat)}><Edit /></Button>
                                                        <Button variant="outline" size="icon" onClick={() => handleDelete('category', cat)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash /></Button>
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
                
                <TabsContent value="store_filters">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>فلاتر المتاجر</CardTitle>
                                    <CardDescription>إدارة الفلاتر والأقسام الداخلية لكل متجر على حدة.</CardDescription>
                                </div>
                                <Button onClick={() => handleOpenDialog('filter')}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> إضافة فلتر
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center w-[120px]">الصورة</TableHead>
                                            <TableHead>اسم الفلتر</TableHead>
                                            <TableHead>المتجر الرئيسي</TableHead>
                                            <TableHead className="text-center">الحالة</TableHead>
                                            <TableHead className="text-center w-[120px]">إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filters?.map((filter) => (
                                            <TableRow key={filter.id} className={cn(!filter.is_active && "text-muted-foreground bg-muted/50")}>
                                                <TableCell><Image src={filter.filter_image} alt={filter.filter_name} width={64} height={64} className="rounded-lg object-contain mx-auto" /></TableCell>
                                                <TableCell className="font-medium">{filter.filter_name}</TableCell>
                                                <TableCell>{storesMap[filter.parent_store_id] || 'غير معروف'}</TableCell>
                                                <TableCell className="text-center"><Badge variant={filter.is_active ? 'default' : 'secondary'}>{filter.is_active ? 'نشط' : 'غير نشط'}</Badge></TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog('filter', true, filter)}><Edit /></Button>
                                                        <Button variant="outline" size="icon" onClick={() => handleDelete('filter', filter)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash /></Button>
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

            {/* Dialog for Add/Edit */}
            <Dialog open={dialogState.isOpen} onOpenChange={(isOpen) => setDialogState(prev => ({...prev, isOpen}))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogState.type === 'category' ? (dialogState.isEditing ? 'تعديل الفئة' : 'إضافة فئة جديدة') : (dialogState.isEditing ? 'تعديل الفلتر' : 'إضافة فلتر جديد')}</DialogTitle>
                    </DialogHeader>
                    {dialogState.type === 'category' ? (
                        <Form {...categoryForm}>
                            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4 py-4" dir="rtl">
                                <FormField control={categoryForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>اسم الفئة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={categoryForm.control} name="image" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رابط صورة الفئة</FormLabel>
                                        <FormControl><Input {...field} dir="ltr" /></FormControl>
                                        {field.value && <Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-lg object-contain mt-2 border p-2" unoptimized/>}
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={categoryForm.control} name="is_active" render={({ field }) => (
                                     <FormItem><FormLabel>الحالة</FormLabel><FormControl>
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)}><CheckCircle />نشط</Button>
                                            <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)}><XCircle />غير نشط</Button>
                                        </div>
                                    </FormControl></FormItem>
                                )} />
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                    <Button type="submit">حفظ</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    ) : (
                         <Form {...filterForm}>
                            <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="space-y-4 py-4" dir="rtl">
                                <FormField control={filterForm.control} name="filter_name" render={({ field }) => (
                                    <FormItem><FormLabel>اسم الفلتر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={filterForm.control} name="filter_image" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>رابط صورة الفلتر</FormLabel>
                                        <FormControl><Input {...field} dir="ltr" /></FormControl>
                                        {field.value && <Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-lg object-contain mt-2 border p-2" unoptimized/>}
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={filterForm.control} name="parent_store_id" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المتجر الرئيسي</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر المتجر..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {stores?.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={filterForm.control} name="is_active" render={({ field }) => (
                                    <FormItem><FormLabel>الحالة</FormLabel><FormControl>
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)}><CheckCircle />نشط</Button>
                                            <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)}><XCircle />غير نشط</Button>
                                        </div>
                                    </FormControl></FormItem>
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

            {/* Delete Alert */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
