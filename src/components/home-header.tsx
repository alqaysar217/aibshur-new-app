import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Search, Bell, ShoppingCart } from 'lucide-react';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search"><Search className="h-5 w-5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notifications"><Bell className="h-5 w-5" /></Link>
          </Button>
           <Button variant="ghost" size="icon" asChild>
            <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
          </Button>
        </div>
        <Link href="/home" className="flex items-center gap-2">
          <span className="font-bold text-xl">أبشر</span>
          <Image src="/logo.svg" alt="أبشر Logo" width={32} height={32} />
        </Link>
      </div>
    </header>
  );
}
