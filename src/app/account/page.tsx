'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bell, ShoppingCart, MapPin, Gem, HandHeart, Shield, FileText, HelpCircle, LogOut, ChevronLeft, User, Phone, Home, Wallet, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/bottom-nav';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';


// Types from other pages (assuming they are not exported, so redefining locally if needed)
type Client = {
  id: string;
  name: string;
  phone: string;
  governorateId: string;
  // ... other fields
};

type Governorate = {
  id: string;
  province_name: string;
};

type UserWallet = {
    pointsBalance: number;
    cashBalance: number;
};

const accountLinks = [
  { href: '#', label: 'محفظتي', description: 'إدارة رصيدك المالي والمعاملات', icon: Wallet },
  { href: '#', label: 'نقاط الولاء', description: 'عرض واستبدال نقاط الولاء الخاصة بك', icon: Star },
  { href: '/account/addresses', label: 'عنوان التوصيل', description: 'ادارة موقع استلام طلباتك', icon: Home },
  { href: '/select-governorate?redirect=/account', label: 'تغيير المحافظة', description: 'تغيير موقعك لعرض متاجر مختلفة', icon: MapPin },
  { href: '/vip', label: 'عضوية ابشر VIP', description: 'مزايا توصيل مجاني', icon: Gem },
  { href: '/donations', label: 'بوابة التبرعات', description: 'شارك في اعمال الخير', icon: HandHeart },
  { href: '#', label: 'الخصوصية والامان', description: 'سياسة حماية بيانات', icon: Shield },
  { href: '/terms', label: 'شروط الاحكام', description: 'حقوقك والتزاماتك القانونية', icon: FileText },
  { href: '#', label: 'مركز المساعدة', description: 'الاسئلة الشائعة والدعم الفني', icon: HelpCircle },
];

