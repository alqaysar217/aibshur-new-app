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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Link2, CheckCircle, XCircle, HandHeart, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import DonationTypesLoading from './loading';

// Zod schema
const donationTypeSchema = z.object({
  name: z.string().min(2, { message: 'اسم النوع مطلوب' }),
  imageUrl: z.string().min(1, { message: 'رابط الصورة مطلوب' }),
  isActive: z.boolean().default(true),
});

// Type
export type DonationTypeFormValues = z.infer<typeof donationTypeSchema>;
export type DonationType = DonationTypeFormValues & { id: string };

export default function DonationTypesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<DonationType | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<DonationTypeFormValues>({
        resolver: zodResolver(donationTypeSchema),
        defaultValues: {
            name: '',
            imageUrl: '',
            isActive: true,
        },
    });

    const typesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'donationTypes') : null, [firestore]);
    const { data: donationTypes, isLoading } = useCollection<DonationType>(typesQuery);

    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedType(null);
        form.reset({ name: '', imageUrl: '', isActive: true });
        setIsDialogOpen(true);
    };

    const handleEdit = (type: DonationType) => {
        setIsEditing(true);
        setSelectedType(type);
        form.reset({ ...type, isActive: type.isActive ?? true });
        setIsDialogOpen(true);
    };

    const handleDelete = (type: DonationType) => {
        setSelectedType(type);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedType && firestore) {
            deleteDocumentNonBlocking(doc(firestore, 'donationTypes', selectedType.id));
            toast({ title: "تم الحذف بنجاح" });
            setIsAlertOpen(false);
        }
    };

    const onSubmit = (values: DonationTypeFormValues) => {
        if (!firestore) return;
        const collectionRef = collection(firestore, 'donationTypes');
        if (isEditing && selectedType) {
            updateDocumentNonBlocking(doc(collectionRef, selectedType.id), values);
            toast({ title: "تم التحديث بنجاح" });
        } else {
            addDocumentNonBlocking(collectionRef, values);
            toast({ title: "تمت الإضافة بنجاح" });
        }
        setIsDialogOpen(false);
    };

    if (isLoading) {
        return <DonationTypesLoading />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>إدارة أنواع التبرعات</CardTitle>
                            <CardDescription>إضافة وتعديل وحذف أنواع التبرعات المتاحة في النظام.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> إضافة نوع
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px] text-center">الصورة</TableHead>
                                    <TableHead className="text-center">اسم النوع</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center w-[120px]">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donationTypes?.map((type) => (
                                    <TableRow key={type.id} className={cn(!type.isActive && "text-muted-foreground bg-muted/50")}>
                                        <TableCell><Image src={type.imageUrl} alt={type.name} width={64} height={64} className="rounded-lg object-contain mx-auto" unoptimized /></TableCell>
                                        <TableCell className="font-medium text-center">{type.name}</TableCell>
                                        <TableCell className="text-center"><Badge variant={type.isActive ? 'default' : 'secondary'}>{type.isActive ? 'نشط' : 'مخفي'}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEdit(type)}><Edit /></Button>
                                                <Button variant="outline" size="icon" onClick={() => handleDelete(type)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash /></Button>
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
                <DialogContent className="sm:max-w-md [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">{isEditing ? 'تعديل نوع التبرع' : 'إضافة نوع تبرع جديد'}</DialogTitle>
                        <DialogDescription className="text-right">أدخل تفاصيل نوع التبرع.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>اسم النوع</FormLabel>
                                    <div className="relative"><HandHeart className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl><Input {...field} className="pr-10" /></FormControl></div>
                                <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem><FormLabel>رابط صورة النوع</FormLabel>
                                    <div className="relative"><ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl><Input {...field} dir="ltr" className="pr-10" /></FormControl></div>
                                    {field.value && <Image src={field.value} alt="معاينة" width={80} height={80} className="rounded-lg object-contain mt-2 border p-2 mx-auto" unoptimized />}
                                <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="isActive" render={({ field }) => (
                                <FormItem><FormLabel>الحالة</FormLabel><FormDescription>اختر ما إذا كان هذا النوع سيظهر للمستخدمين.</FormDescription>
                                <FormControl><div className="grid grid-cols-2 gap-2 pt-2">
                                    <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)}><CheckCircle />نشط</Button>
                                    <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)}><XCircle />مخفي</Button>
                                </div></FormControl></FormItem>
                            )} />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                <Button type="submit">حفظ</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right">
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>سيتم حذف نوع التبرع بشكل دائم.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
