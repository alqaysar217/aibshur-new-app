'use client';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarFooter } from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Banknote, Map, LayoutGrid, Store, ShoppingBasket, ClipboardList, Calendar, Users, Bike, Gem, Star, Megaphone, Ticket, HandHeart, BarChart2, TrendingUp, Settings, LifeBuoy, LogOut, Bell } from 'lucide-react';
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

    return (
        <div className="min-h-screen w-full bg-background">
            <SidebarProvider>
                <Sidebar collapsible="icon" side="right" className="peer">
                    <SidebarContent>
                        <SidebarMenu>
                            {sidebarNavItems.map((item) => (
                                 <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={{ children: item.label, side: 'left', align: 'center' }}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                        <SidebarMenu>
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip={{ children: 'تسجيل الخروج', side: 'left', align: 'center' }}>
                                    <Link href="/login">
                                        <LogOut />
                                        <span>تسجيل الخروج</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <div className={cn(
                    "flex flex-col flex-1 min-h-screen transition-all",
                    "md:mr-[var(--sidebar-width-icon)]",
                    "peer-data-[state=expanded]:md:mr-[var(--sidebar-width)]"
                )}>
                    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                        <SidebarTrigger className="md:hidden" />
                        <div className="flex items-center gap-2">
                            <Image src="/logo-app.png" alt="Logo" width={32} height={32} />
                            <h1 className="font-semibold text-xl">لوحة التحكم</h1>
                        </div>

                        <div className="flex items-center gap-2 mr-auto">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Bell className="h-5 w-5" />
                                <span className="sr-only">Toggle notifications</span>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 px-2 flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/profile.png" alt="Admin"/>
                                            <AvatarFallback>AD</AvatarFallback>
                                        </Avatar>
                                        <div className="hidden md:flex flex-col items-start">
                                            <span className="font-semibold text-sm">Admin User</span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/login">تسجيل الخروج</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6 bg-muted/40">
                        {children}
                    </main>
                </div>
            </SidebarProvider>
        </div>
    );
}
