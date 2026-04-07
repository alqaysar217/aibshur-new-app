'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bell, Copy, CreditCard, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { OrderStatusBadge, type OrderStatus } from '@/components/order-card';
import { Textarea } from '@/components/ui/textarea';


// MOCK DATA
const orderDetails = {
    id: 'ORD123',
    status: 'on_the_way' as OrderStatus,
    storeName: 'مطعم البيت الصنعاني',
    storeImageId: 'store-yemeni-food',
    timestamp: new Date('2024-07-22T10:00:00Z'),
    products: [
        { id: 'p1', name: 'مندي دجاج', price: 2500, quantity: 2 },
        { id: 'p2', name: 'بيبسي', price: 300, quantity: 2 },
    ],
    subtotal: 5600,
    deliveryFee: 200,
    discount: 0,
    total: 5800,
    paymentMethod: 'bank_transfer', // 'wallet', 'cash_on_delivery'
    bankAccounts: [
        { id: 'bank1', name: 'بنك الكريمي', accountName: 'شركة أبشر للتوصيل', accountNumber: '123456789', logoId: 'bank-krimi' },
        { id: 'bank2', name: 'بنك العمقي', accountName: 'شركة أبشر للتوصيل', accountNumber: '987654321', logoId: 'bank-amqi' },
    ],
    delegate: {
        name: 'أحمد علي',
        rating: 4.9,
        location: { lat: 15.3694, lng: 44.1910 }
    }
};

const storeImage = PlaceHolderImages.find(p => p.id === orderDetails.storeImageId);
const mapImage = PlaceHolderImages.find(p => p.id === 'map-placeholder');
const bankLogos = orderDetails.bankAccounts.map(b => {
    const logo = PlaceHolderImages.find(p => p.id === b.logoId);
    return { ...b, logoUrl: logo?.imageUrl || '', logoHint: logo?.imageHint || '' };
});

export default function OrderDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: `تم نسخ ${label}`,
            description: text,
        });
    };
    
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
    }
    
    const formatDate = (date: Date) => {
         return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        }).format(date);
    }
    
    const isDelivered = orderDetails.status === 'delivered';
    const isPaymentPending = orderDetails.paymentMethod === 'bank_transfer' && !isDelivered;


    return (
    <div className="flex flex-col min-h-screen bg-background pb-4">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orders"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg truncate">تفاصيل الطلب</h1>
           <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/notifications"><Bell className="h-5 w-5" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* General Info */}
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">طلب رقم #{params.id}</span>
                    <OrderStatusBadge status={orderDetails.status} />
                </div>
                <Separator/>
                <div className="flex items-center gap-3">
                    <Image src={storeImage?.imageUrl || ''} alt={orderDetails.storeName} width={48} height={48} className="rounded-md object-cover" data-ai-hint={storeImage?.imageHint || ''} />
                    <div>
                        <p className="font-bold">{orderDetails.storeName}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(orderDetails.timestamp)}{isClient && ` - ${formatTime(orderDetails.timestamp)}`}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Delegate Tracking (if on the way) */}
        {orderDetails.status === 'on_the_way' && mapImage && (
            <Card>
                <CardHeader>
                    <CardTitle>تتبع المندوب</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative h-48 w-full">
                         <Image src={mapImage.imageUrl} alt="Map" fill objectFit='cover' data-ai-hint={mapImage.imageHint} />
                         <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white p-3 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{orderDetails.delegate.name}</p>
                                <p className="text-xs">في الطريق إليك...</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                <span className="font-bold">{orderDetails.delegate.rating}</span>
                            </div>
                         </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Products Table */}
        <Card>
            <CardHeader><CardTitle>المنتجات</CardTitle></CardHeader>
            <CardContent>
                <Table dir="rtl">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">المنتج</TableHead>
                            <TableHead>السعر</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead className="text-left">الإجمالي</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orderDetails.products.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium text-right">{p.name}</TableCell>
                                <TableCell>{p.price.toLocaleString('en-US')}</TableCell>
                                <TableCell>{p.quantity}</TableCell>
                                <TableCell className="text-left">{(p.price * p.quantity).toLocaleString('en-US')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card>
            <CardHeader><CardTitle>ملخص الفاتورة</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-base">
                <div className="flex justify-between"><span>إجمالي المنتجات</span><span>{orderDetails.subtotal.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                <div className="flex justify-between"><span>رسوم التوصيل</span><span>{orderDetails.deliveryFee.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                {orderDetails.discount > 0 && <div className="flex justify-between text-destructive"><span>خصم</span><span>-{orderDetails.discount.toLocaleString('en-US')}&nbsp;ر.ي</span></div>}
                <Separator/>
                <div className="flex justify-between font-bold text-lg"><span>الإجمالي النهائي</span><span>{orderDetails.total.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
            </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
            <CardHeader><CardTitle>طريقة الدفع</CardTitle></CardHeader>
            <CardContent>
                 <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary"/>
                    <span className="font-semibold">
                        {orderDetails.paymentMethod === 'cash_on_delivery' && 'نقدًا عند الاستلام'}
                        {orderDetails.paymentMethod === 'wallet' && 'من المحفظة'}
                        {orderDetails.paymentMethod === 'bank_transfer' && 'تحويل بنكي'}
                    </span>
                 </div>
            </CardContent>
        </Card>

        {/* Bank Accounts (if bank transfer) */}
        {orderDetails.paymentMethod === 'bank_transfer' && (
            <Card>
                <CardHeader><CardTitle>حساباتنا البنكية</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {bankLogos.map(bank => (
                        <div key={bank.id} className="rounded-lg border p-3 space-y-2">
                             <div className="flex items-center gap-3">
                                <Image src={bank.logoUrl} alt={bank.name} width={40} height={40} className="rounded-md" data-ai-hint={bank.logoHint}/>
                                <span className="font-bold">{bank.name}</span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">اسم الحساب</p>
                                <p className="font-semibold">{bank.accountName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">رقم الحساب</p>
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold tracking-wider">{bank.accountNumber}</p>
                                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(bank.accountNumber, 'رقم الحساب')}>
                                        <Copy className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}
        
        {/* Re-Payment Button */}
        {isPaymentPending && (
             <Button className="w-full h-12 text-lg">إتمام الدفع</Button>
        )}


        {/* Rating & Tip (if delivered) */}
        {isDelivered && (
            <>
              <Card>
                <CardHeader><CardTitle>تقييم الطلب</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                     <div className="flex justify-center gap-2" dir="ltr">
                        {[5,4,3,2,1].map(star => <Star key={star} className="h-8 w-8 text-gray-300 cursor-pointer hover:text-amber-400 transition-colors"/>)}
                    </div>
                    <Textarea placeholder="أخبرنا عن رأيك في التجربة..."/>
                    <Button className="w-full">إرسال التقييم</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>إكرامية للمندوب</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                        {[100, 200, 500].map(tip => <Button variant="outline" key={tip}>{tip}&nbsp;ر.ي</Button>)}
                        <Button variant="outline">مخصص</Button>
                    </div>
                    <Button className="w-full">إرسال الإكرامية</Button>
                </CardContent>
              </Card>
            </>
        )}


      </main>
    </div>
  );
}