export default function AccountPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [userPhone, setUserPhone] = useState<string | null>(null);

    // This effect now also handles listening for storage changes to update the page
    useEffect(() => {
        const phoneFromStorage = localStorage.getItem('userPhone');
        if (phoneFromStorage) {
            setUserPhone(phoneFromStorage);
        }

        const handleStorageChange = () => {
             const phoneFromStorage = localStorage.getItem('userPhone');
             setUserPhone(phoneFromStorage);
        }

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        }
    }, []);


    // Create a query that filters clients by phone number
    const clientsQuery = useMemoFirebase(() => {
        if (!firestore || !userPhone) return null;
        return query(collection(firestore, 'clients'), where('phone', '==', userPhone));
    }, [firestore, userPhone]);
    
    // Fetching data
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    const { data: governorates, isLoading: isLoadingGovernorates } = useCollection<Governorate>(useMemoFirebase(() => firestore ? collection(firestore, 'app_provinces') : null, [firestore]));
    
    const walletRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, 'users', user.uid, 'wallet', 'main') : null, [firestore, user]);
    const { data: userWallet, isLoading: isLoadingWallet } = useDoc<UserWallet>(walletRef);

    // Get the specific client profile from the filtered query result
    const clientProfile = useMemo(() => clients?.[0], [clients]);

    const governoratesMap = useMemo(() => governorates?.reduce((acc, g) => ({ ...acc, [g.id]: g.province_name }), {} as Record<string, string>) || {}, [governorates]);
    
    const [currentGovernorateName, setCurrentGovernorateName] = useState('...');
    
    useEffect(() => {
      if (isLoadingGovernorates) return;
      const selectedGovId = localStorage.getItem('selectedGovernorateId');
      
      if (selectedGovId && governoratesMap[selectedGovId]) {
        setCurrentGovernorateName(governoratesMap[selectedGovId]);
      } else if (clientProfile && governoratesMap[clientProfile.governorateId]) {
        setCurrentGovernorateName(governoratesMap[clientProfile.governorateId]);
      } else if (!isLoadingClients) {
        setCurrentGovernorateName('...');
      }
    }, [clientProfile, governoratesMap, isLoadingClients, isLoadingGovernorates]);


    const isLoading = isLoadingClients || isLoadingGovernorates || isUserLoading || isLoadingWallet;

    const handleLogout = async () => {
        try {
            if (auth) {
                await signOut(auth);
                localStorage.removeItem('userPhone'); // Also clear phone from storage
                localStorage.removeItem('selectedGovernorateId'); // Clear governorate
                router.push('/login');
            }
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <div className="bg-background min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between h-16 px-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/home"><ArrowRight className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="font-bold text-lg">حسابي</h1>
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

            <main className="flex flex-col">
                {/* Profile Info */}
                <div className="flex flex-col items-center p-6 bg-card border-y">
                    <div className="relative">
                        <Image
                            src="/profile.png"
                            alt="Profile Picture"
                            width={96}
                            height={96}
                            className="rounded-full border-4 border-background shadow-md bg-muted"
                        />
                         <Badge className={cn("absolute -bottom-1 -right-1 border-2 border-background px-2 py-1 flex items-center gap-1.5 bg-sidebar-active-gradient text-sidebar-primary-foreground")}>
                            <User className="h-3.5 w-3.5"/>
                            <span>مستخدم</span>
                         </Badge>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2 mt-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    ) : clientProfile ? (
                        <>
                            <h2 className="text-2xl font-bold mt-4">{clientProfile.name}</h2>
                            <div className="text-muted-foreground text-sm mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <span className="text-foreground" dir="ltr">{clientProfile.phone}</span>
                                </div>
                                <div className="hidden sm:block">•</div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span className="text-foreground font-medium">{currentGovernorateName}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                         <p className="mt-4 text-muted-foreground">لم يتم العثور على بيانات المستخدم.</p>
                    )}
                </div>

                {/* Wallet & Points Summary */}
                <div className="grid grid-cols-2 gap-3 p-4">
                    <Link href="#" className="block">
                        <Card className="p-3 shadow-sm rounded-lg transition-transform active:scale-[0.98] h-full">
                            <div className="flex flex-col justify-between h-full space-y-2">
                                <div className="flex items-start justify-between">
                                    <p className="font-bold text-base text-foreground">رصيد المحفظة</p>
                                    <div className="p-2 bg-sidebar-active-gradient rounded-lg shadow">
                                        <Wallet className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                </div>
                                <p className="font-black text-2xl">
                                    {isLoading ? <Skeleton className="h-8 w-24" /> : `${userWallet?.cashBalance?.toLocaleString() || 0} ر.ي`}
                                </p>
                            </div>
                        </Card>
                    </Link>
                    <Link href="#" className="block">
                        <Card className="p-3 shadow-sm rounded-lg transition-transform active:scale-[0.98] h-full">
                            <div className="flex flex-col justify-between h-full space-y-2">
                                <div className="flex items-start justify-between">
                                    <p className="font-bold text-base text-foreground">نقاط الولاء</p>
                                    <div className="p-2 bg-sidebar-active-gradient rounded-lg shadow">
                                        <Star className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                </div>
                                <p className="font-black text-2xl">
                                    {isLoading ? <Skeleton className="h-8 w-16" /> : userWallet?.pointsBalance?.toLocaleString() || 0}
                                </p>
                            </div>
                        </Card>
                    </Link>
                </div>


                {/* Account Links */}
                <div className="p-4 space-y-2">
                    {accountLinks.map((item) => (
                         <Link href={item.href} key={item.label} className="block">
                            <Card className="hover:bg-secondary/50 transition-colors active:scale-[0.98] shadow-sm">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-sidebar-active-gradient p-2 rounded-lg text-primary-foreground">
                                           <item.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-base bg-sidebar-active-gradient text-transparent bg-clip-text">{item.label}</span>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        </div>
                                    </div>
                                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <Separator className="my-1" />

                {/* Logout Button */}
                <div className="p-4">
                    <Button onClick={handleLogout} variant="outline" className="w-full h-12 text-base font-semibold border-destructive text-destructive hover:bg-destructive/5 hover:text-destructive">
                        <LogOut className="h-5 w-5" />
                        تسجيل الخروج
                    </Button>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
