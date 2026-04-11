'use client';
import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Bell, Send, Users, Globe, MapPin, Link as LinkIcon, Settings, History, Trash, FileEdit, Package, Bike,
    Radio, Percent, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import NotificationsLoading from './loading';
import { Badge } from '@/components/ui/badge';

// MOCK DATA for display
const mockProvinces = [
    { id: 'prov1', name: 'صنعاء' },
    { id: 'prov2', name: 'حضرموت' },
    { id: 'prov3', name: 'عدن' },
];

const mockLogs = [
    { id: 'log1', title: 'خصم 20% على مطاعم محددة', type: 'promotion', target: '5,000 مستخدم', readRate: '65%', date: 'اليوم' },
    { id: 'log2', title: 'تحديث جديد متوفر!', type: 'system', target: 'الكل', readRate: '80%', date: 'الأمس' },
    { id: 'log3', title: 'طلبك #123 في الطريق', type: 'order_status', target: 'أحمد علي', readRate: '100%', date: 'الأمس' },
];

const mockTemplates = [
    { id: 'accepted', title: 'عند قبول الطلب', icon: Package, template: 'تم قبول طلبك #{orderId} من متجر {storeName} وهو قيد التجهيز.', isActive: true },
    { id: 'dispatched', title: 'عند إرسال الطلب مع المندوب', icon: Bike, template: 'مندوبنا {delegateName} في الطريق إليك لتسليم طلبك!', isActive: true },
];

// Zod Schemas
const broadcastSchema = z.object({
  type: z.enum(['promotion', 'system', 'update'], { required_error: 'يجب اختيار نوع الإشعار' }),
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  body: z.string().min(10, 'نص الإشعار يجب أن يكون 10 أحرف على الأقل'),
  targetType: z.enum(['all', 'user', 'province']),
  targetValue: z.string().optional(),
  link: z.string().optional(),
}).superRefine((data, ctx) => {
    if ((data.targetType === 'user' || data.targetType === 'province') && !data.targetValue) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['targetValue'],
            message: 'يجب تحديد قيمة للجمهور المستهدف',
        });
    }
});

