'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Banknote, Map, LayoutGrid, Store, ShoppingBasket, ClipboardList, 
  Calendar, Users, Bike, Gem, Star, Megaphone, Ticket, HandHeart, 
  BarChart2, TrendingUp, Settings, LifeBuoy, LogOut, Bell, PanelRightClose, PanelRightOpen, Loader2
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const sidebarNavItems = [
    { label: 'الرئيسية', href: '/admin/dashboard', icon: Home },
    { label: 'إدارة الحسابات البنكية', href: '/admin/bank-accounts', icon: Banknote },
    { label: 'إدارة المحافظات', href: '/admin/governorates', icon: Map },
    { label: 'إدارة الفئات', href: '/admin/categories', icon: LayoutGrid },
    { label: 'إدارة المتاجر', href: '/admin/stores', icon: Store },
    { label: 'إدارة المنتجات', href: '/admin/products', icon: ShoppingBasket },
    { label: 'إدارة الطلبات', href: '/admin/orders', icon: ClipboardList },
    { label: 'إدارة المواعيد', href: '/admin/appointments', icon: Calendar },
    { label: 'إدارة المستخدمين', href: '/admin/users', icon: Users },
    { label: 'طلبات المناديب', href: '/admin/delegates', icon: Bike },
    { label: 'إدارة باقات VIP', href: '/admin/vip', icon: Gem },
    { label: 'إدارة نقاط الولاء', href: '/admin/loyalty', icon: Star },
    { label: 'إدارة الإعلانات', href: '/admin/ads', icon: Megaphone },
    { label: 'إدارة الكوبونات', href: '/admin/coupons', icon: Ticket },
    { label: 'إدارة أنواع التبرعات', href: '/admin/donation-types', icon: HandHeart },
    { label: 'إدارة التبرعات', href: '/admin/donations', icon: HandHeart },
    { label: 'إدارة تقارير المبيعات', href: '/admin/sales-reports', icon: BarChart2 },
    { label: 'إدارة أداء الموظفين', href: '/admin/performance', icon: TrendingUp },
    { label: 'إعدادات النظام', href: '/admin/settings', icon: Settings },
    { label: 'الدعم الفني', href: '/admin/support', icon: LifeBuoy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, isUserLoading } = useUser();
    const auth = useAuth();

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

    if (isUserLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const NavLink = ({ href, icon: Icon, text, isCollapsed }) => {
        const isActive = pathname === href;
        return (
          <Link href={href} title={isCollapsed ? text : ''}>
            <span
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0')} />
              <span className={cn('transition-opacity duration-200 whitespace-nowrap font-bold', isCollapsed ? 'w-0 opacity-0 hidden' : 'opacity-100')}>
                {text}
              </span>
            </span>
          </Link>
        );
      };

    return (
        <div className="min-h-screen w-full bg-muted/40 flex" dir="rtl">
            <aside className={cn(
                "h-screen z-10 bg-card border-l flex flex-col transition-all duration-300 ease-in-out sticky top-0 shadow-sm",
                isCollapsed ? 'w-20' : 'w-72'
            )}>
                <div className={cn("flex items-center h-16 border-b shrink-0 px-4 gap-3", isCollapsed && "justify-center px-2")}>
                    <Image 
                        src="/logo-app.png" 
                        alt="أبشر Logo" 
                        width={32} 
                        height={32} 
                        className="rounded-[10px] object-cover"
                    />
                    <span className={cn(
                        "font-black text-lg transition-opacity duration-200 whitespace-nowrap text-primary",
                        isCollapsed ? 'w-0 opacity-0 hidden' : 'opacity-100'
                    )}>
                        لوحة التحكم
                    </span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {sidebarNavItems.map((link) => (
                        <NavLink key={link.label} href={link.href} icon={link.icon} text={link.label} isCollapsed={isCollapsed} />
                    ))}
                </nav>
                
                <div className="px-4 py-4 border-t shrink-0">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors duration-200 text-destructive hover:bg-destructive/10',
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
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
                    <Button variant="outline" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0 border-gray-100">
                        {isCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                    
                    <div className="flex items-center gap-2 mr-auto">
                        <Button variant="ghost" size="icon" className="rounded-full relative">
                            <Bell className="h-5 w-5 text-gray-500" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-primary/10">
                                    <Avatar className="h-full w-full">
                                        <AvatarImage src="/profile.png" alt="Admin"/>
                                        <AvatarFallback>AD</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="font-bold">
                                <DropdownMenuItem className="text-right">الملف الشخصي</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout} className="text-right cursor-pointer">
                                    تسجيل الخروج
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-50/30">
                    {children}
                </main>
            </div>
        </div>
    );
}
