'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
    Settings as SettingsIcon, AppWindow, Palette, Bot, SlidersHorizontal, Bell, Mail, MessageSquare, BadgeInfo, CircleDollarSign, Tractor, Power, Upload, Phone, CheckCircle, XCircle, Database, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { seedDatabase } from '@/lib/seed';
import { useState } from 'react';
import SettingsLoading from './loading';

const settingsSchema = z.object({
    appName: z.string().min(2, "اسم التطبيق مطلوب"),
    supportEmail: z.string().email("بريد إلكتروني غير صالح"),
    supportPhone: z.string().min(9, "رقم هاتف غير صالح"),
    currencySymbol: z.string().min(1, "رمز العملة مطلوب"),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "لون غير صالح"),
    appLogo: z.string().optional(),
    defaultDeliveryFee: z.coerce.number().min(0, "يجب أن تكون قيمة موجبة"),
    maintenanceMode: z.boolean(),
    enableEmailNotifications: z.boolean(),
    enablePushNotifications: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

function SeederCard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeedDatabase = async () => {
        if (!firestore) return;
        setIsSeeding(true);
        toast({ title: 'بدء عملية تهيئة البيانات...', description: 'قد تستغرق هذه العملية بضع لحظات.' });

        try {
            await seedDatabase(firestore);
            toast({ title: 'اكتملت التهيئة بنجاح!', description: 'تمت إضافة البيانات الوهمية إلى قاعدة البيانات.' });
        } catch (error) {
            console.error("Seeding failed: ", error);
            toast({ variant: 'destructive', title: 'فشلت عملية التهيئة', description: 'حدث خطأ أثناء كتابة البيانات.' });
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>تهيئة بيانات النظام</CardTitle>
                <CardDescription>
                    استخدم هذا الخيار لإضافة مجموعة من البيانات المبدئية والوهمية (مثل منتجات، متاجر، تذاكر دعم) إلى قاعدة البيانات. هذا يساعد في اختبار الواجهات وتجربتها دون الحاجة لإدخال كل شيء يدوياً.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive font-semibold">تحذير: هذه العملية ستقوم بالكتابة فوق أي بيانات موجودة بنفس المعرفات (IDs). استخدمها فقط في بيئة التطوير.</p>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSeedDatabase} disabled={isSeeding} variant="destructive">
                    {isSeeding ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Database className="ml-2"/>}
                    تهيئة قاعدة البيانات بالبيانات المبدئية
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function SettingsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'systemSettings', 'main') : null, [firestore]);
    const { data: currentSettings, isLoading } = useDoc<SettingsFormValues>(settingsDocRef);
    
    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        values: currentSettings || {
            appName: 'تطبيق أبشر',
            supportEmail: 'support@absher.com',
            supportPhone: '+967 777 777 777',
            currencySymbol: 'ر.ي',
            primaryColor: '#1FAF9A',
            appLogo: '/logo.png',
            defaultDeliveryFee: 500,
            maintenanceMode: false,
            enableEmailNotifications: true,
            enablePushNotifications: true,
        },
    });

    function onSubmit(data: SettingsFormValues) {
        if (!settingsDocRef) return;
        updateDocumentNonBlocking(settingsDocRef, data);
        toast({
            title: "تم حفظ الإعدادات",
            description: "تم تحديث إعدادات النظام بنجاح.",
        });
    }

    if (isLoading) {
        return <SettingsLoading />;
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-black text-foreground">إعدادات النظام</h1>
                <p className="text-muted-foreground mt-1">التحكم في الإعدادات العامة، المظهر، التشغيل، والإشعارات للتطبيق.</p>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs defaultValue="general" dir="rtl">
                        <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-4">
                            <TabsTrigger value="general" className="gap-2"><SettingsIcon/>الإعدادات العامة</TabsTrigger>
                            <TabsTrigger value="appearance" className="gap-2"><Palette/>المظهر والهوية</TabsTrigger>
                            <TabsTrigger value="operational" className="gap-2"><SlidersHorizontal/>الإعدادات التشغيلية</TabsTrigger>
                            <TabsTrigger value="notifications" className="gap-2"><Bell/>الإشعارات والتنبيهات</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>الإعدادات العامة</CardTitle>
                                    <CardDescription>إدارة المعلومات الأساسية وبيانات التواصل للتطبيق.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="appName" render={({ field }) => (
                                            <FormItem><FormLabel className="flex items-center gap-2"><AppWindow/>اسم التطبيق</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="currencySymbol" render={({ field }) => (
                                            <FormItem><FormLabel className="flex items-center gap-2"><CircleDollarSign/>رمز العملة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="supportEmail" render={({ field }) => (
                                            <FormItem><FormLabel className="flex items-center gap-2"><Mail/>بريد الدعم الفني</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="supportPhone" render={({ field }) => (
                                            <FormItem><FormLabel className="flex items-center gap-2"><Phone/>هاتف الدعم الفني</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                                <CardFooter><Button type="submit">حفظ التغييرات</Button></CardFooter>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="appearance">
                             <Card>
                                <CardHeader>
                                    <CardTitle>المظهر والهوية</CardTitle>
                                    <CardDescription>تخصيص هوية التطبيق البصرية والألوان.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                        <FormField control={form.control} name="primaryColor" render={({ field }) => (
                                            <FormItem><FormLabel className="flex items-center gap-2"><Palette/>اللون الأساسي</FormLabel><FormControl>
                                                <div className="relative">
                                                    <Input type="text" {...field} dir="ltr" className="pl-12"/>
                                                    <Input type="color" value={field.value} onChange={field.onChange} className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-10 p-0.5 border-none cursor-pointer"/>
                                                </div>
                                            </FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="appLogo" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Upload/>شعار التطبيق (رابط)</FormLabel>
                                                <FormControl><Input {...field} placeholder="https://example.com/logo.png أو /logo.png" dir="ltr" /></FormControl>
                                                {field.value && (
                                                    <div className="mt-2 flex justify-center rounded-lg border border-dashed p-2">
                                                        <Image src={field.value} alt="معاينة الشعار" width={80} height={80} className="rounded-md object-contain" unoptimized/>
                                                    </div>
                                                )}
                                                <FormDescription>أدخل رابطًا لشعار التطبيق (داخلي أو خارجي).</FormDescription>
                                            </FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                                <CardFooter><Button type="submit">حفظ التغييرات</Button></CardFooter>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="operational">
                            <Card>
                                <CardHeader>
                                    <CardTitle>الإعدادات التشغيلية</CardTitle>
                                    <CardDescription>التحكم في الجوانب التشغيلية للتطبيق مثل رسوم التوصيل والصيانة.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <FormField control={form.control} name="defaultDeliveryFee" render={({ field }) => (
                                        <FormItem><FormLabel className="flex items-center gap-2"><Tractor/>رسوم التوصيل الافتراضية</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="maintenanceMode" render={({ field }) => (
                                        <FormItem className="rounded-lg border p-4">
                                            <FormLabel className="text-base flex items-center gap-2"><Power/>وضع الصيانة</FormLabel>
                                            <FormDescription>عند التفعيل، سيظهر للمستخدمين أن التطبيق تحت الصيانة.</FormDescription>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <Button type="button" variant={field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(true)}>
                                                        <Power /> تفعيل
                                                    </Button>
                                                    <Button type="button" variant={!field.value ? 'default' : 'outline'} onClick={() => field.onChange(false)}>
                                                        <CheckCircle /> إيقاف
                                                    </Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </CardContent>
                                <CardFooter><Button type="submit">حفظ التغييرات</Button></CardFooter>
                            </Card>
                        </TabsContent>
                        
                         <TabsContent value="notifications">
                             <Card>
                                <CardHeader>
                                    <CardTitle>الإشعارات والتنبيهات</CardTitle>
                                    <CardDescription>إدارة إعدادات إرسال الإشعارات عبر القنوات المختلفة.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="enablePushNotifications" render={({ field }) => (
                                        <FormItem className="rounded-lg border p-4">
                                            <FormLabel className="text-base flex items-center gap-2"><MessageSquare/>إشعارات التطبيق (Push)</FormLabel>
                                            <FormDescription>إرسال إشعارات مباشرة إلى هواتف المستخدمين.</FormDescription>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)}>
                                                        <CheckCircle /> تفعيل
                                                    </Button>
                                                    <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)}>
                                                        <XCircle /> تعطيل
                                                    </Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="enableEmailNotifications" render={({ field }) => (
                                        <FormItem className="rounded-lg border p-4">
                                            <FormLabel className="text-base flex items-center gap-2"><Mail/>إشعارات البريد الإلكتروني</FormLabel>
                                            <FormDescription>إرسال تحديثات هامة عبر البريد الإلكتروني.</FormDescription>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <Button type="button" variant={field.value ? 'default' : 'outline'} onClick={() => field.onChange(true)}>
                                                        <CheckCircle /> تفعيل
                                                    </Button>
                                                    <Button type="button" variant={!field.value ? 'destructive' : 'outline'} onClick={() => field.onChange(false)}>
                                                        <XCircle /> تعطيل
                                                    </Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </CardContent>
                                <CardFooter><Button type="submit">حفظ التغييرات</Button></CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>
            <div className="pt-6">
                <SeederCard />
            </div>
        </div>
    );
}
