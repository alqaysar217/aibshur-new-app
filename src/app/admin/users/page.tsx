'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

import UsersLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, Edit, Search, User, Phone, MapPin, Home, Building, Package, UserCog, ShieldCheck, UserCheck, CheckCircle, XCircle, Paperclip, CreditCard, BookUser, Eye, EyeOff, Mail, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppProvince } from '../governorates/page';
import type { Store as StoreType } from '../stores/page';

// Schemas
const clientSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(9, "رقم الهاتف مطلوب"),
  governorateId: z.string({ required_error: "المحافظة مطلوبة" }),
  addressDescription: z.string().min(5, "وصف العنوان مطلوب"),
  addressType: z.enum(['home', 'work', 'other']),
  receiverName: z.string().optional(),
  receiverPhone: z.string().optional(),
  latitude: z.number({ required_error: "الرجاء تحديد الموقع" }),
  longitude: z.number({ required_error: "الرجاء تحديد الموقع" }),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.addressType === 'other') {
    if (!data.receiverName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["receiverName"], message: "اسم المستلم مطلوب" });
    if (!data.receiverPhone) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["receiverPhone"], message: "رقم المستلم مطلوب" });
  }
});

const driverSchema = z.object({
    name: z.string().min(2, "الاسم مطلوب"),
    phone: z.string().min(9, "رقم الهاتف مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    address: z.string().min(5, "العنوان مطلوب"),
    idType: z.enum(['passport', 'card']),
    personalPhotoUrl: z.string().min(1, "رابط الصورة الشخصية مطلوب"),
    idFrontPhotoUrl: z.string().min(1, "رابط صورة الهوية الأمامية مطلوب"),
    idBackPhotoUrl: z.string().optional(),
    latitude: z.number({ required_error: "الرجاء تحديد الموقع" }),
    longitude: z.number({ required_error: "الرجاء تحديد الموقع" }),
    is_active: z.boolean().default(true),
}).refine(data => data.idType === 'passport' || !!data.idBackPhotoUrl, {
    message: "صورة الهوية الخلفية مطلوبة للبطاقة الشخصية",
    path: ["idBackPhotoUrl"],
});

const storeOwnerSchema = z.object({
    name: z.string().min(2, "الاسم مطلوب"),
    phone: z.string().min(9, "رقم الهاتف مطلوب"),
    address: z.string().min(5, "العنوان مطلوب"),
    storeId: z.string({ required_error: "يجب ربط صاحب المتجر بمتجر" }),
    personalPhotoUrl: z.string().min(1, "رابط الصورة الشخصية مطلوب"),
    idPhotoUrl: z.string().min(1, "رابط صورة الهوية مطلوب"),
    is_active: z.boolean().default(true),
});

const adminSchema = z.object({
    name: z.string().min(2, "الاسم مطلوب"),
    phone: z.string().min(9, "رقم الهاتف مطلوب"),
    address: z.string().min(5, "العنوان مطلوب"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    permissions: z.object({
        canUseCustomerApp: z.boolean().default(false),
        canUseDriverApp: z.boolean().default(false),
        canUseDashboard: z.boolean().default(true),
    }),
    dashboardAccess: z.array(z.string()).optional().default([]),
    is_active: z.boolean().default(true),
});

// Types
type Client = z.infer<typeof clientSchema> & { id: string };
type Driver = z.infer<typeof driverSchema> & { id: string };
type StoreOwner = z.infer<typeof storeOwnerSchema> & { id: string };
type Admin = z.infer<typeof adminSchema> & { id: string };
type AnyUser = Client | Driver | StoreOwner | Admin;
type UserType = 'clients' | 'drivers' | 'storeOwners' | 'admins';

// Constants
const dashboardPages = [
    { id: 'dashboard', label: 'الرئيسية' }, { id: 'bank-accounts', label: 'الحسابات البنكية' },
    { id: 'governorates', label: 'المحافظات' }, { id: 'categories', label: 'الفئات' },
    { id: 'stores', label: 'المتاجر' }, { id: 'products', label: 'المنتجات' },
    { id: 'orders', label: 'الطلبات' }, { id: 'users', label: 'المستخدمين' },
    { id: 'ads', label: 'الإعلانات' }, { id: 'coupons', label: 'الكوبونات' },
    { id: 'donations', label: 'التبرعات' },
];

const MapPicker = dynamic(() => import('@/components/map-picker').then(mod => mod.MapPicker), { ssr: false, loading: () => <div className="h-[250px] w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });
const UserLocationViewer = dynamic(() => import('@/components/user-location-viewer').then(mod => mod.UserLocationViewer), { ssr: false, loading: () => <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });


export default function UsersPage() {
    const [activeTab, setActiveTab] = useState<UserType>('clients');
    const [dialogState, setDialogState] = useState<{ isOpen: boolean; isEditing: boolean; data: AnyUser | null }>({ isOpen: false, isEditing: false, data: null });
    const [alertState, setAlertState] = useState<{ isOpen: boolean; data: AnyUser | null }>({ isOpen: false, data: null });
    const [searchTerms, setSearchTerms] = useState({ clients: '', drivers: '', storeOwners: '', admins: '' });
    
    const { toast } = useToast();
    const firestore = useFirestore();

    // Forms
    const clientForm = useForm<z.infer<typeof clientSchema>>({ resolver: zodResolver(clientSchema) });
    const driverForm = useForm<z.infer<typeof driverSchema>>({ resolver: zodResolver(driverSchema) });
    const storeOwnerForm = useForm<z.infer<typeof storeOwnerSchema>>({ resolver: zodResolver(storeOwnerSchema) });
    const adminForm = useForm<z.infer<typeof adminSchema>>({ resolver: zodResolver(adminSchema) });
    const forms = { clients: clientForm, drivers: driverForm, storeOwners: storeOwnerForm, admins: adminForm };

    // Data Fetching
    const { data: clients, isLoading: l1 } = useCollection<Client>(useMemoFirebase(() => firestore && collection(firestore, 'clients'), [firestore]));
    const { data: drivers, isLoading: l2 } = useCollection<Driver>(useMemoFirebase(() => firestore && collection(firestore, 'drivers'), [firestore]));
    const { data: storeOwners, isLoading: l3 } = useCollection<StoreOwner>(useMemoFirebase(() => firestore && collection(firestore, 'storeOwners'), [firestore]));
    const { data: admins, isLoading: l4 } = useCollection<Admin>(useMemoFirebase(() => firestore && collection(firestore, 'admins'), [firestore]));
    const { data: provinces, isLoading: l5 } = useCollection<AppProvince>(useMemoFirebase(() => firestore && collection(firestore, 'app_provinces'), [firestore]));
    const { data: stores, isLoading: l6 } = useCollection<StoreType>(useMemoFirebase(() => firestore && collection(firestore, 'stores'), [firestore]));
    
    const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

    // Memoized Data
    const provincesMap = useMemo(() => provinces?.reduce((acc, p) => ({ ...acc, [p.id]: p.province_name }), {}) || {}, [provinces]);
    const storesMap = useMemo(() => stores?.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {}) || {}, [stores]);
    const filteredData = useMemo(() => ({
        clients: (clients || []).filter(u => u.name.includes(searchTerms.clients) || u.phone.includes(searchTerms.clients)),
        drivers: (drivers || []).filter(u => u.name.includes(searchTerms.drivers) || u.phone.includes(searchTerms.drivers)),
        storeOwners: (storeOwners || []).filter(u => u.name.includes(searchTerms.storeOwners) || u.phone.includes(searchTerms.storeOwners)),
        admins: (admins || []).filter(u => u.name.includes(searchTerms.admins) || u.phone.includes(searchTerms.admins)),
    }), [clients, drivers, storeOwners, admins, searchTerms]);

    // Handlers
    const handleAddNew = () => {
        forms[activeTab].reset({ is_active: true }); // Reset with default active state
        setDialogState({ isOpen: true, isEditing: false, data: null });
    };

    const handleEdit = (user: AnyUser) => {
        forms[activeTab].reset({ ...user, is_active: user.is_active ?? true });
        setDialogState({ isOpen: true, isEditing: true, data: user });
    };

    const handleDelete = (user: AnyUser) => setAlertState({ isOpen: true, data: user });

    const confirmDelete = () => {
        if (!alertState.data || !firestore) return;
        deleteDocumentNonBlocking(doc(firestore, activeTab, alertState.data.id));
        toast({ title: "تم الحذف بنجاح" });
        setAlertState({ isOpen: false, data: null });
    };

    const onSubmit = async (values: any) => {
        if (!firestore) return;
        const collectionRef = collection(firestore, activeTab);
        if (dialogState.isEditing && dialogState.data) {
            updateDocumentNonBlocking(doc(collectionRef, dialogState.data.id), values);
            toast({ title: "تم تحديث المستخدم بنجاح" });
        } else {
            addDocumentNonBlocking(collectionRef, values);
            toast({ title: "تمت إضافة المستخدم بنجاح" });
        }
        setDialogState({ isOpen: false, data: null, isEditing: false });
    };

    if (isLoading) return <UsersLoading />;

    const renderTable = (userType: UserType, data: AnyUser[], columns: { key: keyof AnyUser | 'actions'; header: string; render?: (user: AnyUser) => React.ReactNode }[]) => (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="relative flex-grow w-full sm:flex-grow-0 sm:w-72">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={`ابحث عن ${userType === 'clients' ? 'عميل' : userType === 'drivers' ? 'مندوب' : 'مستخدم'}...`} className="pr-10" value={searchTerms[userType]} onChange={e => setSearchTerms(s => ({...s, [userType]: e.target.value}))} />
                    </div>
                    <Button onClick={handleAddNew} className="w-full sm:w-auto"><PlusCircle /> إضافة جديد</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader><TableRow>{columns.map(c => <TableHead key={String(c.key)} className="text-center">{c.header}</TableHead>)}</TableRow></TableHeader>
                        <TableBody>
                            {data.map(user => (
                                <TableRow key={user.id}>
                                    {columns.map(col => (
                                        <TableCell key={`${user.id}-${String(col.key)}`} className="text-center">
                                            {col.render ? col.render(user) : String(user[col.key as keyof AnyUser] ?? '—')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
    
    const actionColumn = { key: 'actions' as 'actions', header: 'إجراءات', render: (user: AnyUser) => (
        <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleEdit(user)}><Edit/></Button>
            <Button variant="outline" size="icon" onClick={() => handleDelete(user)} className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Trash/></Button>
        </div>
    )};

    const statusColumn = { key: 'is_active' as 'is_active', header: 'الحالة', render: (user: AnyUser) => <Badge variant={user.is_active ? 'default' : 'secondary'}>{user.is_active ? 'نشط' : 'محظور'}</Badge>};

    const renderFormContent = () => {
        const currentForm = forms[activeTab];
        switch (activeTab) {
            case 'clients':
                 const addressType = clientForm.watch('addressType');
                 return <Form {...clientForm}><form onSubmit={clientForm.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <FormField name="name" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="phone" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="governorateId" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>المحافظة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger></FormControl><SelectContent>{provinces?.map(p => <SelectItem key={p.id} value={p.id}>{p.province_name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField name="addressDescription" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>وصف العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="addressType" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>نوع العنوان</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="home">منزل</SelectItem><SelectItem value="work">عمل</SelectItem><SelectItem value="other">آخر</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                    {addressType === 'other' && <>
                        <FormField name="receiverName" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>اسم المستلم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField name="receiverPhone" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>رقم المستلم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    </>}
                    <FormItem><FormLabel>الموقع</FormLabel><MapPicker initialPosition={dialogState.data ? { lat: (dialogState.data as Client).latitude, lng: (dialogState.data as Client).longitude } : undefined} onPositionChange={({ lat, lng }) => { clientForm.setValue('latitude', lat); clientForm.setValue('longitude', lng); }} /></FormItem>
                    <FormField name="is_active" control={currentForm.control} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>الحساب نشط</FormLabel></FormItem>} />
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose><Button type="submit">حفظ</Button></DialogFooter>
                 </form></Form>;
            case 'drivers':
                const idType = driverForm.watch('idType');
                return <Form {...driverForm}><form onSubmit={driverForm.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <FormField name="name" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="phone" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="email" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="address" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="idType" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>نوع الهوية</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="passport">جواز سفر</SelectItem><SelectItem value="card">بطاقة شخصية</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField name="personalPhotoUrl" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>صورة شخصية (رابط)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="idFrontPhotoUrl" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>{idType === 'card' ? 'صورة الهوية الأمامية (رابط)' : 'صورة الجواز (رابط)'}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    {idType === 'card' && <FormField name="idBackPhotoUrl" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>صورة الهوية الخلفية (رابط)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />}
                    <FormItem><FormLabel>الموقع</FormLabel><MapPicker initialPosition={dialogState.data ? { lat: (dialogState.data as Driver).latitude, lng: (dialogState.data as Driver).longitude } : undefined} onPositionChange={({ lat, lng }) => { driverForm.setValue('latitude', lat); driverForm.setValue('longitude', lng); }} /></FormItem>
                    <FormField name="is_active" control={currentForm.control} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>الحساب نشط</FormLabel></FormItem>} />
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose><Button type="submit">حفظ</Button></DialogFooter>
                </form></Form>;
            case 'storeOwners':
                 return <Form {...storeOwnerForm}><form onSubmit={storeOwnerForm.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <FormField name="name" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="phone" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="address" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="storeId" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>المتجر</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger></FormControl><SelectContent>{stores?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField name="personalPhotoUrl" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>صورة شخصية (رابط)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="idPhotoUrl" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>صورة الهوية (رابط)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="is_active" control={currentForm.control} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>الحساب نشط</FormLabel></FormItem>} />
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose><Button type="submit">حفظ</Button></DialogFooter>
                </form></Form>;
            case 'admins':
                const canUseDashboard = adminForm.watch('permissions.canUseDashboard');
                 return <Form {...adminForm}><form onSubmit={adminForm.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                     <FormField name="name" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="phone" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="address" control={currentForm.control} render={({ field }) => <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormItem><FormLabel>صلاحيات الوصول للتطبيقات</FormLabel>
                        <FormField name="permissions.canUseCustomerApp" control={currentForm.control} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>تطبيق العميل</FormLabel></FormItem>} />
                        <FormField name="permissions.canUseDriverApp" control={currentForm.control} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>تطبيق المندوب</FormLabel></FormItem>} />
                        <FormField name="permissions.canUseDashboard" control={currentForm.control} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>لوحة التحكم</FormLabel></FormItem>} />
                    </FormItem>
                    {canUseDashboard && <FormItem>
                        <FormLabel>صلاحيات لوحة التحكم</FormLabel>
                        <FormField name="dashboardAccess" control={currentForm.control} render={() => <FormItem>{dashboardPages.map(page => <FormField key={page.id} control={currentForm.control} name="dashboardAccess" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value?.includes(page.id)} onCheckedChange={checked => { return checked ? field.onChange([...(field.value || []), page.id]) : field.onChange(field.value?.filter(v => v !== page.id))}} /></FormControl><FormLabel>{page.label}</FormLabel></FormItem>} />)}</FormItem>} />
                    </FormItem>}
                    {dialogState.isEditing && (dialogState.data as Admin)?.latitude && <FormItem><FormLabel>آخر موقع مسجل</FormLabel><UserLocationViewer className="h-48 w-full rounded-lg overflow-hidden border" position={{ lat: (dialogState.data as Admin).latitude!, lng: (dialogState.data as Admin).longitude! }} /></FormItem>}
                    <FormField name="is_active" control={currentForm.control} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>الحساب نشط</FormLabel></FormItem>} />
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose><Button type="submit">حفظ</Button></DialogFooter>
                </form></Form>;
        }
    };
    
    return (
        <>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserType)} dir="rtl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground">إدارة المستخدمين</h1>
                        <p className="text-muted-foreground mt-1">إدارة جميع فئات المستخدمين في النظام.</p>
                    </div>
                    <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="clients" className="flex-1 sm:flex-initial gap-2"><User/>العملاء</TabsTrigger>
                        <TabsTrigger value="drivers" className="flex-1 sm:flex-initial gap-2"><UserCheck/>المناديب</TabsTrigger>
                        <TabsTrigger value="storeOwners" className="flex-1 sm:flex-initial gap-2"><Briefcase/>أصحاب المتاجر</TabsTrigger>
                        <TabsTrigger value="admins" className="flex-1 sm:flex-initial gap-2"><UserCog/>الإدارة</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="clients">{renderTable('clients', filteredData.clients, [{key: 'name', header: 'الاسم'}, {key: 'phone', header: 'الهاتف'}, {key: 'governorateId', header: 'المحافظة', render: (u) => provincesMap[(u as Client).governorateId] || '—' }, statusColumn, actionColumn])}</TabsContent>
                <TabsContent value="drivers">{renderTable('drivers', filteredData.drivers, [{key: 'name', header: 'الاسم'}, {key: 'phone', header: 'الهاتف'}, {key: 'email', header: 'البريد الإلكتروني'}, statusColumn, actionColumn])}</TabsContent>
                <TabsContent value="storeOwners">{renderTable('storeOwners', filteredData.storeOwners, [{key: 'name', header: 'الاسم'}, {key: 'phone', header: 'الهاتف'}, {key: 'storeId', header: 'المتجر', render: (u) => storesMap[(u as StoreOwner).storeId] || '—' }, statusColumn, actionColumn])}</TabsContent>
                <TabsContent value="admins">{renderTable('admins', filteredData.admins, [{key: 'name', header: 'الاسم'}, {key: 'phone', header: 'الهاتف'}, {key: 'address', header: 'العنوان'}, statusColumn, actionColumn])}</TabsContent>
            </Tabs>
            
            <Dialog open={dialogState.isOpen} onOpenChange={(isOpen) => setDialogState(prev => ({...prev, isOpen}))}>
                <DialogContent className="max-w-2xl [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">{dialogState.isEditing ? 'تعديل' : 'إضافة'} مستخدم</DialogTitle>
                        <DialogDescription className="text-right">أدخل بيانات المستخدم.</DialogDescription>
                    </DialogHeader>
                    {renderFormContent()}
                </DialogContent>
            </Dialog>

            <AlertDialog open={alertState.isOpen} onOpenChange={(isOpen) => setAlertState(prev => ({...prev, isOpen}))}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right">
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>هذا الإجراء سيحذف المستخدم بشكل دائم.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start">
                        <AlertDialogAction onClick={confirmDelete}>نعم، قم بالحذف</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
