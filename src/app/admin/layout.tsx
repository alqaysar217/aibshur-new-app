'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Banknote, Map, LayoutGrid, Store, ShoppingBasket, ClipboardList, 
  Calendar, Users, Bike, Gem, Star, Megaphone, Ticket, HandHeart, 
  BarChart2, TrendingUp, Settings, LifeBuoy, LogOut, Bell, PanelRightClose, PanelRightOpen 
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const sidebarNavItems = [
    { label: 'الرئيسية', href: '/admin/dashboard', icon: Home },
    { label: 'إدارة الحسابات البنكية', href: '#', icon: Banknote },
    { label: 'إدارة المحافظات', href: '#', icon: Map },
    { label: 'إدارة الفئات', href: '#', icon: LayoutGrid },
    { label: 'إدارة المتاجر', href: '#', icon: Store },
    { label: 'إدارة المنتجات', href: '#', icon: ShoppingBasket },
    { label: 'إدارة الطلبات', href: '#', icon: ClipboardList },
    { label: 'إدارة المواعيد', href: '#', icon: Calendar },
    { label: 'إدارة المستخدمين', href: '#', icon: Users },
    { label: 'إدارة طلبات المناديب', href: '#', icon: Bike },
    { label: 'إدارة باقات VIP', href: '#', icon: Gem },
    { label: 'إدارة نقاط الولاء', href: '#', icon: Star },
    { label: 'إدارة الإعلانات', href: '#', icon: Megaphone },
    { label: 'إدارة الكوبونات', href: '#', icon: Ticket },
    { label: 'إدارة التبرعات', href: '#', icon: HandHeart },
    { label: 'إدارة تقارير المبيعات', href: '#', icon: BarChart2 },
    { label: 'إدارة أداء الموظفين', href: '#', icon: TrendingUp },
    { label: 'إعدادات النظام', href: '#', icon: Settings },
    { label: 'الدعم الفني', href: '#', icon: LifeBuoy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        /* تمت إضافة dir="rtl" لضمان توزيع العناصر برمجياً وبصرياً لليمين */
        <div className="min-h-screen w-full bg-muted/40 flex" dir="rtl">
            {/* Aside: تم تغيير border-l إلى border-l ليكون الحد الفاصل على اليسار لأن القائمة على اليمين */}
            <aside className={cn(
                "h-screen z-10 bg-card border-l flex flex-col transition-all duration-300 ease-in-out sticky top-0 shadow-sm",
                isCollapsed ? 'w-20' : 'w-72'
            )}>
                {/* Header */}
              {/* Header */}
                <div className={cn("flex items-center h-16 border-b shrink-0 px-4 gap-3", isCollapsed && "justify-center px-2")}>
                    <Image 
                        src="/logo-app.png" 
                        alt="أبشر Logo" 
                        width={32} 
                        height={32} 
                        className="rounded-[10px] object-cover" // تم إضافة انحناء الزوايا هنا بمقدار 10 بكسل
                    />
                    <span className={cn(
                        "font-black text-lg transition-opacity duration-200 whitespace-nowrap text-primary",
                        isCollapsed ? 'w-0 opacity-0 hidden' : 'opacity-100'
                    )}>
                        لوحة التحكم
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {sidebarNavItems.map((link) => (
                        <NavLink key={link.label} href={link.href} icon={link.icon} text={link.label} isCollapsed={isCollapsed} />
                    ))}
                </nav>
                
                {/* Footer */}
                <div className="px-4 py-4 border-t shrink-0">
                    <Link href="/login">
                        <span
                        className={cn(
                            'flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors duration-200 text-destructive hover:bg-destructive/10',
                            isCollapsed && 'justify-center'
                        )}
                        >
                        <LogOut className={'w-5 h-5 shrink-0'} />
                        <span className={cn("transition-opacity duration-200 whitespace-nowrap", isCollapsed ? "opacity-0 hidden" : "opacity-100")}>
                            تسجيل الخروج
                        </span>
                        </span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
                    {/* زر التصغير والتكبير */}
                    <Button variant="outline" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0 border-gray-100">
                        {isCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                    
                    {/* شريط الأدوات العلوي - العناصر هنا ستدفع لليسار تلقائياً بسبب RTL */}
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
                                <DropdownMenuItem asChild className="text-right">
                                    <Link href="/login">تسجيل الخروج</Link>
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