'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

import StoresLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Search, Store as StoreIcon, Building, Tag, Clock, CheckCircle, XCircle, ImageIcon, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppProvince } from '../governorates/page';
import type { AppCategory } from '../categories/page';

// Dynamically import the MapPicker component to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/map-picker').then(mod => mod.MapPicker), { 
    ssr: false,
    loading: () => <div className="h-[350px] w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div>
});


const dayOfWeekEnum = z.enum(["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]);

const workingHourSchema = z.object({
  day: dayOfWeekEnum,
  isOpen: z.boolean().default(true),
  morning_from: z.string(),
  morning_to: z.string(),
  evening_from: z.string(),
  evening_to: z.string(),
});

const storeSchema = z.object({
  name: z.string().min(2, { message: "اسم المتجر مطلوب" }),
  imageUrl: z.string().min(1, { message: "رابط شعار المتجر مطلوب" }),
  rating: z.coerce.number().min(0).max(5).default(0),
  deliveryTime: z.string().min(1, { message: "وقت التوصيل المتوقع مطلوب" }),
  provinceId: z.string({ required_error: "يجب اختيار المحافظة" }),
  categoryId: z.string({ required_error: "يجب اختيار الفئة" }),
  latitude: z.number({ required_error: "الرجاء تحديد الموقع على الخريطة" }),
  longitude: z.number({ required_error: "الرجاء تحديد الموقع على الخريطة" }),
  is_active: z.boolean().default(true),
  workingHours: z.array(workingHourSchema).length(7),
});

type StoreFormValues = z.infer<typeof storeSchema>;
type Store = StoreFormValues & { id: string };

const arabicDays = {
  saturday: "السبت", sunday: "الأحد", monday: "الإثنين", tuesday: "الثلاثاء",
  wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة",
};

const defaultWorkingHours: StoreFormValues['workingHours'] = [
    { day: "saturday", isOpen: true, morning_from: "08:00", morning_to: "12:00", evening_from: "16:00", evening_to: "22:00" },
    { day: "sunday", isOpen: true, morning_from: "08:00", morning_to: "12:00", evening_from: "16:00", evening_to: "22:00" },
    { day: "monday", isOpen: true, morning_from: "08:00", morning_to: "12:00", evening_from: "16:00", evening_to: "22:00" },
    { day: "tuesday", isOpen: true, morning_from: "08:00", morning_to: "12:00", evening_from: "16:00", evening_to: "22:00" },
    { day: "wednesday", isOpen: true, morning_from: "08:00", morning_to: "12:00", evening_from: "16:00", evening_to: "22:00" },
    { day: "thursday", isOpen: true, morning_from: "08:00", morning_to: "12:00", evening_from: "16:00", evening_to: "22:00" },
    { day: "friday", isOpen: false, morning_from: "", morning_to: "", evening_from: "", evening_to: "" },
];


export default function StoresPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('all');

    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: '', imageUrl: '', rating: 0, deliveryTime: '25-35',
            latitude: 14.5424, longitude: 49.1333, is_active: true,
            workingHours: defaultWorkingHours,
        },
    });
    
    const { fields, update } = useFieldArray({ control: form.control, name: "workingHours" });

    // Data fetching
    const storesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]);
    const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);

    const provincesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'app_provinces') : null, [firestore]);
    const { data: provinces, isLoading: isLoadingProvinces } = useCollection<AppProvince>(provincesQuery);
    
    const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'app_categories') : null, [firestore]);
    const { data: categories, isLoading: isLoadingCategories } = useCollection<AppCategory>(categoriesQuery);

    const provincesMap = useMemo(() => provinces?.reduce((acc, p) => ({ ...acc, [p.id]: p.province_name }), {}) || {}, [provinces]);
    const categoriesMap = useMemo(() => categories?.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {}) || {}, [categories]);

    const filteredStores = useMemo(() => {
        return (stores || []).filter(store => {
            const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProvince = selectedProvinceFilter === 'all' || store.provinceId === selectedProvinceFilter;
            return matchesSearch && matchesProvince;
        });
    }, [stores, searchTerm, selectedProvinceFilter]);

    // Handlers
    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedStore(null);
        form.reset({
            name: '', imageUrl: '', rating: 0, deliveryTime: '25-35',
            provinceId: undefined, categoryId: undefined,
            latitude: 14.5424, longitude: 49.1333, is_active: true,
            workingHours: defaultWorkingHours,
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (store: Store) => {
        setIsEditing(true);
        setSelectedStore(store);
        form.reset({ ...store, is_active: store.is_active ?? true });
        setIsDialogOpen(true);
    };

    const handleDelete = (store: Store) => {
        setSelectedStore(store);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedStore && firestore) {
            deleteDocumentNonBlocking(doc(firestore, 'stores', selectedStore.id));
            toast({ title: "تم الحذف بنجاح" });
            setIsAlertOpen(false);
        }
    };

    const onSubmit = async (values: StoreFormValues) => {
        if (!firestore) return;
        const dataToSave = { ...values, updatedAt: serverTimestamp() };
        try {
            if (isEditing && selectedStore) {
                updateDocumentNonBlocking(doc(firestore, 'stores', selectedStore.id), dataToSave);
                toast({ title: "تم تحديث المتجر بنجاح" });
            } else {
                addDocumentNonBlocking(collection(firestore, 'stores'), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: "تمت إضافة المتجر بنجاح" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving store:", error);
            toast({ variant: "destructive", title: "حدث خطأ", description: "لم نتمكن من حفظ التغييرات." });
        }
    };

    const isLoading = isLoadingStores || isLoadingProvinces || isLoadingCategories;
    if (isLoading) return <StoresLoading />;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className='flex-shrink-0'>
                            <CardTitle>إدارة المتاجر</CardTitle>
                            <CardDescription>إضافة وتعديل وحذف المتاجر في النظام.</CardDescription>
                        </div>
                        <div className="w-full flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2">
                             <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="ابحث بالاسم..." className="pr-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Select value={selectedProvinceFilter} onValueChange={setSelectedProvinceFilter}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="فلترة بالمحافظة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل المحافظات</SelectItem>
                                    {provinces?.map(p => <SelectItem key={p.id} value={p.id}>{p.province_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAddNew} className="flex-shrink-0">
                                <PlusCircle className="mr-2 h-4 w-4" /> إضافة متجر
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">الشعار</TableHead>
                                    <TableHead className="text-center">اسم المتجر</TableHead>
                                    <TableHead className="text-center">المحافظة</TableHead>
                                    <TableHead className="text-center">الفئة</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStores.length > 0 ? (
                                    filteredStores.map((store) => (
                                        <TableRow key={store.id} className={cn(!store.is_active && "text-muted-foreground bg-muted/50")}>
                                            <TableCell><Image src={store.imageUrl} alt={store.name} width={56} height={56} className="rounded-lg object-cover mx-auto" unoptimized/></TableCell>
                                            <TableCell className="font-medium text-center">{store.name}</TableCell>
                                            <TableCell className="text-center">{provincesMap[store.provinceId] || 'غير محدد'}</TableCell>
                                            <TableCell className="text-center">{categoriesMap[store.categoryId] || 'غير محدد'}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={store.is_active ? 'default' : 'destructive'}>
                                                    {store.is_active ? 'نشط' : 'معطل'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" onClick={() => handleEdit(store)}><Edit/></Button>
                                                    <Button variant="outline" size="icon" onClick={() => handleDelete(store)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash/></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            لا توجد متاجر تطابق بحثك.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">{isEditing ? 'تعديل بيانات المتجر' : 'إضافة متجر جديد'}</DialogTitle>
                        <DialogDescription className="text-right">{isEditing ? 'قم بتحديث تفاصيل المتجر.' : 'أدخل تفاصيل المتجر الجديد.'}</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
                            <Tabs defaultValue="basic" className="w-full" dir="rtl">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                                    <TabsTrigger value="hours">أوقات العمل</TabsTrigger>
                                    <TabsTrigger value="location">الموقع على الخريطة</TabsTrigger>
                                </TabsList>
                                <TabsContent value="basic" className="py-4 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>اسم المتجر</FormLabel><div className="relative"><StoreIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>رابط شعار المتجر</FormLabel>
                                                <div className="relative">
                                                    <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    <FormControl><Input {...field} dir="ltr" className="pr-10" /></FormControl>
                                                </div>
                                                {field.value && (
                                                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input p-2">
                                                        <Image
                                                            src={field.value}
                                                            alt="معاينة الشعار"
                                                            width={80}
                                                            height={80}
                                                            className="rounded-md object-contain"
                                                            unoptimized
                                                        />
                                                    </div>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="provinceId" render={({ field }) => (
                                            <FormItem><FormLabel>المحافظة</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                                    <FormControl><SelectTrigger><div className="flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="اختر المحافظة..." /></div></SelectTrigger></FormControl>
                                                    <SelectContent>{provinces?.map(p => <SelectItem key={p.id} value={p.id}>{p.province_name}</SelectItem>)}</SelectContent>
                                                </Select><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="categoryId" render={({ field }) => (
                                            <FormItem><FormLabel>الفئة العامة</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                                    <FormControl><SelectTrigger><div className="flex items-center gap-2"><Tag className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="اختر الفئة..." /></div></SelectTrigger></FormControl>
                                                    <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                                </Select><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="deliveryTime" render={({ field }) => (
                                            <FormItem><FormLabel>وقت التوصيل (بالدقائق)</FormLabel><div className="relative"><Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input {...field} placeholder="مثال: 25-35" className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="rating" render={({ field }) => (
                                            <FormItem><FormLabel>التقييم المبدئي</FormLabel><div className="relative"><Star className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><FormControl><Input type="number" step="0.1" min="0" max="5" {...field} className="pr-10" /></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="is_active" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>حالة المتجر</FormLabel>
                                            <FormDescription>اختر ما إذا كان المتجر سيظهر للمستخدمين.</FormDescription>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)} className="h-12 text-base"><CheckCircle />نشط</Button>
                                                    <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)} className="h-12 text-base"><XCircle />غير نشط</Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </TabsContent>
                                <TabsContent value="hours" className="py-4 space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                                    {fields.map((field, index) => {
                                        const dayKey = field.day as keyof typeof arabicDays;
                                        return (
                                            <div key={field.id} className="rounded-lg border p-3 bg-muted/50">
                                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                                    <FormField control={form.control} name={`workingHours.${index}.isOpen`} render={({ field: checkboxField }) => (
                                                        <FormItem className="flex items-center gap-2 w-full sm:w-auto">
                                                            <FormControl><Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} /></FormControl>
                                                            <FormLabel className="min-w-[70px] font-bold text-sm">{arabicDays[dayKey]}</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2 flex-grow w-full", !form.watch(`workingHours.${index}.isOpen`) && "opacity-50 pointer-events-none")}>
                                                        <FormField control={form.control} name={`workingHours.${index}.morning_from`} render={({ field }) => (
                                                            <FormItem><FormLabel className="text-xs text-muted-foreground">صباحاً من</FormLabel><FormControl><Input type="time" {...field} className="h-9 text-sm" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`workingHours.${index}.morning_to`} render={({ field }) => (
                                                            <FormItem><FormLabel className="text-xs text-muted-foreground">صباحاً إلى</FormLabel><FormControl><Input type="time" {...field} className="h-9 text-sm" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`workingHours.${index}.evening_from`} render={({ field }) => (
                                                            <FormItem><FormLabel className="text-xs text-muted-foreground">مساءً من</FormLabel><FormControl><Input type="time" {...field} className="h-9 text-sm" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`workingHours.${index}.evening_to`} render={({ field }) => (
                                                            <FormItem><FormLabel className="text-xs text-muted-foreground">مساءً إلى</FormLabel><FormControl><Input type="time" {...field} className="h-9 text-sm" /></FormControl></FormItem>
                                                        )} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </TabsContent>
                                <TabsContent value="location" className="py-4">
                                    <MapPicker 
                                        initialPosition={isEditing ? { lat: form.getValues("latitude"), lng: form.getValues("longitude") } : undefined}
                                        onPositionChange={({lat, lng}) => {
                                            form.setValue('latitude', lat, { shouldValidate: true });
                                            form.setValue('longitude', lng, { shouldValidate: true });
                                        }} 
                                    />
                                    <div className='grid grid-cols-2 gap-2 mt-2'>
                                         <FormField control={form.control} name="latitude" render={({ field }) => (
                                            <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input disabled {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                         <FormField control={form.control} name="longitude" render={({ field }) => (
                                            <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input disabled {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <DialogFooter className="pt-4 flex-row-reverse sm:justify-start gap-2">
                                <Button type="submit">حفظ</Button>
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
                        <AlertDialogDescription className="text-right">هذا الإجراء سيحذف المتجر بشكل دائم.</AlertDialogDescription>
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

    
