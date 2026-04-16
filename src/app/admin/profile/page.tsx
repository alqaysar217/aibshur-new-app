'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection } from '@/firebase'; 
import { doc, collection, query, where } from 'firebase/firestore';

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
  personalPhotoUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isNewUser, setIsNewUser] = useState(false);
    const [phone, setPhone] = useState<string | null>(null);

    // Get phone from localStorage
    useEffect(() => {
        setPhone(localStorage.getItem('userPhone'));
    }, []);

    // Fetch profile using the phone number
    const adminQuery = useMemoFirebase(() => {
        if (!firestore || !phone) return null;
        return query(collection(firestore, 'admins'), where('phone', '==', phone));
    }, [firestore, phone]);
    
    const { data: adminProfiles, isLoading: isLoadingProfile } = useCollection<Admin>(adminQuery);
    const adminProfile = useMemo(() => adminProfiles?.[0], [adminProfiles]);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            phone: '',
            address: '',
            personalPhotoUrl: '',
        },
    });

    // This useEffect populates the form once the profile is loaded
    useEffect(() => {
        if (isLoadingProfile) return; // Wait until loading is done

        const phoneFromStorage = localStorage.getItem('userPhone');

        if (adminProfile) {
            // Profile exists, populate the form
            setIsNewUser(false);
            form.reset({
                name: adminProfile.name,
                phone: adminProfile.phone, // Use data from DB
                address: adminProfile.address,
                personalPhotoUrl: adminProfile.personalPhotoUrl || '',
            });
        } else if(phoneFromStorage) {
            // No profile exists, prepare for creation
            setIsNewUser(true);
            form.reset({
                name: '',
                phone: phoneFromStorage, // Pre-fill phone from storage
                address: '',
                personalPhotoUrl: '',
            })
        }
    }, [adminProfile, isLoadingProfile, form]);

    const onSubmit = (values: ProfileFormValues) => {
        if (!firestore) return;

        if (adminProfile?.id) { // If profile exists, update it
            const docRef = doc(firestore, 'admins', adminProfile.id);
            // Use simple update, no need for complex setDoc with merge for this case
            updateDocumentNonBlocking(docRef, values);
            toast({ title: "تم تحديث الملف الشخصي", description: "تم حفظ بياناتك بنجاح." });

        } else { // Profile doesn't exist, create it
            const dataToSave = { 
                ...values,
                permissions: { canUseCustomerApp: true, canUseDriverApp: true, canUseDashboard: true },
                dashboardAccess: dashboardPages.map(p => p.id),
                is_active: true,
            };
            addDocumentNonBlocking(collection(firestore, 'admins'), dataToSave);
            toast({ title: "تم إنشاء الملف الشخصي", description: "تم حفظ بياناتك بنجاح." });
            setIsNewUser(false); // After creation, it's no longer a "new user" for this session
        }
    };

    const isLoading = isUserLoading || isLoadingProfile;
    if (isLoading) {
        return <ProfileLoading />;
    }

    const photoUrl = form.watch('personalPhotoUrl');

    const dashboardPages = [
        { id: 'dashboard', label: 'الرئيسية' },
        { id: 'sales-reports', label: 'تقارير المبيعات' },
        { id: 'orders', label: 'إدارة الطلبات' },
        { id: 'appointments', label: 'إدارة المواعيد' },
        { id: 'stores', label: 'إدارة المتاجر' },
        { id: 'products', label: 'إدارة المنتجات' },
        { id: 'categories', label: 'إدارة الفئات' },
        { id: 'users', label: 'إدارة المستخدمين' },
        { id: 'delegates', label: 'طلبات المناديب' },
        { id: 'ads', label: 'إدارة الإعلانات' },
        { id: 'coupons', label: 'إدارة الكوبونات' },
        { id: 'notifications', label: 'إدارة الإشعارات' },
        { id: 'donations', label: 'إدارة التبرعات' },
        { id: 'donation-types', label: 'إدارة أنواع التبرعات' },
        { id: 'vip', label: 'باقات VIP' },
        { id: 'loyalty', label: 'نقاط الولاء' },
        { id: 'wallets', label: 'إدارة المحافظ' },
        { id: 'governorates', label: 'إدارة المحافظات' },
        { id: 'bank-accounts', label: 'الحسابات البنكية' },
        { id: 'performance', label: 'أداء الموظفين' },
        { id: 'settings', label: 'إعدادات النظام' },
        { id: 'support', label: 'الدعم الفني' },
    ];


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-foreground">الملف الشخصي</h1>
                <p className="text-muted-foreground mt-1">عرض وتحديث معلومات حسابك كمسؤول في النظام.</p>
            </div>
            
            {isNewUser && (
                 <Card className="border-blue-500 bg-blue-50">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                        <AlertCircle className="h-6 w-6 text-blue-700" />
                        <div>
                            <CardTitle className="text-blue-900">مرحباً بك! قم بإنشاء ملفك الشخصي كمسؤول.</CardTitle>
                            <CardDescription className="text-blue-800">
                                يبدو أن هذا أول دخول لك. يرجى إكمال بياناتك لإنشاء حساب المسؤول الخاص بك. سيتم منحك جميع الصلاحيات تلقائياً.
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
                                            <FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl>
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
                                                    <Image src={photoUrl} alt="الصورة الشخصية" layout="fill" objectFit="cover" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User className="w-20 h-20 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                             <FormControl><Input {...field} placeholder="https://... أو /logo.png" className="mt-4 text-left" dir="ltr" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                <Save /> {isNewUser ? 'إنشاء وحفظ الملف الشخصي' : 'حفظ التغييرات'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
