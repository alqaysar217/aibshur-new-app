'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase'; 
import { doc, collection } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, MapPin, Save, Upload, AlertCircle } from 'lucide-react';
import ProfileLoading from './loading';
import type { Admin } from '../users/page';

const profileSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب (حرفين على الأقل)"),
  phone: z.string().min(9, "رقم الهاتف غير صالح"),
  address: z.string().min(5, "العنوان مطلوب (5 أحرف على الأقل)"),
  personalPhotoUrl: z.string().url({ message: "الرجاء إدخال رابط صورة صالح" }).or(z.literal('')).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isFirstTime, setIsFirstTime] = useState(false);

    // Fetch the entire 'admins' collection
    const adminsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'admins');
    }, [firestore]);
    
    const { data: allAdmins, isLoading: isLoadingProfile } = useCollection<Admin>(adminsCollectionRef);

    // For simplicity, we'll assume the first admin in the collection is our current user.
    // This is a workaround for the unlinked anonymous auth.
    const adminProfile = useMemo(() => allAdmins?.[0], [allAdmins]);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            phone: '',
            address: '',
            personalPhotoUrl: '',
        },
    });

    useEffect(() => {
        if (!isLoadingProfile && !adminProfile) {
            setIsFirstTime(true);
        }
        if (adminProfile) {
            setIsFirstTime(false);
            form.reset({
                name: adminProfile.name,
                phone: adminProfile.phone,
                address: adminProfile.address,
                personalPhotoUrl: adminProfile.personalPhotoUrl || '',
            });
        }
    }, [adminProfile, isLoadingProfile, form]);

    const onSubmit = (values: ProfileFormValues) => {
        if (!firestore) return;

        // If a profile was loaded, use its ID. If not (first time), use the current auth user's ID to create a new doc.
        const docId = adminProfile ? adminProfile.id : user?.uid;
        if (!docId) {
             toast({
                variant: "destructive",
                title: "خطأ",
                description: "لا يمكن تحديد المستخدم للحفظ.",
            });
            return;
        }

        const docToUpdateRef = doc(firestore, 'admins', docId);

        setDocumentNonBlocking(docToUpdateRef, values, { merge: true });
        toast({
            title: isFirstTime ? "تم إنشاء الملف الشخصي" : "تم تحديث الملف الشخصي",
            description: "تم حفظ بياناتك بنجاح.",
        });
        setIsFirstTime(false);
    };

    const isLoading = isUserLoading || isLoadingProfile;
    if (isLoading) {
        return <ProfileLoading />;
    }

    const photoUrl = form.watch('personalPhotoUrl');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-foreground">الملف الشخصي</h1>
                <p className="text-muted-foreground mt-1">عرض وتحديث معلومات حسابك كمسؤول في النظام.</p>
            </div>
            
            {isFirstTime && (
                 <Card className="border-blue-500 bg-blue-50">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                        <AlertCircle className="h-6 w-6 text-blue-700" />
                        <div>
                            <CardTitle className="text-blue-900">مرحباً بك! قم بإنشاء ملفك الشخصي كمسؤول.</CardTitle>
                            <CardDescription className="text-blue-800">
                                يبدو أنه لا يوجد أي مسؤول في النظام. يرجى إكمال بياناتك لإنشاء أول حساب مسؤول.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>بيانات حساب المسؤول</CardTitle>
                            <CardDescription>هذه المعلومات خاصة بحسابك الإداري.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
                            <div className="md:col-span-2 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><User /> الاسم الكامل</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Phone /> رقم الهاتف</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><MapPin /> العنوان</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-4">
                               <FormField
                                    control={form.control}
                                    name="personalPhotoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Upload/> الصورة الشخصية</FormLabel>
                                            <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary/10 shadow-md bg-muted">
                                                {photoUrl ? (
                                                    <Image src={photoUrl} alt="الصورة الشخصية" layout="fill" objectFit="cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User className="w-20 h-20 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                             <FormControl><Input {...field} placeholder="https://example.com/photo.png" className="mt-4 text-left" dir="ltr" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                <Save /> {isFirstTime ? 'إنشاء وحفظ الملف الشخصي' : 'حفظ التغييرات'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
