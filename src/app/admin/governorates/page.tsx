'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Map, Phone, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import GovernoratesLoading from './loading';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const phoneRegex = new RegExp(/^7[0-9]{8}$/);

// Zod schema for form validation
const provinceSchema = z.object({
  province_name: z.string().min(2, { message: 'اسم المحافظة مطلوب' }),
  customer_service_number: z.string().min(1, { message: 'رقم خدمة العملاء مطلوب' }),
  whatsapp_number: z.string().regex(phoneRegex, { message: 'الرجاء إدخال رقم واتساب يمني صحيح (9 أرقام يبدأ بـ 7)' }),
  is_active: z.boolean().default(true),
});

type ProvinceFormValues = z.infer<typeof provinceSchema>;
type Province = ProvinceFormValues & { id: string, createdAt?: any, updatedAt?: any };

export default function GovernoratesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<ProvinceFormValues>({
        resolver: zodResolver(provinceSchema),
        defaultValues: {
            province_name: '',
            customer_service_number: '',
            whatsapp_number: '',
            is_active: true,
        },
    });

    const provincesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'app_provinces');
    }, [firestore]);
    const { data: provinces, isLoading } = useCollection<Province>(provincesQuery);
    
    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedProvince(null);
        form.reset({
            province_name: '',
            customer_service_number: '',
            whatsapp_number: '',
            is_active: true,
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (province: Province) => {
        setIsEditing(true);
        setSelectedProvince(province);
        form.reset({ ...province, is_active: province.is_active ?? true });
        setIsDialogOpen(true);
    };

    const handleDelete = (province: Province) => {
        setSelectedProvince(province);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedProvince && firestore) {
            const docRef = doc(firestore, 'app_provinces', selectedProvince.id);
            deleteDocumentNonBlocking(docRef);
            toast({ title: "تم الحذف", description: "تم حذف المحافظة بنجاح." });
            setIsAlertOpen(false);
            setSelectedProvince(null);
        }
    };
    
    async function onSubmit(values: ProvinceFormValues) {
        if (!firestore) return;
        
        const dataToSave = {
            ...values,
            updatedAt: serverTimestamp(),
        };

        try {
            if (isEditing && selectedProvince) {
                const docRef = doc(firestore, 'app_provinces', selectedProvince.id);
                updateDocumentNonBlocking(docRef, dataToSave);
                toast({ title: "تم التحديث", description: "تم تحديث بيانات المحافظة بنجاح." });
            } else {
                const collectionRef = collection(firestore, 'app_provinces');
                addDocumentNonBlocking(collectionRef, { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: "تمت الإضافة", description: "تم إضافة المحافظة بنجاح." });
            }
            setIsDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error saving document: ", error);
            toast({
              variant: "destructive",
              title: "حدث خطأ",
              description: "لم نتمكن من حفظ التغييرات. الرجاء المحاولة مرة أخرى.",
            });
        }
    }

    if (isLoading) {
        return <GovernoratesLoading />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>إدارة المحافظات</CardTitle>
                            <CardDescription>إضافة وتعديل وحذف المحافظات وبيانات التواصل الخاصة بها.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            إضافة محافظة
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">اسم المحافظة</TableHead>
                                    <TableHead className="text-center">رقم خدمة العملاء</TableHead>
                                    <TableHead className="text-center">رقم الواتساب</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {provinces && provinces.length > 0 ? (
                                    provinces.map((province) => (
                                        <TableRow key={province.id} className={cn(!province.is_active && "text-muted-foreground bg-muted/50")}>
                                            <TableCell className="font-medium text-center">{province.province_name}</TableCell>
                                            <TableCell className="text-center" dir="ltr">{province.customer_service_number}</TableCell>
                                            <TableCell className="text-center" dir="ltr">{province.whatsapp_number}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={province.is_active ? 'default' : 'secondary'}>
                                                    {province.is_active ? 'نشط' : 'غير نشط'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" onClick={() => handleEdit(province)} className="h-9 w-9">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => handleDelete(province)} className="h-9 w-9 text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10">
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Map className="h-10 w-10" />
                                                <p className="font-semibold">لا توجد محافظات مضافة بعد.</p>
                                                <p className="text-sm">ابدأ بإضافة محافظة جديدة.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {/* أضفنا الكلاسات لعكس مكان زر الإغلاق X إلى اليسار */}
            <DialogContent className="sm:max-w-md rounded-lg [&>button]:right-auto [&>button]:left-4" dir="rtl">
                <DialogHeader className="flex flex-col items-end text-right">
                    <DialogTitle className="w-full text-right font-bold">
                        {isEditing ? 'تعديل بيانات المحافظة' : 'إضافة محافظة جديدة'}
                    </DialogTitle>
                    <DialogDescription className="w-full text-right">
                        {isEditing ? 'قم بتحديث تفاصيل المحافظة.' : 'أدخل تفاصيل المحافظة الجديدة.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {/* حقل اسم المحافظة */}
                        <FormField control={form.control} name="province_name" render={({ field }) => (
                            <FormItem className="text-right">
                                <FormLabel>اسم المحافظة</FormLabel>
                                <div className="relative">
                                    <Map className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input {...field} className="pr-10 h-12 text-right" placeholder="أدخل اسم المحافظة" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* حقل رقم خدمة العملاء */}
                        <FormField control={form.control} name="customer_service_number" render={({ field }) => (
                            <FormItem className="text-right">
                                <FormLabel>رقم خدمة العملاء</FormLabel>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input {...field} type="tel" dir="ltr" className="text-left pr-10 h-12" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* حقل رقم الواتساب */}
                        <FormField control={form.control} name="whatsapp_number" render={({ field }) => (
                            <FormItem className="text-right">
                                <FormLabel>رقم الواتساب</FormLabel>
                                <div className="relative">
                                    <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input {...field} type="tel" dir="ltr" className="text-left pr-10 h-12" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* حالة المحافظة */}
                        <FormField control={form.control} name="is_active" render={({ field }) => (
                            <FormItem className="text-right">
                                <FormLabel>حالة المحافظة</FormLabel>
                                <FormDescription className="text-right">
                                    اختر ما إذا كانت المحافظة ستظهر للمستخدمين.
                                </FormDescription>
                                <FormControl>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant={field.value ? 'default' : 'outline'}
                                            onClick={() => field.onChange(true)}
                                            className="h-12 text-base gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            نشط
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={!field.value ? 'destructive' : 'outline'}
                                            onClick={() => field.onChange(false)}
                                            className="h-12 text-base gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            غير نشط
                                        </Button>
                                    </div>
                                </FormControl>
                            </FormItem>
                        )} />

                        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
                            <Button type="submit" className="flex-1 sm:flex-none">حفظ التغييرات</Button>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="flex-1 sm:flex-none">إلغاء</Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

            {/* --- نافذة التأكيد AlertDialog --- */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent dir="rtl" className="text-right">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد تماماً؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف بيانات المحافظة بشكل دائم.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            نعم، قم بالحذف
                        </AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
    