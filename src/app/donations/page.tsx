'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bell, ShoppingCart, Heart, Check, Wallet, Banknote, Copy, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processDonation } from '@/ai/flows/process-donation-flow';
import { useRouter } from 'next/navigation';
import DonationsLoading from './loading';
import type { Client } from '../users/page';

// Types
type DonationType = {
  id: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
};

type UserWallet = {
  cashBalance: number;
  pointsBalance: number;
};

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  logoUrl: string;
};

type AppProvince = {
    id: string;
    whatsapp_number: string;
};


export default function DonationsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Data fetching
    const { data: donationTypes, isLoading: isLoadingTypes } = useCollection<DonationType>(useMemoFirebase(() => firestore ? collection(firestore, 'donationTypes') : null, [firestore]));
    const { data: bankAccounts, isLoading: isLoadingBanks } = useCollection<BankAccount>(useMemoFirebase(() => firestore ? collection(firestore, 'bankAccounts') : null, [firestore]));
    const { data: provinces, isLoading: isLoadingProvinces } = useCollection<AppProvince>(useMemoFirebase(() => firestore ? collection(firestore, 'app_provinces') : null, [firestore]));

    const walletRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid, 'wallet', 'main') : null, [firestore, user]);
    const { data: userWallet, isLoading: isLoadingWallet } = useDoc<UserWallet>(walletRef);

    // We need client info to pass to the flow
    const clientRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'clients', user.uid) : null, [firestore, user]);
    const { data: clientProfile, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

    const isLoading = isLoadingTypes || isLoadingBanks || isLoadingWallet || isUserLoading || isLoadingClient || isLoadingProvinces;

    const quickAmounts = [1000, 2000, 5000, 10000];
    const whatsAppNumber = useMemo(() => provinces?.[0]?.whatsapp_number || '777123456', [provinces]);

    const handleConfirmDonation = async () => {
        if (!selectedTypeId) {
            toast({ variant: 'destructive', title: 'الرجاء اختيار وجهة التبرع أولاً.' });
            return;
        }
        if (!amount || +amount <= 0) {
            toast({ variant: 'destructive', title: 'الرجاء إدخال مبلغ صحيح للتبرع.' });
            return;
        }
        if (paymentMethod === 'bank') {
            setIsBankDialogOpen(true);
            return;
        }
        
        // Handle wallet payment
        if (!user || !clientProfile) {
            toast({ variant: 'destructive', title: 'يجب تسجيل الدخول لإتمام العملية.' });
            return;
        }

        setIsProcessing(true);
        const result = await processDonation({
            userId: user.uid,
            userName: clientProfile.name,
            userPhone: clientProfile.phone,
            amount: +amount,
            donationTypeId: selectedTypeId,
        });
        setIsProcessing(false);

        if (result.success) {
            toast({ title: result.message });
            router.push('/account');
        } else {
            toast({ variant: 'destructive', title: 'فشلت العملية', description: result.message });
        }
    };
    
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `تم نسخ ${label}`, description: text });
    };

    if (isLoading) {
        return <DonationsLoading />;
    }

    return (
      <>
        <div className="flex flex-col min-h-screen bg-gray-50 pb-4">
            <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between h-16 px-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/account"><ArrowRight className="h-5 w-5" /></Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-lg">بوابة الخير</h1>
                        <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-4 space-y-6">
                <Card className="rounded-[10px]">
                    <CardContent className="p-4">
                        <h3 className="font-bold text-center text-lg mb-3">اختر وجهة تبرعك</h3>
                        <div className="space-y-3">
                            {(donationTypes || []).map(type => (
                                <button key={type.id} onClick={() => setSelectedTypeId(type.id)} className={cn("w-full border-2 p-3 rounded-[10px] flex items-center gap-4 text-right transition-all", selectedTypeId === type.id ? 'border-primary bg-primary/10' : 'border-transparent bg-muted hover:bg-muted/80')}>
                                    <Image src={type.imageUrl} alt={type.name} width={48} height={48} className="rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <p className="font-bold">{type.name}</p>
                                        <p className="text-xs text-muted-foreground">ساهم معنا في دعم المحتاجين</p>
                                    </div>
                                    {selectedTypeId === type.id && <Check className="h-6 w-6 text-primary flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                 <Card className="rounded-[10px]">
                    <CardContent className="p-4 text-center">
                        <h3 className="font-bold text-center text-lg mb-3">حدد مبلغ التبرع</h3>
                        <div className="relative">
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-20 text-4xl font-bold text-center border-2 border-primary/20 focus-visible:ring-primary/50 text-foreground"
                                placeholder="0"
                            />
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-lg">ر.ي</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                            {quickAmounts.map(val => (
                                <Button key={val} variant="outline" className="h-12 rounded-[10px]" onClick={() => setAmount(String(val))}>
                                    {val.toLocaleString('en-US')}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                 <Card className="rounded-[10px]">
                    <CardContent className="p-4">
                        <h3 className="font-bold text-center text-lg mb-3">اختر طريقة الدفع</h3>
                        <Tabs value={paymentMethod} onValueChange={setPaymentMethod} dir="rtl">
                            <TabsList className="grid w-full grid-cols-2 h-14 rounded-[10px] bg-muted">
                                <TabsTrigger value="wallet" className="h-full rounded-[8px] text-base gap-2 data-[state=active]:bg-sidebar-active-gradient data-[state=active]:text-primary-foreground">
                                    <Wallet /> المحفظة
                                </TabsTrigger>
                                <TabsTrigger value="bank" className="h-full rounded-[8px] text-base gap-2 data-[state=active]:bg-sidebar-active-gradient data-[state=active]:text-primary-foreground">
                                    <Banknote /> تحويل بنكي
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="wallet" className="text-center mt-3 text-sm text-muted-foreground">
                                رصيدك الحالي: <span className="font-bold text-primary">{userWallet?.cashBalance?.toLocaleString('en-US') ?? 0} ر.ي</span>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                 <Button className="w-full h-14 text-lg font-bold rounded-[10px]" onClick={handleConfirmDonation} disabled={isProcessing}>
                    {isProcessing ? 'جاري المعالجة...' : 'تأكيد التبرع'}
                </Button>
            </main>
        </div>

         <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-[10px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="text-xl">الدفع عبر تحويل بنكي</DialogTitle>
                    <DialogDescription className="text-right">
                        قم بالتحويل إلى أحد حساباتنا، ثم أرسل لنا صورة السند عبر واتساب.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {(bankAccounts || []).map(bank => (
                        <div key={bank.id} className="rounded-[10px] border p-3 space-y-2">
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
                        <Button className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600 text-white rounded-[10px]">
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