// Component
export default function NotificationsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [templates, setTemplates] = useState(mockTemplates);

    // Forms
    const broadcastForm = useForm<z.infer<typeof broadcastSchema>>({
        resolver: zodResolver(broadcastSchema),
        defaultValues: {
            type: 'promotion',
            title: '',
            body: '',
            targetType: 'all',
            targetValue: '',
            link: '',
        }
    });

    useState(() => {
        setTimeout(() => setIsLoading(false), 1000);
    });

    const targetType = broadcastForm.watch('targetType');

    function onBroadcastSubmit(values: z.infer<typeof broadcastSchema>) {
        console.log("Sending notification:", values);
        toast({
            title: 'تم إرسال الإشعار بنجاح',
            description: `تم إرسال "${values.title}" إلى الجمهور المستهدف.`,
        });
        broadcastForm.reset();
    }
    
    function onTemplateSave(templateId: string, newTemplate: string) {
        setTemplates(current => current.map(t => t.id === templateId ? {...t, template: newTemplate } : t));
         toast({ title: 'تم حفظ القالب بنجاح' });
    }

    if (isLoading) {
        return <NotificationsLoading />;
    }
    
    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-black text-foreground">إدارة الإشعارات</h1>
                <p className="text-muted-foreground mt-1">إرسال إشعارات مخصصة وتعديل القوالب التلقائية ومراقبة السجلات.</p>
            </div>
            
            <Tabs defaultValue="sender" dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sender" className="gap-2"><Send/>إرسال إشعار</TabsTrigger>
                    <TabsTrigger value="triggers" className="gap-2"><Settings/>الإشعارات التلقائية</TabsTrigger>
                    <TabsTrigger value="log" className="gap-2"><History/>سجل الإشعارات</TabsTrigger>
                </TabsList>

                <TabsContent value="sender" className="mt-4">
                     <Form {...broadcastForm}>
                        <form onSubmit={broadcastForm.handleSubmit(onBroadcastSubmit)}>
                             <Card>
                                <CardHeader>
                                    <CardTitle>مرسل الإشعارات العام</CardTitle>
                                    <CardDescription>أرسل إشعارات ترويجية أو تنبيهات هامة للمستخدمين.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={broadcastForm.control} name="type" render={({ field }) => (
                                            <FormItem><FormLabel>نوع الإشعار</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="promotion"><div className="flex items-center gap-2"><Percent/>عرض ترويجي</div></SelectItem><SelectItem value="system"><div className="flex items-center gap-2"><CheckCircle/>تنبيه نظام</div></SelectItem><SelectItem value="update"><div className="flex items-center gap-2"><Radio/>تحديث</div></SelectItem></SelectContent></Select><FormMessage/></FormItem>
                                        )}/>
                                        <FormField control={broadcastForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} placeholder="مثال: خصم 50%!"/></FormControl><FormMessage/></FormItem>)}/>
                                    </div>
                                    <FormField control={broadcastForm.control} name="body" render={({ field }) => (<FormItem><FormLabel>نص الإشعار</FormLabel><FormControl><Textarea {...field} placeholder="أدخل تفاصيل الإشعار هنا..."/></FormControl><FormMessage/></FormItem>)}/>
                                    
                                    <FormField control={broadcastForm.control} name="targetType" render={({ field }) => (
                                        <FormItem className="space-y-3"><FormLabel>الجمهور المستهدف</FormLabel><FormControl>
                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <FormItem><Card className="p-4"><FormControl><RadioGroupItem value="all" className="sr-only"/></FormControl><FormLabel className="font-normal flex items-center gap-3 cursor-pointer"><Globe/> إرسال للكل</FormLabel></Card></FormItem>
                                                <FormItem><Card className="p-4"><FormControl><RadioGroupItem value="user" className="sr-only"/></FormControl><FormLabel className="font-normal flex items-center gap-3 cursor-pointer"><Users/> مستخدم محدد</FormLabel></Card></FormItem>
                                                <FormItem><Card className="p-4"><FormControl><RadioGroupItem value="province" className="sr-only"/></FormControl><FormLabel className="font-normal flex items-center gap-3 cursor-pointer"><MapPin/> محافظة محددة</FormLabel></Card></FormItem>
                                            </RadioGroup>
                                        </FormControl></FormItem>
                                    )}/>

                                    {targetType === 'user' && <FormField control={broadcastForm.control} name="targetValue" render={({ field }) => (<FormItem><FormLabel>معرف المستخدم (UID)</FormLabel><FormControl><Input {...field} placeholder="أدخل معرف المستخدم..."/></FormControl><FormMessage/></FormItem>)} />}
                                    {targetType === 'province' && <FormField control={broadcastForm.control} name="targetValue" render={({ field }) => (<FormItem><FormLabel>اختر المحافظة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر..."/></SelectTrigger></FormControl><SelectContent>{mockProvinces.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)} />}

                                    <FormField control={broadcastForm.control} name="link" render={({ field }) => (<FormItem><FormLabel>رابط التوجيه (اختياري)</FormLabel><div className="relative"><LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><FormControl><Input {...field} placeholder="/store/STORE_ID or /orders" className="pr-10" dir="ltr"/></FormControl></div><FormMessage/></FormItem>)}/>
                                </CardContent>
                                <CardFooter><Button type="submit"><Send/> إرسال الإشعار</Button></CardFooter>
                            </Card>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="triggers" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>قوالب الإشعارات التلقائية</CardTitle>
                            <CardDescription>تعديل النصوص التي يتم إرسالها تلقائياً عند تحديث حالة الطلبات.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {templates.map((template, index) => {
                                const Icon = template.icon;
                                return (
                                    <Card key={template.id}>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-6 w-6 text-primary"/>
                                                <CardTitle className="text-base">{template.title}</CardTitle>
                                            </div>
                                            <Switch checked={template.isActive} onCheckedChange={(checked) => setTemplates(current => current.map(t => t.id === template.id ? {...t, isActive: checked} : t))} />
                                        </CardHeader>
                                        <CardContent>
                                            <Textarea defaultValue={template.template} onBlur={(e) => onTemplateSave(template.id, e.target.value)} />
                                            <p className="text-xs text-muted-foreground pt-2">
                                                المتغيرات المتاحة: `'{'{orderId}'}'`, `'{'{storeName}'}'`, `'{'{delegateName}'}'`
                                            </p>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="log" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>سجل الإشعارات المرسلة</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow>
                                        <TableHead className="text-center">عنوان الإشعار</TableHead>
                                        <TableHead className="text-center">النوع</TableHead>
                                        <TableHead className="text-center">المرسل إليهم</TableHead>
                                        <TableHead className="text-center">نسبة الفتح</TableHead>
                                        <TableHead className="text-center">التاريخ</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                        {mockLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-center font-medium">{log.title}</TableCell>
                                                <TableCell className="text-center"><Badge variant="secondary">{log.type}</Badge></TableCell>
                                                <TableCell className="text-center">{log.target}</TableCell>
                                                <TableCell className="text-center font-mono">{log.readRate}</TableCell>
                                                <TableCell className="text-center">{log.date}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
