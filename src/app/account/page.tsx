import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bell, ShoppingCart, MapPin, Gem, Gift, Shield, FileText, HelpCircle, LogOut, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/bottom-nav';
import { Separator } from '@/components/ui/separator';

const accountLinks = [
  { href: '#', label: 'عنوان التوصيل', icon: MapPin },
  { href: '#', label: 'عضوية ابشر VIP', icon: Gem },
  { href: '#', label: 'بوابة التبرعات', icon: Gift },
  { href: '#', label: 'الخصوصية والامان', icon: Shield },
  { href: '/terms', label: 'شروط الاحكام', icon: FileText },
  { href: '#', label: 'مركز المساعدة', icon: HelpCircle },
];

export default function AccountPage() {
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
                         <Badge className="absolute -bottom-1 -right-1 border-2 border-background px-2 py-0.5">مستخدم</Badge>
                    </div>
                    <h2 className="text-2xl font-bold mt-4">مستخدم أبشر</h2>
                    <div className="text-muted-foreground text-sm mt-2 flex items-center gap-4">
                        <span>+967 777 123 456</span>
                        <span>•</span>
                        <span>أمانة العاصمة</span>
                    </div>
                </div>

                {/* Account Links */}
                <div className="p-4 space-y-2">
                    {accountLinks.map((item) => (
                         <Link href={item.href} key={item.label} className="block">
                            <Card className="hover:bg-secondary/50 transition-colors active:scale-[0.98] shadow-sm">
                                <CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <item.icon className="h-5 w-5 text-primary" />
                                        <span className="font-semibold text-base">{item.label}</span>
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
                    <Button variant="outline" className="w-full h-12 text-base font-semibold border-destructive text-destructive hover:bg-destructive/5 hover:text-destructive">
                        <LogOut className="ml-2 h-5 w-5" />
                        تسجيل الخروج
                    </Button>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
