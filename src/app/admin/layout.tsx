'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Banknote, Map, LayoutGrid, Store, ShoppingBasket, ClipboardList, 
  Calendar, UsersRound, Bike, Diamond, Star, Megaphone, TicketPercent, HandHeart, 
  BarChart3, TrendingUp, Settings, LifeBuoy, LogOut, Bell, PanelRightClose, PanelRightOpen, Loader2, Wallet
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { Notification } from '@/lib/notifications';
import { collection, doc } from 'firebase/firestore';
import type { Admin } from '../users/page';

const sidebarNavItems = [
    { label: 'الرئيسية', href: '/admin/dashboard', icon: Home },
    { label: 'تقارير المبيعات', href: '/admin/sales-reports', icon: BarChart3 },
    { label: 'إدارة الطلبات', href: '/admin/orders', icon: ClipboardList },
    { label: 'إدارة المواعيد', href: '/admin/appointments', icon: Calendar },
    { label: 'إدارة المتاجر', href: '/admin/stores', icon: Store },
    { label: 'إدارة المنتجات', href: '/admin/products', icon: ShoppingBasket },
    { label: 'إدارة الفئات', href: '/admin/categories', icon: LayoutGrid },
    { label: 'إدارة المستخدمين', href: '/admin/users', icon: UsersRound },
    { label: 'طلبات المناديب', href: '/admin/delegates', icon: Bike },
    { label: 'إدارة الإعلانات', href: '/admin/ads', icon: Megaphone },
    { label: 'إدارة الكوبونات', href: '/admin/coupons', icon: TicketPercent },
    { label: 'إدارة الإشعارات', href: '/admin/notifications', icon: Bell },
    { label: 'إدارة التبرعات', href: '/admin/donations', icon: HandHeart },
    { label: 'إدارة أنواع التبرعات', href: '/admin/donation-types', icon: HandHeart },
    { label: 'باقات VIP', href: '/admin/vip', icon: Diamond },
    { label: 'نقاط الولاء', href: '/admin/loyalty', icon: Star },
    { label: 'إدارة المحافظ', href: '/admin/wallets', icon: Wallet },
    { label: 'إدارة المحافظات', href: '/admin/governorates', icon: Map },
    { label: 'الحسابات البنكية', href: '/admin/bank-accounts', icon: Banknote },
    { label: 'أداء الموظفين', href: '/admin/performance', icon: TrendingUp },
    { label: 'إعدادات النظام', href: '/admin/settings', icon: Settings },
    { label: 'الدعم الفني', href: '/admin/support', icon: LifeBuoy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    
    const adminDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'admins', user.uid);
    }, [firestore, user]);
    const { data: adminProfile, isLoading: isLoadingAdminProfile } = useDoc<Admin>(adminDocRef);

    // Check if the DB is seeded before fetching collections that might not exist.
    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'systemSettings', 'main') : null, [firestore]);
    const { data: settings } = useDoc(settingsDocRef);
    const isSeeded = !!settings;

    const notificationsQuery = useMemoFirebase(() => (firestore && user?.uid && isSeeded) ? collection(firestore, 'notifications') : null, [firestore, user?.uid, isSeeded]);
    const { data: notifications } = useCollection<Notification>(notificationsQuery);
    const unreadCount = useMemo(() => (notifications || []).filter(n => !n.isRead).length, [notifications]);

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
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router]);
    
    useEffect(() => {
        // If we are done checking for the admin profile, and it doesn't exist,
        // and we are NOT on the profile page already, then redirect to create it.
        if (!isLoadingAdminProfile && !adminProfile && pathname !== '/admin/profile') {
            router.replace('/admin/profile');
        }
    }, [isLoadingAdminProfile, adminProfile, pathname, router]);

    if (isUserLoading || isLoadingAdminProfile || (!adminProfile && pathname !== '/admin/profile')) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const NavLink = ({ href, icon: Icon, text, isCollapsed }: { href: string, icon: React.ElementType, text: string, isCollapsed: boolean }) => {
        const isActive = pathname === href;
        return (
          <Link href={href} title={isCollapsed ? text : ''}>
            <span
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-200',
                isActive
                  ? 'bg-sidebar-active-gradient text-sidebar-primary-foreground shadow-inner'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
            >
              <div className={cn("p-1.5 rounded-md", isActive ? 'bg-black/10' : 'bg-sidebar-accent/80')}>
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-primary' )} />
              </div>
              <span className={cn('transition-opacity duration-200 whitespace-nowrap', isCollapsed ? 'w-0 opacity-0 hidden' : 'opacity-100')}>
                {text}
              </span>
            </span>
          </Link>
        );
      };

    return (
        <div className="min-h-screen w-full bg-background flex" dir="rtl">
                        <aside className={cn(
                            "h-screen z-10 bg-sidebar border-l border-sidebar-border flex flex-col transition-all duration-300 ease-in-out sticky top-0",
                            isCollapsed ? 'w-24' : 'w-72'
                        )}>
                            <div className={cn("flex items-center h-16 border-b shrink-0 px-4 gap-3", isCollapsed && "justify-center px-2")}>
                <Image 
                    src="/logo.png" 
                    alt="أبشر Logo" 
                    width={35} 
                    height={35} 
                    className="rounded-lg object-cover aspect-square" 
                />
                <span className={cn(
                    "font-black text-lg transition-opacity duration-200 whitespace-nowrap text-primary",
                    isCollapsed ? 'w-0 opacity-0 hidden' : 'opacity-100'
                )}>
                    لوحة التحكم
                </span>
            </div>

                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {sidebarNavItems.map((link) => (
                        <NavLink key={link.label} href={link.href} icon={link.icon} text={link.label} isCollapsed={isCollapsed} />
                    ))}
                </nav>
                
                <div className="px-4 py-4 border-t border-sidebar-border shrink-0">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors duration-200 text-red-500/80 hover:bg-destructive/10 hover:text-red-500 rounded-md',
                            isCollapsed ? 'justify-center' : 'justify-start'
                        )}
                    >
                        <LogOut className={'w-5 h-5 shrink-0'} />
                        <span className={cn("transition-opacity duration-200 whitespace-nowrap", isCollapsed ? 'w-0 opacity-0 hidden' : 'opacity-100')}>
                            تسجيل الخروج
                        </span>
                    </Button>
                </div>
            </aside>

            <div className="flex flex-col flex-1 min-w-0">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 shadow-sm">
                    <Button variant="outline" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0">
                        {isCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                    
                    <div className="flex items-center gap-2 mr-auto">
                        <Button variant="ghost" size="icon" className="relative" asChild>
                            <Link href="/admin/notifications">
                                <Bell className="h-5 w-5 text-gray-500" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border">
                                    <Avatar className="h-full w-full">
                                        <AvatarImage src={adminProfile?.personalPhotoUrl || "/profile.png"} alt={adminProfile?.name || "Admin"}/>
                                        <AvatarFallback>{adminProfile?.name.charAt(0) || 'A'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="font-bold">
                                <DropdownMenuItem asChild className="text-right cursor-pointer">
                                    <Link href="/admin/profile">الملف الشخصي</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout} className="text-right cursor-pointer">
                                    تسجيل الخروج
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
