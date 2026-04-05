'use client';

import { useState } from 'react';
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
import { User, Bike, Phone, Mail, Paperclip, BadgeInfo, CreditCard, BookUser } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { countries, type Country } from '@/lib/countries';

// User Schema
const userFormSchema = z.object({
  name: z.string().min(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل' }),
  phone: z.string().regex(/^7[0-9]{8}$/, { message: 'الرجاء إدخال رقم هاتف يمني صحيح (يبدأ بـ 7)' }),
  terms: z.boolean().refine((val) => val === true, {
    message: 'يجب الموافقة على الشروط والسياسات',
  }),
});

// Delegate Schema
const delegateFormSchema = z.object({
    name: z.string().min(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل' }),
    phone: z.string().regex(/^7[0-9]{8}$/, { message: 'الرجاء إدخال رقم هاتف يمني صحيح (يبدأ بـ 7)' }),
    email: z.string().email({ message: 'الرجاء إدخال بريد إلكتروني صحيح' }),
    idType: z.enum(['passport', 'card'], { required_error: 'الرجاء اختيار نوع الهوية' }),
    personalPhoto: z.any().refine(file => file?.length == 1, 'الصورة الشخصية مطلوبة.'),
    idPhotoFront: z.any().refine(file => file?.length == 1, 'صورة الهوية الأمامية مطلوبة.'),
    idPhotoBack: z.any().optional(),
    terms: z.boolean().refine((val) => val === true, {
        message: 'يجب الموافقة على الشروط والسياسات',
    }),
}).refine(data => {
    if (data.idType === 'card') {
        return data.idPhotoBack?.length == 1;
    }
    return true;
}, {
    message: "صورة الهوية الخلفية مطلوبة للبطاقة الشخصية",
    path: ["idPhotoBack"],
});


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const userImage = PlaceHolderImages.find(p => p.id === 'register-user-illustration');
  const delegateImage = PlaceHolderImages.find(p => p.id === 'register-delegate-illustration');
  const [idType, setIdType] = useState('card');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      terms: false,
    },
  });

  const delegateForm = useForm<z.infer<typeof delegateFormSchema>>({
    resolver: zodResolver(delegateFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      idType: 'card',
      terms: false,
    },
  });

  function onUserSubmit(values: z.infer<typeof userFormSchema>) {
    console.log('User registration:', values);
    router.push('/otp');
  }
  
  function onDelegateSubmit(values: z.infer<typeof delegateFormSchema>) {
    console.log('Delegate application:', values);
    toast({
      title: 'تم إرسال طلبك بنجاح',
      description: 'سيتم مراجعة طلبك والتواصل معك قريباً. يمكنك الآن تصفح التطبيق كمستخدم عادي.',
      duration: 5000,
    });
    router.push('/home');
  }

  const FileUploadField = ({ name, label, icon: Icon }: { name: "personalPhoto" | "idPhotoFront" | "idPhotoBack", label: string, icon: React.ComponentType<{className?: string}> }) => {
    const { control, register, watch } = delegateForm;
    const fileName = watch(name)?.[0]?.name;

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Button type="button" variant="outline" className="w-full justify-start text-muted-foreground gap-2" onClick={() => document.getElementById(name)?.click()}>
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                <span className='truncate'>{fileName || 'اختر ملف'}</span>
                            </Button>
                            <Input
                                id={name}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                {...register(name)}
                            />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};


  return (
    <div className="flex flex-col min-h-screen bg-background p-4 pt-8 pb-16">
      <h1 className="text-3xl font-bold mb-2 text-center">إنشاء حساب جديد</h1>
      <p className="text-muted-foreground mb-6 text-center">اختر نوع الحساب الذي ترغب في إنشائه.</p>
      
      <Tabs defaultValue="user" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user" className="gap-2"><User />عميل</TabsTrigger>
          <TabsTrigger value="delegate" className="gap-2"><Bike />مندوب</TabsTrigger>
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
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="w-full space-y-4">
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
                            onSelect={() => setSelectedCountry(country)}
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
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg font-semibold">
                  إنشاء حساب
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
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="الاسم حسب الهوية" {...field} className="h-12 text-base pr-12"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
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
                                onSelect={() => setSelectedCountry(country)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
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
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="البريد الإلكتروني" type="email" {...field} className="h-12 text-base pr-12"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={delegateForm.control}
                        name="idType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>نوع الهوية</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setIdType(value);
                                    }}
                                    defaultValue={field.value}
                                    dir="rtl"
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-12 text-base">
                                          <div className='flex gap-2 items-center'>
                                            <BadgeInfo className="h-5 w-5 text-muted-foreground" />
                                            <SelectValue placeholder="اختر نوع الهوية" />
                                          </div>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="card">
                                          <div className='flex gap-2 items-center'>
                                            <CreditCard className='h-5 w-5' />
                                            <span>بطاقة شخصية</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="passport">
                                          <div className='flex gap-2 items-center'>
                                            <BookUser className='h-5 w-5' />
                                            <span>جواز سفر</span>
                                          </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="space-y-4 rounded-lg border p-4 text-right">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          المرفقات المطلوبة
                        </h4>
                        <FileUploadField name="personalPhoto" label="الصورة الشخصية" icon={User} />
                        <FileUploadField name="idPhotoFront" label={idType === 'card' ? "صورة البطاقة (الأمام)" : "صورة الجواز"} icon={idType === 'card' ? CreditCard : BookUser} />
                        {idType === 'card' && (
                           <FileUploadField name="idPhotoBack" label="صورة البطاقة (الخلف)" icon={CreditCard} />
                        )}
                    </div>
                    

                    <FormField
                        control={delegateForm.control}
                        name="terms"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 space-x-reverse pt-2">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                أوافق على <Link href="/terms" className="text-primary hover:underline">الشروط والسياسات الخاصة بالمندوب</Link>
                                </FormLabel>
                            </div>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full h-12 text-lg font-semibold">
                        إرسال الطلب
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
