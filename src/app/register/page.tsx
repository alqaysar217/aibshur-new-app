'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { User, Bike, Phone, Mail, Paperclip, BadgeInfo, CreditCard, BookUser, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { countries, type Country } from '@/lib/countries';

import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';


// User Schema - Simplified
const userFormSchema = z.object({
  name: z.string().min(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل' }),
  phone: z.string().regex(/^7[0-9]{8}$/, { message: 'الرجاء إدخال رقم هاتف يمني صحيح (يبدأ بـ 7)' }),
  terms: z.boolean().refine((val) => val === true, {
    message: 'يجب الموافقة على الشروط والسياسات',
  }),
});

// Delegate Schema - Simplified
const delegateFormSchema = z.object({
    name: z.string().min(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل' }),
    phone: z.string().regex(/^7[0-9]{8}$/, { message: 'الرجاء إدخال رقم هاتف يمني صحيح (يبدأ بـ 7)' }),
    email: z.string().email({ message: 'الرجاء إدخال بريد إلكتروني صحيح' }),
    idType: z.enum(['passport', 'card'], { required_error: 'الرجاء اختيار نوع الهوية' }),
    personalPhotoUrl: z.string().url({ message: "الرجاء إدخال رابط صالح للصورة الشخصية" }),
    idFrontPhotoUrl: z.string().url({ message: "الرجاء إدخال رابط صالح لصورة الهوية الأمامية" }),
    idBackPhotoUrl: z.string().url({ message: "الرجاء إدخال رابط صالح" }).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    terms: z.boolean().refine((val) => val === true, {
        message: 'يجب الموافقة على الشروط والسياسات',
    }),
}).refine(data => {
    if (data.idType === 'card') {
        return data.idBackPhotoUrl && data.idBackPhotoUrl.length > 0;
    }
    return true;
}, {
    message: "صورة الهوية الخلفية مطلوبة للبطاقة الشخصية",
    path: ["idBackPhotoUrl"],
});

const ImagePreview = ({ url }: { url?: string }) => {
    if (!url) return null;
    return (
        <div className="mt-2 flex justify-center rounded-lg border border-dashed p-1">
            <Image src={url} alt="معاينة" width={80} height={80} className="rounded-md object-contain" unoptimized />
        </div>
    )
};


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const userImage = PlaceHolderImages.find(p => p.id === 'register-user-illustration');
  const delegateImage = PlaceHolderImages.find(p => p.id === 'register-delegate-illustration');
  const [idType, setIdType] = useState('card');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isLoading, setIsLoading] = useState(false);

  const firestore = useFirestore();

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: '', phone: '', terms: false },
  });

  const delegateForm = useForm<z.infer<typeof delegateFormSchema>>({
    resolver: zodResolver(delegateFormSchema),
    defaultValues: {
        name: '',
        phone: '',
        email: '',
        idType: 'card',
        terms: false,
        personalPhotoUrl: '',
        idFrontPhotoUrl: '',
        idBackPhotoUrl: '',
    },
  });
  
  const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
    if (!firestore) return false;
    const userCollections: ('clients' | 'drivers_v2' | 'storeOwners' | 'admins')[] = ['clients', 'drivers_v2', 'storeOwners', 'admins'];
    try {
      for (const col of userCollections) {
        const q = query(collection(firestore, col), where("phone", "==", phoneNumber));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking user existence:", error);
      toast({ variant: "destructive", title: "حدث خطأ", description: "لا يمكن التحقق من رقم الهاتف حالياً. الرجاء المحاولة لاحقاً." });
      return false; 
    }
  };

  async function onUserSubmit(values: z.infer<typeof userFormSchema>) {
    setIsLoading(true);
    
    const governorateId = localStorage.getItem('selectedGovernorateId');
    if (!governorateId) {
        toast({ variant: "destructive", title: "لم يتم اختيار المحافظة", description: "الرجاء العودة للصفحة الرئيسية واختيار محافظتك أولاً." });
        setIsLoading(false);
        router.push('/select-governorate');
        return;
    }
    
    const userExists = await checkUserExists(values.phone);
    if (userExists) {
      toast({ variant: "destructive", title: "حساب موجود بالفعل", description: "هذا الرقم لديه حساب من قبل. الرجاء تسجيل الدخول." });
      setIsLoading(false);
      return;
    }

    try {
      const { terms, ...dataToSave } = values;
      await addDoc(collection(firestore, 'clients'), {
        ...dataToSave,
        governorateId,
        addressDescription: '', // No longer collected from user
        is_active: true,
        addressType: 'home',
        latitude: 0, 
        longitude: 0,
      });
      router.push(`/otp?phone=${values.phone}`);
    } catch (error) {
      console.error("Error creating client account:", error);
      toast({ variant: "destructive", title: "خطأ في إنشاء الحساب", description: "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى." });
      setIsLoading(false);
    }
  }
  
  async function onDelegateSubmit(values: z.infer<typeof delegateFormSchema>) {
    setIsLoading(true);
    const userExists = await checkUserExists(values.phone);
    if (userExists) {
      toast({ variant: "destructive", title: "حساب موجود بالفعل", description: "هذا الرقم لديه حساب من قبل. الرجاء تسجيل الدخول." });
      setIsLoading(false);
      return;
    }

    try {
        const { terms, ...dataToSave } = values;
        await addDoc(collection(firestore, 'drivers_v2'), {
            ...dataToSave,
            address: '', // No longer collected from user
            is_active: false,
            status: 'pending',
            createdAt: serverTimestamp(),
            latitude: values.latitude || 0,
            longitude: values.longitude || 0,
        });

        toast({
            title: 'تم إرسال طلبك بنجاح',
            description: 'سيتم مراجعة طلبك والتواصل معك قريباً. سيتم توجيهك لصفحة التحقق للمتابعة.',
            duration: 5000,
        });

        router.push(`/otp?phone=${values.phone}`);

    } catch (error) {
      console.error("Error submitting delegate application:", error);
      toast({ variant: "destructive", title: "خطأ في إرسال الطلب", description: "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى." });
      setIsLoading(false);
    }
  }


  const ImageURLField = ({ name, label, icon: Icon }: { name: "personalPhotoUrl" | "idFrontPhotoUrl" | "idBackPhotoUrl", label: string, icon: React.ComponentType<{className?: string}> }) => (
    <FormField
        control={delegateForm.control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <div className="relative">
                       <Icon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                       <Input placeholder="https://example.com/image.png" {...field} className="h-12 text-base pr-12 text-left" dir="ltr"/>
                    </div>
                </FormControl>
                <ImagePreview url={field.value} />
                <FormMessage />
            </FormItem>
        )}
    />
  );


  return (
    <div className="flex flex-col min-h-screen bg-background p-4 pt-8 pb-16">
      <h1 className="text-3xl font-bold mb-2 text-center text-primary">إنشاء حساب جديد</h1>
      <p className="text-muted-foreground mb-6 text-center">اختر نوع الحساب الذي ترغب في إنشائه.</p>
      
      <Tabs defaultValue="user" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-xl bg-muted p-1 h-auto">
          <TabsTrigger value="user" className="gap-2 h-12 text-base rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <User />عميل
          </TabsTrigger>
          <TabsTrigger value="delegate" className="gap-2 h-12 text-base rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <Bike />مندوب
          </TabsTrigger>
        </TabsList>
        
        {/* User Registration Tab */}
        <TabsContent value="user">
          <div className="flex flex-col items-center text-center mt-6">
            {userImage && (
              <Image
                src={userImage.imageUrl}
                alt={userImage.description}
                width={250}
                height={150}
                className="mb-6 rounded-lg object-contain"
                data-ai-hint={userImage.imageHint}
              />
            )}
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="w-full space-y-4 text-right">
                <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormField
                      control={userForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="الاسم الكامل" {...field} className="h-12 text-base pr-12"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <FormField
                    control={userForm.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input
                                type="tel"
                                placeholder="7X XXX XXXX"
                                className="w-full text-right tracking-[0.2em] text-lg h-14 pr-12 pl-20 text-foreground"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="absolute inset-y-0 left-0 flex items-center px-4 cursor-pointer border-e h-14 top-0">
                          <span className="text-2xl">{selectedCountry.flag}</span>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-h-60 overflow-y-auto">
                        {countries.map((country) => (
                          <DropdownMenuItem
                            key={country.code}
                            onSelect={(e) => { e.preventDefault(); setSelectedCountry(country); }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span>{country.name} ({country.dialCode})</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <FormField
                  control={userForm.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 space-x-reverse pt-2">
                       <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          أوافق على <Link href="/terms" className="text-primary hover:underline">الشروط والسياسات</Link>
                        </FormLabel>
                      </div>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg font-semibold bg-sidebar-active-gradient text-sidebar-primary-foreground" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'إنشاء حساب'}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Delegate Registration Tab */}
        <TabsContent value="delegate">
            <div className="flex flex-col items-center text-center mt-6">
                {delegateImage && (
                <Image
                    src={delegateImage.imageUrl}
                    alt={delegateImage.description}
                    width={250}
                    height={150}
                    className="mb-6 rounded-lg object-contain"
                    data-ai-hint={delegateImage.imageHint}
                />
                )}
                <Form {...delegateForm}>
                <form onSubmit={delegateForm.handleSubmit(onDelegateSubmit)} className="w-full space-y-4 text-right">
                    <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormField
                            control={delegateForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem><FormControl><Input placeholder="الاسم حسب الهوية" {...field} className="h-12 text-base pr-12"/></FormControl><FormMessage /></FormItem>
                            )}
                        />
                    </div>
                     <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <FormField
                        control={delegateForm.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <Input type="tel" placeholder="7X XXX XXXX" className="w-full text-right tracking-[0.2em] text-lg h-14 pr-12 pl-20 text-foreground" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="absolute inset-y-0 left-0 flex items-center px-4 cursor-pointer border-e h-14 top-0">
                              <span className="text-2xl">{selectedCountry.flag}</span>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="max-h-60 overflow-y-auto">
                            {countries.map((country) => (
                              <DropdownMenuItem key={country.code} onSelect={(e) => { e.preventDefault(); setSelectedCountry(country); }} className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xl">{country.flag}</span>
                                <span>{country.name} ({country.dialCode})</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormField
                            control={delegateForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem><FormControl><Input placeholder="البريد الإلكتروني" type="email" {...field} className="h-12 text-base pr-12"/></FormControl><FormMessage /></FormItem>
                            )}
                        />
                    </div>
                     
                    <FormField
                        control={delegateForm.control}
                        name="idType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>نوع الهوية</FormLabel>
                                <Select onValueChange={(value) => { field.onChange(value); setIdType(value); }} defaultValue={field.value} dir="rtl">
                                    <FormControl>
                                        <SelectTrigger className="h-12 text-base">
                                          <div className='flex gap-2 items-center'><BadgeInfo className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="اختر نوع الهوية" /></div>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="card"><div className='flex gap-2 items-center'><CreditCard className='h-5 w-5' /><span>بطاقة شخصية</span></div></SelectItem>
                                        <SelectItem value="passport"><div className='flex gap-2 items-center'><BookUser className='h-5 w-5' /><span>جواز سفر</span></div></SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="space-y-4 rounded-lg border p-4 text-right">
                        <h4 className="text-sm font-medium flex items-center gap-2"><Paperclip className="h-4 w-4" />المرفقات المطلوبة (روابط صور)</h4>
                        <ImageURLField name="personalPhotoUrl" label="رابط الصورة الشخصية" icon={User} />
                        <ImageURLField name="idFrontPhotoUrl" label={idType === 'card' ? "رابط صورة البطاقة (الأمام)" : "رابط صورة الجواز"} icon={idType === 'card' ? CreditCard : BookUser} />
                        {idType === 'card' && (
                           <ImageURLField name="idBackPhotoUrl" label="رابط صورة البطاقة (الخلف)" icon={CreditCard} />
                        )}
                    </div>
                    
                    <FormField
                        control={delegateForm.control}
                        name="terms"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 space-x-reverse pt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>أوافق على <Link href="/terms" className="text-primary hover:underline">الشروط والسياسات الخاصة بالمندوب</Link></FormLabel></div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full h-12 text-lg font-semibold bg-sidebar-active-gradient text-sidebar-primary-foreground" disabled={isLoading}>
                       {isLoading ? <Loader2 className="animate-spin" /> : 'إرسال الطلب'}
                    </Button>
                </form>
                </Form>
            </div>
        </TabsContent>
      </Tabs>
      <p className="mt-8 text-sm text-center text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
