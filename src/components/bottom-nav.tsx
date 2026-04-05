'use client';

import Link from 'next/link';
import { Home, Search, ClipboardList, Heart, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', label: 'الرئيسية', icon: Home },
  { href: '/search', label: 'البحث', icon: Search },
  { href: '/orders', label: 'طلباتي', icon: ClipboardList },
  { href: '/favorites', label: 'المفضلة', icon: Heart },
  { href: '/account', label: 'حسابي', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto h-16 bg-card border-t w-full max-w-md shadow-t-lg safe-area-bottom">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.label} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
