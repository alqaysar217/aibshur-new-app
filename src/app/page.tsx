'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
          src="/logo-app.png"
          alt="أبشر Logo"
          width={128}
          height={128}
          priority
          className="rounded-lg"
        />
      </div>
      <h1 className="text-4xl font-bold text-foreground mt-4">أبشر</h1>
      <div className="absolute bottom-16">
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
