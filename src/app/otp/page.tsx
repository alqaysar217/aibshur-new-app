'use client';

import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2, Phone } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn } from '@/firebase';

const OTP_LENGTH = 6;
const MOCK_OTP_USER = "123456";
const MOCK_OTP_ADMIN = "654321";


export default function OtpPage() {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpImage = PlaceHolderImages.find(p => p.id === 'otp-illustration');
  const auth = useAuth();

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    const finalOtp = newOtp.join('');

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (finalOtp.length === OTP_LENGTH) {
      handleSubmit(finalOtp);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (finalOtp: string) => {
    if (finalOtp === MOCK_OTP_ADMIN) {
      initiateAnonymousSignIn(auth);
      if (phone) {
        localStorage.setItem('userPhone', phone);
      }
      router.push('/admin/dashboard');
    } else if (finalOtp === MOCK_OTP_USER) {
      initiateAnonymousSignIn(auth);
      if (phone) {
        localStorage.setItem('userPhone', phone);
      }
      router.push('/home');
    } else {
      setError('الرمز غير صحيح. حاول مرة أخرى.');
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-card p-6 text-center">
      {otpImage && (
          <Image
              src={otpImage.imageUrl}
              alt={otpImage.description}
              width={300}
              height={200}
              className="mb-8 rounded-lg object-contain"
              data-ai-hint={otpImage.imageHint}
          />
      )}
      <h1 className="text-3xl font-bold mb-4">التحقق من الرمز</h1>
      <p className="text-muted-foreground mb-8 max-w-xs">
        أدخل الرمز المكون من {OTP_LENGTH} أرقام الذي تم إرساله إلى هاتفك.
      </p>
      
      <div className="flex items-center gap-2 mb-6" dir="rtl">
        {otp.map((data, index) => (
          <Input
            key={index}
            type="tel"
            maxLength={1}
            value={data}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target, index)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index)}
            ref={(el) => (inputRefs.current[index] = el)}
            className="w-12 h-14 text-center text-2xl font-bold bg-muted"
            autoFocus={index === 0}
          />
        ))}
      </div>
      
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}
      
      <p className="text-sm text-muted-foreground">
        لم تستلم الرمز؟{' '}
        <Button variant="link" className="p-0 h-auto text-primary">
          إعادة إرسال
        </Button>
      </p>
    </div>
  );
}
