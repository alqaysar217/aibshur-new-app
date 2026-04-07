'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/select-governorate');
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-card">
      <div className="animate-in zoom-in-125 duration-1000 ease-in-out">
        <Image
          src="/logo-.png"
          alt="أبشر Logo"
          width={128}
          height={128}
          priority
          className="rounded-lg"
        />
      </div>
      <h1 className="text-4xl font-bold text-foreground mt-4">أبشر</h1>
      
      <div className="absolute bottom-24 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-lg">جاري التحميل...</p>
      </div>
    </div>
  );
}
