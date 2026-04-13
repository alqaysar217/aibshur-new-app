'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bell, ShoppingCart, MapPin, Gem, HandHeart, Shield, FileText, HelpCircle, LogOut, ChevronLeft, User, Phone, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/bottom-nav';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useAuth } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
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

const accountLinks = [
  { href: '#', label: 'عنوان التوصيل', description: 'ادارة موقع استلام طلباتك', icon: MapPin },
  { href: '#', label: 'عضوية ابشر VIP', description: 'مزايا توصيل مجاني', icon: Gem },
  { href: '#', label: 'بوابة التبرعات', description: 'شارك في اعمال الخير', icon: HandHeart },
  { href: '#', label: 'الخصوصية والامان', description: 'سياسة حماية بيانات', icon: Shield },
  { href: '/terms', label: 'شروط الاحكام', description: 'حقوقك والتزاماتك القانونية', icon: FileText },
  { href: '#', label: 'مركز المساعدة', description: 'الاسئلة الشائعة والدعم الفني', icon: HelpCircle },
];

export default function AccountPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // Fetching data
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
    const { data: governorates, isLoading: isLoadingGovernorates } = useCollection<Governorate>(useMemoFirebase(() => firestore ? collection(firestore, 'app_provinces') : null, [firestore]));

    // Assuming the first client is the current user for demonstration purposes
    const clientProfile = useMemo(() => clients?.[0], [clients]);

    const governoratesMap = useMemo(() => governorates?.reduce((acc, g) => ({ ...acc, [g.id]: g.province_name }), {} as Record<string, string>) || {}, [governorates]);
    
    const currentGovernorateName = clientProfile ? governoratesMap[clientProfile.governorateId] : '...';

    const isLoading = isLoadingClients || isLoadingGovernorates;

    const handleGovernorateChange = (governorateId: string) => {
        if (!firestore || !clientProfile) return;
        
        const clientDocRef = doc(firestore, 'clients', clientProfile.id);
        updateDocumentNonBlocking(clientDocRef, { governorateId });
        
        toast({
            title: "تم تغيير المحافظة",
            description: `تم تحديث محافظتك إلى ${governoratesMap[governorateId]}.`,
        });
    };

    const handleLogout = async () => {
        try {
            if (auth) {
                await signOut(auth);
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
                <div className="flex flex-col items-center p-6 bg-card border-b">
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
                                    <Phone className="h-4 w-4" />
                                    <span dir="ltr">{clientProfile.phone}</span>
                                </div>
                                <div className="hidden sm:block">•</div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-primary">
                                            <MapPin className="h-4 w-4" />
                                            <span>{currentGovernorateName}</span>
                                            <Edit className="h-3 w-3" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {governorates?.map((gov) => (
                                            <DropdownMenuItem key={gov.id} onSelect={() => handleGovernorateChange(gov.id)}>
                                                {gov.province_name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </>
                    ) : (
                         <p className="mt-4 text-muted-foreground">لم يتم العثور على بيانات المستخدم.</p>
                    )}
                </div>

                {/* Account Links */}
                <div className="p-4 space-y-2">
                    {accountLinks.map((item) => (
                         <Link href={item.href} key={item.label} className="block">
                            <Card className="hover:bg-secondary/50 transition-colors active:scale-[0.98] shadow-sm">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                           <item.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-base">{item.label}</span>
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
