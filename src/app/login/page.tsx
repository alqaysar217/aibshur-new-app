'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const router = useRouter();
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-illustration');

  const handleContinue = () => {
    router.push('/otp');
  };

  return (
    <div className="flex flex-col min-h-screen bg-card p-6 justify-center">
      <div className="flex flex-col items-center text-center">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            width={300}
            height={200}
            className="mb-8 rounded-lg"
            data-ai-hint={loginImage.imageHint}
          />
        )}
        <h1 className="text-3xl font-bold mb-2">تسجيل الدخول</h1>
        <p className="text-muted-foreground mb-8">
          أدخل رقم هاتفك للمتابعة
        </p>
        
        <div className="w-full max-w-sm">
            <div className="relative mb-4">
                <Input
                    type="tel"
                    placeholder="7X XXX XXXX"
                    className="w-full text-left tracking-[0.2em] text-lg h-14 pe-32 text-foreground"
                    dir="ltr"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pe-4 pointer-events-none border-s">
                    <Image
                        src="/yemen-flag.svg"
                        alt="Yemen Flag"
                        width={24}
                        height={16}
                    />
                    <span className="ms-2 font-semibold text-lg text-muted-foreground">+967</span>
                </div>
            </div>
            
            <Button className="w-full h-12 text-lg font-semibold" onClick={handleContinue}>
                متابعة
            </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  );
}
