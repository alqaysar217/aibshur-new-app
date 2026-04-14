'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Bell, ShoppingCart, Crown, Shield, CheckCircle, Copy, MessageSquare } from 'lucide-react';
import type { BankAccount } from '@/app/admin/bank-accounts/page';
import VipLoading from './loading';


// Types from backend.json
type VipPackage = {
    id: string;
    name: string;
    type: "bronze" | "silver" | "gold";
    price: number;
    duration: "monthly" | "quarterly" | "yearly";
    features: string[];
    imageUrl?: string;
    isActive: boolean;
};

type AppProvince = {
    id: string;
    whatsapp_number: string;
};

const typeInfo = {
    bronze: { label: 'برونزية', icon: Shield, gradient: 'bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700' },
    silver: { label: 'فضية', icon: Shield, gradient: 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500' },
    gold: { label: 'ذهبية', icon: Crown, gradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500' },
};

const durationInfo = {
    monthly: 'شهرياً',
    quarterly: 'كل 3 أشهر',
    yearly: 'سنوياً',
};


export default function VipPage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<VipPackage | null>(null);

    const { toast } = useToast();
    const firestore = useFirestore();

    const { data: packages, isLoading: isLoadingPackages } = useCollection<VipPackage>(useMemoFirebase(() => firestore ? collection(firestore, 'vipPackages') : null, [firestore]));
    const { data: banks, isLoading: isLoadingBanks } = useCollection<BankAccount>(useMemoFirebase(() => firestore ? collection(firestore, 'bankAccounts') : null, [firestore]));
    // Assuming there's a main province with the WhatsApp number, fetching the first active one.
    const { data: provinces, isLoading: isLoadingProvinces } = useCollection<AppProvince>(useMemoFirebase(() => firestore ? collection(firestore, 'app_provinces') : null, [firestore]));

    const isLoading = isLoadingPackages || isLoadingBanks || isLoadingProvinces;

    const filteredPackages = useMemo(() => {
        if (!packages) return [];
        return packages.filter(p => p.isActive && (p.duration === billingPeriod || (billingPeriod === 'yearly' && p.duration === 'quarterly')));
    }, [packages, billingPeriod]);

    const handleActivateClick = (pkg: VipPackage) => {
        setSelectedPackage(pkg);
        setIsPaymentDialogOpen(true);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: `تم نسخ ${label}`,
            description: text,
        });
    };
    
    const whatsAppNumber = useMemo(() => provinces?.[0]?.whatsapp_number || '777123456', [provinces]);

    if (isLoading) {
        return <VipLoading />;
    }

    return (
        <>
            <div className="flex flex-col min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
                    <div className="flex items-center justify-between h-16 px-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/account"><ArrowRight className="h-5 w-5" /></Link>
                        </Button>
                        <h1 className="font-bold text-lg">عضوية أبشر VIP</h1>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/notifications"><Bell className="h-5 w-5" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 space-y-6">
                    {/* Billing Toggle */}
                    <div className="flex justify-center p-1 bg-sidebar-active-gradient rounded-lg shadow-inner">
                        <Button
                            onClick={() => setBillingPeriod('monthly')}
                            className={cn(
                                "flex-1 rounded-[6px] transition-all text-lg",
                                billingPeriod === 'monthly'
                                    ? 'bg-white text-primary shadow font-bold'
                                    : 'bg-transparent text-white hover:bg-white/20 font-medium'
                            )}
                        >
                            دفع شهري
                        </Button>
                        <Button
                            onClick={() => setBillingPeriod('yearly')}
                            className={cn(
                                "flex-1 relative rounded-[6px] transition-all text-lg",
                                 billingPeriod === 'yearly'
                                    ? 'bg-white text-primary shadow font-bold'
                                    : 'bg-transparent text-white hover:bg-white/20 font-medium'
                            )}
                        >
                            دفع سنوي
                             <Badge className="absolute -top-2 -right-2 text-xs bg-destructive">خصم 20%</Badge>
                        </Button>
                    </div>


                    {/* Packages */}
                    <div className="space-y-6">
                        {filteredPackages.map(pkg => {
                            const PkgIcon = typeInfo[pkg.type].icon;
                            const gradient = typeInfo[pkg.type].gradient;
                            
                            return (
                                <Card key={pkg.id} className={cn("overflow-hidden text-white shadow-lg border-none rounded-[10px]", gradient)}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                {pkg.imageUrl && (
                                                    <Image
                                                        src={pkg.imageUrl}
                                                        alt={pkg.name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full object-cover border-2 border-white/50"
                                                    />
                                                )}
                                                <CardTitle className="text-2xl pt-1">
                                                    {pkg.name}
                                                </CardTitle>
                                            </div>
                                            <Badge variant="secondary" className="rounded-[6px]">{typeInfo[pkg.type].label}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-4xl font-bold">{pkg.price.toLocaleString('en-US')} <span className="text-lg font-normal text-white/80">ر.ي / {durationInfo[pkg.duration].replace('كل ','')}</span></div>
                                        <ul className="space-y-2">
                                            {pkg.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <CheckCircle className="h-5 w-5 text-white/90" />
                                                    <span className="font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            onClick={() => handleActivateClick(pkg)}
                                            className="w-full h-12 text-base font-bold bg-white text-primary hover:bg-white/90 rounded-[8px]"
                                        >
                                            تفعيل العضوية
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                </main>
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[10px]" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-xl">تأكيد الاشتراك في {selectedPackage?.name}</DialogTitle>
                        <DialogDescription className="text-right">
                           قم بالتحويل إلى أحد حساباتنا البنكية، ثم أرسل لنا صورة السند عبر واتساب لتفعيل اشتراكك فوراً.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {(banks || []).map(bank => (
                            <div key={bank.id} className="rounded-[8px] border p-3 space-y-2">
                                <div className="flex items-center gap-3">
                                    <Image src={bank.logoUrl} alt={bank.bankName} width={40} height={40} className="rounded-md" />
                                    <span className="font-bold">{bank.bankName}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">اسم الحساب</p>
                                    <p className="font-semibold">{bank.accountName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">رقم الحساب</p>
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold tracking-wider">{bank.accountNumber}</p>
                                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(bank.accountNumber, 'رقم الحساب')}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <a href={`https://wa.me/${whatsAppNumber}`} target="_blank" rel="noopener noreferrer" className="w-full">
                           <Button className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600 text-white rounded-[8px]">
                             <MessageSquare className="ml-2"/>
                             إرسال السند عبر واتساب
                           </Button>
                        </a>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
