'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, LocateFixed, Home, Briefcase, Edit } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

const MapPicker = dynamic(() => import('@/components/map-picker').then(mod => mod.MapPicker), { ssr: false, loading: () => <div className="h-[200px] w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });

const addressSchema = z.object({
    addressType: z.enum(['home', 'work', 'other']),
    customName: z.string().optional(),
    city: z.string().min(2, "المدينة مطلوبة"),
    street: z.string().min(5, "تفاصيل الشارع مطلوبة"),
    latitude: z.number(),
    longitude: z.number(),
}).superRefine((data, ctx) => {
    if (data.addressType === 'other' && (!data.customName || data.customName.length < 2)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customName"], message: "اسم العنوان مطلوب" });
    }
});

type AddAddressDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userId?: string;
};

export function AddAddressDialog({ isOpen, onOpenChange, userId }: AddAddressDialogProps) {
    const firestore = useFirestore();
    const form = useForm<z.infer<typeof addressSchema>>({
        resolver: zodResolver(addressSchema),
        defaultValues: { addressType: 'home', city: '', street: '', latitude: 14.5424, longitude: 49.1333, customName: '' },
    });
    
    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            form.reset({ addressType: 'home', city: '', street: '', latitude: 14.5424, longitude: 49.1333, customName: '' });
        }
    }, [isOpen, form]);

    const addressType = form.watch('addressType');

    const handleLocate = () => {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            form.setValue('latitude', latitude, { shouldValidate: true });
            form.setValue('longitude', longitude, { shouldValidate: true });
        });
    };

    const onSubmit = (values: z.infer<typeof addressSchema>) => {
        if (!firestore || !userId) return;
        
        const dataToSave = {
            userId,
            addressType: values.addressType,
            city: values.city,
            street: values.street,
            latitude: values.latitude,
            longitude: values.longitude,
            ...(values.addressType === 'other' && { customName: values.customName }),
        };

        addDocumentNonBlocking(collection(firestore, 'addresses'), dataToSave);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="w-[95vw] max-w-lg flex flex-col max-h-[90vh] p-0 rounded-2xl [&>button]:right-auto [&>button]:left-4">
                <DialogHeader className='text-right p-6 pb-4 border-b'>
                    <DialogTitle>إضافة عنوان جديد</DialogTitle>
                    <DialogDescription>أدخل تفاصيل العنوان الجديد للتوصيل.</DialogDescription>
                </DialogHeader>
                <div className='flex-1 overflow-y-auto px-6'>
                    <Form {...form}>
                        <form id="add-address-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                            <Button type="button" variant="outline" className="w-full" onClick={handleLocate}><LocateFixed className="ml-2" /> تحديد موقعي الآن</Button>
                            <MapPicker initialPosition={{ lat: form.watch('latitude'), lng: form.watch('longitude') }} onPositionChange={({ lat, lng }) => { form.setValue('latitude', lat, {shouldValidate: true}); form.setValue('longitude', lng, {shouldValidate: true}); }}/>
                            <FormField name="addressType" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>تسمية العنوان</FormLabel> <Select onValueChange={field.onChange} value={field.value} dir="rtl"> <FormControl><SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="home"><Home className="inline-block ml-2"/>المنزل</SelectItem> <SelectItem value="work"><Briefcase className="inline-block ml-2"/>العمل</SelectItem> <SelectItem value="other"><Edit className="inline-block ml-2"/>تسمية مخصصة</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                            {addressType === 'other' && <FormField name="customName" control={form.control} render={({ field }) => (<FormItem><FormLabel>اسم العنوان المخصص</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />}
                            <FormField name="city" control={form.control} render={({ field }) => (<FormItem><FormLabel>المدينة / الحي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField name="street" control={form.control} render={({ field }) => (<FormItem><FormLabel>تفاصيل الشارع / العمارة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </form>
                    </Form>
                </div>
                <DialogFooter className="p-6 pt-4 border-t bg-background flex-row-reverse sm:justify-start">
                    <Button type="submit" form="add-address-form">حفظ العنوان</Button>
                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
