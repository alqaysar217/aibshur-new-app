'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2, Phone } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { countries, type Country } from '@/lib/countries';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const loginImage = PlaceHolderImages.find(p => p.id === 'login-illustration');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
    if (!firestore) return false;
    const userCollections: ('clients' | 'drivers_v2' | 'storeOwners' | 'admins')[] = ['clients', 'drivers_v2', 'storeOwners', 'admins'];

    try {
      const queries = userCollections.map(col =>
        getDocs(query(collection(firestore, col), where("phone", "==", phoneNumber)))
      );

      const results = await Promise.all(queries);
      
      return results.some(snapshot => !snapshot.empty);
    } catch (error) {
      console.error("Error checking user existence:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "لا يمكن التحقق من رقم الهاتف حالياً. الرجاء المحاولة لاحقاً.",
      });
      return false;
    }
  };

  const handleContinue = async () => {
    if (!phone || phone.length < 9) {
      toast({
        variant: "destructive",
        title: "رقم هاتف غير صالح",
        description: "الرجاء إدخال رقم هاتف صحيح.",
      });
      return;
    }
    
    setIsLoading(true);
    const userExists = await checkUserExists(phone);
    setIsLoading(false);

    if (userExists) {
      router.push(`/otp?phone=${phone}`);
    } else {
      toast({
        variant: "destructive",
        title: "الحساب غير موجود",
        description: "لا يوجد حساب مرتبط بهذا الرقم. الرجاء إنشاء حساب جديد.",
      });
    }
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
                    disabled={isLoading}
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
            
            <Button className="w-full h-12 text-lg font-semibold" onClick={handleContinue} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'متابعة'}
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
