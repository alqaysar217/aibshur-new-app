'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, MapPin, Save, Upload } from 'lucide-react';
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

    const adminDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'admins', user.uid);
    }, [firestore, user]);

    const { data: adminProfile, isLoading: isLoadingProfile } = useDoc<Admin>(adminDocRef);

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
        if (adminProfile) {
            form.reset({
                name: adminProfile.name,
                phone: adminProfile.phone,
                address: adminProfile.address,
                personalPhotoUrl: adminProfile.personalPhotoUrl || '',
            });
        }
    }, [adminProfile, form]);

    const onSubmit = (values: ProfileFormValues) => {
        if (!adminDocRef) return;
        updateDocumentNonBlocking(adminDocRef, values);
        toast({
            title: "تم تحديث الملف الشخصي",
            description: "تم حفظ بياناتك بنجاح.",
        });
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
                <p className="text-muted-foreground mt-1">عرض وتحديث معلومات حسابك الشخصي.</p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>بيانات الحساب</CardTitle>
                            <CardDescription>هذه هي المعلومات التي تظهر في النظام.</CardDescription>
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
                                <Save /> حفظ التغييرات
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
