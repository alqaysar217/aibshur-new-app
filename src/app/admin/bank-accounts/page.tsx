'use client';
import { useState } from 'react';
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
import { PlusCircle, Trash, Edit, Banknote, User, Wallet, Link2 } from 'lucide-react';
import BankAccountsLoading from './loading';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Zod schema for form validation
const bankAccountSchema = z.object({
  bankName: z.string().min(2, { message: 'اسم البنك مطلوب' }),
  accountName: z.string().min(2, { message: 'اسم الحساب مطلوب' }),
  accountNumber: z.string().min(5, { message: 'رقم الحساب مطلوب' }),
  logoUrl: z.string().min(1, { message: 'الرجاء إدخال رابط أو مسار صحيح للصورة' }),
  isActive: z.boolean().default(true),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;
type BankAccount = BankAccountFormValues & { id: string };

export default function BankAccountsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<BankAccountFormValues>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: {
            bankName: '',
            accountName: '',
            accountNumber: '',
            logoUrl: '',
            isActive: true,
        },
    });

    // Fetch data from Firestore
    const bankAccountsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'bankAccounts');
    }, [firestore]);
    const { data: bankAccounts, isLoading } = useCollection<BankAccount>(bankAccountsQuery);
    
    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedAccount(null);
        form.reset({
            bankName: '',
            accountName: '',
            accountNumber: '',
            logoUrl: '',
            isActive: true,
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (account: BankAccount) => {
        setIsEditing(true);
        setSelectedAccount(account);
        form.reset({ ...account, isActive: account.isActive ?? true });
        setIsDialogOpen(true);
    };

    const handleDelete = (account: BankAccount) => {
        setSelectedAccount(account);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedAccount && firestore) {
            const docRef = doc(firestore, 'bankAccounts', selectedAccount.id);
            deleteDocumentNonBlocking(docRef);
            toast({ title: "تم الحذف", description: "تم حذف الحساب البنكي بنجاح." });
            setIsAlertOpen(false);
            setSelectedAccount(null);
        }
    };
    
    const handleStatusChange = (account: BankAccount, newStatus: boolean) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'bankAccounts', account.id);
        updateDocumentNonBlocking(docRef, { isActive: newStatus });
        toast({
            title: "تم تحديث الحالة",
            description: `حساب ${account.bankName} الآن ${newStatus ? 'نشط' : 'غير نشط'}.`,
        });
    };
    
    async function onSubmit(values: BankAccountFormValues) {
        if (!firestore) return;
        try {
            if (isEditing && selectedAccount) {
                const docRef = doc(firestore, 'bankAccounts', selectedAccount.id);
                updateDocumentNonBlocking(docRef, values);
                toast({ title: "تم التحديث", description: "تم تحديث الحساب البنكي بنجاح." });
            } else {
                const collectionRef = collection(firestore, 'bankAccounts');
                addDocumentNonBlocking(collectionRef, values);
                toast({ title: "تمت الإضافة", description: "تم إضافة الحساب البنكي بنجاح." });
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
        return <BankAccountsLoading />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>إدارة الحسابات البنكية</CardTitle>
                            <CardDescription>إضافة وتعديل وحذف الحسابات البنكية للنظام.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            إضافة حساب بنكي
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px] text-center">الشعار</TableHead>
                                    <TableHead className="text-center">اسم البنك</TableHead>
                                    <TableHead className="text-center">اسم الحساب</TableHead>
                                    <TableHead className="text-center">رقم الحساب</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bankAccounts && bankAccounts.length > 0 ? (
                                    bankAccounts.map((account) => (
                                        <TableRow key={account.id} className={cn(account.isActive === false && "text-muted-foreground bg-muted/50")}>
                                            <TableCell>
                                                <Image src={account.logoUrl} alt={account.bankName} width={48} height={48} className="rounded-md object-contain mx-auto" />
                                            </TableCell>
                                            <TableCell className="font-medium text-center">{account.bankName}</TableCell>
                                            <TableCell className="text-center">{account.accountName}</TableCell>
                                            <TableCell className="text-center">{account.accountNumber}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <Switch
                                                        checked={account.isActive ?? true}
                                                        onCheckedChange={(newStatus) => handleStatusChange(account, newStatus)}
                                                        aria-label="Account status"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" onClick={() => handleEdit(account)} className="h-9 w-9">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => handleDelete(account)} className="h-9 w-9 text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10">
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Banknote className="h-10 w-10" />
                                                <p className="font-semibold">لا توجد حسابات بنكية بعد.</p>
                                                <p className="text-sm">ابدأ بإضافة حساب جديد.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'تعديل الحساب البنكي' : 'إضافة حساب بنكي جديد'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'قم بتحديث تفاصيل الحساب البنكي.' : 'أدخل تفاصيل الحساب البنكي الجديد.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="bankName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم البنك</FormLabel>
                                    <div className="relative">
                                        <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl><Input {...field} className="pr-10 h-12" /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="accountName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم صاحب الحساب</FormLabel>
                                     <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl><Input {...field} className="pr-10 h-12" /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رقم الحساب</FormLabel>
                                     <div className="relative">
                                        <Wallet className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl><Input {...field} className="pr-10 h-12" /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField
                                control={form.control}
                                name="logoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رابط شعار البنك</FormLabel>
                                        <div className="relative">
                                            <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <FormControl>
                                                <Input {...field} dir="ltr" className="text-left pr-10 h-12" placeholder="https://... or /logo.png"/>
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                        {field.value && (
                                            <div className="mt-4 flex justify-center rounded-lg border border-dashed p-4">
                                                <Image
                                                    src={field.value}
                                                    alt="معاينة الشعار"
                                                    width={80}
                                                    height={80}
                                                    className="rounded-md object-contain"
                                                    key={field.value}
                                                    unoptimized
                                                />
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>تفعيل الحساب</FormLabel>
                                            <FormDescription>
                                                سيظهر الحساب للمستخدمين عند تفعيله.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                             <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                <Button type="submit">حفظ التغييرات</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الحساب البنكي بشكل دائم.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
