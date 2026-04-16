'use client';

import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2 } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const OTP_LENGTH = 6;
const MOCK_OTP_USER = "123456";
const MOCK_OTP_ADMIN = "654321";
const MOCK_OTP_DELEGATE = "666666";
const MOCK_OTP_STORE_OWNER = "000000";

type UserRole = 'client' | 'delegate' | 'storeOwner' | 'admin' | 'unknown';
type UserCollection = 'clients' | 'drivers_v2' | 'storeOwners' | 'admins';


export default function OtpPage() {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpImage = PlaceHolderImages.find(p => p.id === 'otp-illustration');
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const getUserRoles = async (phoneNumber: string): Promise<UserRole[]> => {
      if (!firestore) return [];
      const roles: UserRole[] = [];
      const collections: { name: UserCollection, role: UserRole }[] = [
          { name: 'clients', role: 'client' },
          { name: 'drivers_v2', role: 'delegate' },
          { name: 'storeOwners', role: 'storeOwner' },
          { name: 'admins', role: 'admin' },
      ];

      for (const coll of collections) {
          try {
            const q = query(collection(firestore, coll.name), where("phone", "==", phoneNumber));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                roles.push(coll.role);
            }
          } catch (e) {
            console.error(`Error querying ${coll.name}:`, e);
          }
      }
      return roles;
  };


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

  const handleSubmit = async (finalOtp: string) => {
    if (!phone) {
        setError('رقم الهاتف غير موجود.');
        return;
    }
    setIsLoading(true);
    setError('');
    
    const userRoles = await getUserRoles(phone);
    let isAuthenticated = false;
    let redirectPath = '/login';
    let roleToSave: UserRole = 'unknown';

    switch (finalOtp) {
        case MOCK_OTP_USER:
            if (userRoles.includes('client') || userRoles.length === 0) {
                isAuthenticated = true;
                redirectPath = userRoles.length > 0 ? '/home' : `/register?phone=${phone}&role=client`;
                roleToSave = 'client';
            } else {
                setError('هذا الحساب غير مسجل كعميل.');
            }
            break;

        case MOCK_OTP_ADMIN:
            if (userRoles.includes('admin')) {
                isAuthenticated = true;
                redirectPath = '/admin/dashboard';
                roleToSave = 'admin';
            } else {
                setError('هذا الحساب ليس لديه صلاحيات المسؤول.');
            }
            break;

        case MOCK_OTP_DELEGATE:
            if (userRoles.includes('delegate')) {
                isAuthenticated = true;
                redirectPath = '/delegate/dashboard'; // Placeholder
                roleToSave = 'delegate';
            } else {
                setError('هذا الحساب غير مسجل كمندوب.');
            }
            break;

        case MOCK_OTP_STORE_OWNER:
            if (userRoles.includes('storeOwner')) {
                isAuthenticated = true;
                redirectPath = '/store-owner/dashboard'; // Placeholder
                roleToSave = 'storeOwner';
            } else {
                setError('هذا الحساب غير مسجل كصاحب متجر.');
            }
            break;

        default:
            setError('الرمز غير صحيح. حاول مرة أخرى.');
            setOtp(new Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
    }

    if (isAuthenticated) {
        initiateAnonymousSignIn(auth);
        localStorage.setItem('userPhone', phone);
        localStorage.setItem('userRole', roleToSave);
        router.push(redirectPath);
    } else {
        setIsLoading(false);
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
      
      <div className="flex items-center gap-2 mb-6" dir="ltr">
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
            disabled={isLoading}
          />
        ))}
      </div>
      
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}
      
      {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />}

      <p className="text-sm text-muted-foreground">
        لم تستلم الرمز؟{' '}
        <Button variant="link" className="p-0 h-auto text-primary" disabled={isLoading}>
          إعادة إرسال
        </Button>
      </p>
    </div>
  );
}
