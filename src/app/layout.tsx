'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

// Metadata cannot be exported from a Client Component, so we add it to the <head> manually.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>أبشر</title>
        <meta name="description" content="تطبيق توصيل يمني" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("antialiased")}>
        {isAdminPage ? (
          <>{children}</>
        ) : (
          <div className="mobile-container">
            {children}
          </div>
        )}
        <Toaster />
      </body>
    </html>
  );
}
