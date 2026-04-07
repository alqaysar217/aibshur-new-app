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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PlusCircle, Trash, Edit, Banknote } from 'lucide-react';
import BankAccountsLoading from './loading';

// Zod schema for form validation
const bankAccountSchema = z.object({
  bankName: z.string().min(2, { message: 'اسم البنك مطلوب' }),
  accountName: z.string().min(2, { message: 'اسم الحساب مطلوب' }),
  accountNumber: z.string().min(5, { message: 'رقم الحساب مطلوب' }),
  logoUrl: z.string().url({ message: 'الرجاء إدخال رابط صحيح للصورة' }),
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
        },
    });

    // Fetch data from Firestore
    const bankAccountsQuery = useMemoFirebase(() => collection(firestore, 'bankAccounts'), [firestore]);
    const { data: bankAccounts, isLoading } = useCollection<BankAccount>(bankAccountsQuery);
    
    const handleAddNew = () => {
        setIsEditing(false);
        form.reset();
        setIsDialogOpen(true);
    };

    const handleEdit = (account: BankAccount) => {
        setIsEditing(true);
        setSelectedAccount(account);
        form.reset(account);
        setIsDialogOpen(true);
    };

    const handleDelete = (account: BankAccount) => {
        setSelectedAccount(account);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (selectedAccount) {
            const docRef = doc(firestore, 'bankAccounts', selectedAccount.id);
            deleteDocumentNonBlocking(docRef);
            toast({ title: "تم الحذف", description: "تم حذف الحساب البنكي بنجاح." });
            setIsAlertOpen(false);
            setSelectedAccount(null);
        }
    };
    
    async function onSubmit(values: BankAccountFormValues) {
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
                                    <TableHead>شعار البنك</TableHead>
                                    <TableHead>اسم البنك</TableHead>
                                    <TableHead>اسم الحساب</TableHead>
                                    <TableHead>رقم الحساب</TableHead>
                                    <TableHead>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bankAccounts && bankAccounts.length > 0 ? (
                                    bankAccounts.map((account) => (
                                        <TableRow key={account.id}>
                                            <TableCell>
                                                <Image src={account.logoUrl} alt={account.bankName} width={40} height={40} className="rounded-md object-contain" />
                                            </TableCell>
                                            <TableCell className="font-medium">{account.bankName}</TableCell>
                                            <TableCell>{account.accountName}</TableCell>
                                            <TableCell>{account.accountNumber}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">فتح القائمة</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(account)}>
                                                            <Edit className="ml-2 h-4 w-4" />
                                                            تعديل
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(account)} className="text-destructive">
                                                            <Trash className="ml-2 h-4 w-4" />
                                                            حذف
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'تعديل الحساب البنكي' : 'إضافة حساب بنكي جديد'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'قم بتحديث تفاصيل الحساب البنكي.' : 'أدخل تفاصيل الحساب البنكي الجديد.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="bankName" render={({ field }) => (
                                <FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="accountName" render={({ field }) => (
                                <FormItem><FormLabel>اسم صاحب الحساب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                <FormItem><FormLabel>رقم الحساب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField
                                control={form.control}
                                name="logoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رابط شعار البنك</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="https://... or /logo.png"/>
                                        </FormControl>
                                        <FormMessage />
                                        {field.value && (
                                            <div className="mt-2 flex justify-center rounded-lg border border-dashed p-4">
                                                <Image
                                                    src={field.value}
                                                    alt="معاينة الشعار"
                                                    width={80}
                                                    height={80}
                                                    className="rounded-md object-contain"
                                                    key={field.value}
                                                />
                                            </div>
                                        )}
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
