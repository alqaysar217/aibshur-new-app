'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

import {
    Bell, Send, Users, Globe, MapPin, Link as LinkIcon, Settings, History, Trash, FileEdit, Package, Bike,
    Radio, Percent, CheckCircle, XCircle, Inbox
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
import { useToast } from '@/hooks/use-toast';
import NotificationsLoading from './loading';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { mockNotifications, notificationTypeInfo } from '@/lib/notifications';
import { cn } from '@/lib/utils';


// MOCK DATA for display
const mockProvinces = [
    { id: 'prov1', name: 'صنعاء' },
    { id: 'prov2', name: 'حضرموت' },
    { id: 'prov3', name: 'عدن' },
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

type BroadcastFormValues = z.infer<typeof broadcastSchema>;

type LogEntry = {
  id: string;
  readRate: string;
  date: Date;
  broadcastData: BroadcastFormValues;
};

const initialLogs: LogEntry[] = [
    { 
        id: 'log1', 
        readRate: '65%', 
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), 
        broadcastData: {
            type: 'promotion',
            title: 'خصم 20% على مطاعم محددة',
            body: 'استمتع بخصم كبير على وجباتك المفضلة!',
            targetType: 'province',
            targetValue: 'prov1',
            link: '/stores/1'
        } 
    },
    { 
        id: 'log2', 
        readRate: '80%', 
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        broadcastData: {
            type: 'system',
            title: 'تحديث جديد متوفر!',
            body: 'لقد قمنا بتحسينات وإضافة مزايا جديدة. قم بالتحديث الآن.',
            targetType: 'all',
        }
    },
];

// Component
export default function NotificationsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [templates, setTemplates] = useState(mockTemplates);
    const [logs, setLogs] = useState(initialLogs);
    const [deleteAlert, setDeleteAlert] = useState<LogEntry | null>(null);
    const [activeTab, setActiveTab] = useState("sender");

    // Forms
    const broadcastForm = useForm<BroadcastFormValues>({
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

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 1000);
    }, []);

    const targetType = broadcastForm.watch('targetType');

    const getTargetText = (targetType: 'all' | 'user' | 'province', targetValue?: string) => {
        switch(targetType) {
            case 'all': return 'الكل';
            case 'user': return `مستخدم: ${targetValue}`;
            case 'province':
                const province = mockProvinces.find(p => p.id === targetValue);
                return province ? province.name : 'محافظة محددة';
            default: return 'غير محدد';
        }
    }

    function onBroadcastSubmit(values: BroadcastFormValues) {
        console.log("Sending notification:", values);

        const newLog: LogEntry = {
            id: `log${Date.now()}`,
            readRate: '0%',
            date: new Date(),
            broadcastData: values,
        };

        setLogs(prevLogs => [newLog, ...prevLogs]);
        
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

    const handleEditLog = (log: LogEntry) => {
        broadcastForm.reset(log.broadcastData);
        setActiveTab('sender');
    };
    
    const handleDeleteLog = (log: LogEntry) => {
        setDeleteAlert(log);
    };

    const confirmDeleteLog = () => {
        if (!deleteAlert) return;
        setLogs(prevLogs => prevLogs.filter(log => log.id !== deleteAlert.id));
        setDeleteAlert(null);
        toast({ title: "تم حذف سجل الإشعار" });
    };

    if (isLoading) {
        return <NotificationsLoading />;
    }
    
    return (
        <>
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-black text-foreground">إدارة الإشعارات</h1>
                <p className="text-muted-foreground mt-1">إرسال إشعارات مخصصة وتعديل القوالب التلقائية ومراقبة السجلات.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} dir="rtl">
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

                                    <FormField control={broadcastForm.control} name="link" render={({ field }) => (<FormItem><FormLabel>رابط التوجيه (اختياري)</FormLabel><div className="relative"><LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><FormControl><Input {...field} placeholder="/store/STORE_ID or /orders" className="pr-10" dir="ltr"/></FormControl></div></FormItem>)}/>
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
                                            <div className="flex gap-2">
                                                <Button size="sm" variant={template.isActive ? 'default' : 'outline'} onClick={() => setTemplates(current => current.map(t => t.id === template.id ? {...t, isActive: true} : t))}>
                                                    <CheckCircle/>
                                                    فعّال
                                                </Button>
                                                <Button size="sm" variant={!template.isActive ? 'destructive' : 'outline'} onClick={() => setTemplates(current => current.map(t => t.id === template.id ? {...t, isActive: false} : t))}>
                                                    <XCircle/>
                                                    معطّل
                                                </Button>
                                            </div>
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
                            <CardTitle>سجل الإشعارات</CardTitle>
                            <CardDescription>متابعة الإشعارات الواردة إلى النظام وتلك الصادرة منه.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="incoming" dir="rtl">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="incoming" className="gap-2"><Inbox/>إشعارات واردة</TabsTrigger>
                                    <TabsTrigger value="outgoing" className="gap-2"><Send/>إشعارات صادرة</TabsTrigger>
                                </TabsList>
                                <TabsContent value="incoming" className="mt-4">
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-right">الإشعار</TableHead>
                                                    <TableHead className="text-center w-32">النوع</TableHead>
                                                    <TableHead className="text-center w-48">التاريخ</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mockNotifications.map(notification => {
                                                    const InfoIcon = notificationTypeInfo[notification.type].icon;
                                                    return (
                                                        <TableRow key={notification.id} className={cn(!notification.isRead && "bg-primary/5")}>
                                                            <TableCell>
                                                                <div className={cn("font-semibold", !notification.isRead && "text-primary")}>
                                                                    {notification.link ? (
                                                                        <Link href={notification.link} className="hover:underline">{notification.title}</Link>
                                                                    ) : (
                                                                        notification.title
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{notification.body}</div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline" className="gap-1.5">
                                                                    <InfoIcon className="h-3.5 w-3.5" />
                                                                    {notificationTypeInfo[notification.type].text}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center text-xs">{formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: ar })}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="outgoing" className="mt-4">
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader><TableRow>
                                                <TableHead className="text-center">عنوان الإشعار</TableHead>
                                                <TableHead className="text-center">النوع</TableHead>
                                                <TableHead className="text-center">المرسل إليهم</TableHead>
                                                <TableHead className="text-center">نسبة الفتح</TableHead>
                                                <TableHead className="text-center">التاريخ</TableHead>
                                                <TableHead className="text-center">إجراءات</TableHead>
                                            </TableRow></TableHeader>
                                            <TableBody>
                                                {logs.map(log => {
                                                    const { title, type, targetType, targetValue } = log.broadcastData;
                                                    return (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="text-center font-medium">{title}</TableCell>
                                                            <TableCell className="text-center"><Badge variant="secondary">{type}</Badge></TableCell>
                                                            <TableCell className="text-center">{getTargetText(targetType, targetValue)}</TableCell>
                                                            <TableCell className="text-center font-mono">{log.readRate}</TableCell>
                                                            <TableCell className="text-center">{formatDistanceToNow(log.date, { addSuffix: true, locale: ar })}</TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button variant="outline" size="icon" onClick={() => handleEditLog(log)}><FileEdit className="h-4 w-4" /></Button>
                                                                    <Button variant="outline" size="icon" onClick={() => handleDeleteLog(log)} className="text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        <AlertDialog open={!!deleteAlert} onOpenChange={(isOpen) => !isOpen && setDeleteAlert(null)}>
            <AlertDialogContent dir="rtl">
                <AlertDialogHeader className="text-right">
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                    <AlertDialogAction onClick={confirmDeleteLog}>نعم، قم بالحذف</AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
