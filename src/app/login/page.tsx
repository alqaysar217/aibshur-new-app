'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Phone } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { countries, type Country } from '@/lib/countries';

export default function LoginPage() {
  const router = useRouter();
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-illustration');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    router.push(`/otp?phone=${phone}`);
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
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                    type="tel"
                    placeholder="7X XXX XXXX"
                    className="w-full text-right tracking-[0.2em] text-lg h-14 pr-12 pl-20 text-foreground"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="absolute inset-y-0 left-0 flex items-center px-4 cursor-pointer border-e h-14 top-0">
                      <span className="text-2xl">{selectedCountry.flag}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-60 overflow-y-auto">
                    {countries.map((country) => (
                      <DropdownMenuItem
                        key={country.code}
                        onSelect={() => setSelectedCountry(country)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span>{country.name} ({country.dialCode})</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
