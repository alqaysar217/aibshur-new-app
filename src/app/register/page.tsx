import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">إنشاء حساب</h1>
      <p className="text-muted-foreground mb-8">
        هذه الصفحة هي عنصر نائب لعملية التسجيل.
      </p>
      <Button asChild>
        <Link href="/login">
          العودة إلى تسجيل الدخول
        </Link>
      </Button>
    </div>
  );
}
