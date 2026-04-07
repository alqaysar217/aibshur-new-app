'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, CookingPot, Bike, Check, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  storeName: string;
  storeImage: string;
  storeImageHint: string;
  storeImageId?: string;
  orderNumber: string;
  status: OrderStatus;
  timestamp: Date;
  total: number;
};

const statusInfo: Record<OrderStatus, { text: string; icon: React.ElementType; color: string }> = {
    pending: { text: 'قيد الانتظار', icon: Hourglass, color: 'bg-yellow-500' },
    accepted: { text: 'تم القبول', icon: Check, color: 'bg-blue-500' },
    preparing: { text: 'جاري التحضير', icon: CookingPot, color: 'bg-orange-500' },
    on_the_way: { text: 'في الطريق', icon: Bike, color: 'bg-indigo-500' },
    delivered: { text: 'تم التسليم', icon: CheckCircle, color: 'bg-green-500' },
    cancelled: { text: 'ملغي', icon: XCircle, color: 'bg-red-500' },
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { text, icon: Icon, color } = statusInfo[status];
  return (
    <Badge className={cn("flex items-center gap-1.5 border-none text-white", color, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{text}</span>
    </Badge>
  );
}


type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  const getFormattedTime = (date: Date) => {
      // On the server, or on the initial client render, always render the full date.
      if (!isClient || !isToday(date)) {
          return new Intl.DateTimeFormat('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          }).format(date);
      }
      // Only render relative time on the client after hydration.
      return formatRelativeTime(date);
  }

  return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-3">
            {/* Top Section */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2">
                    <Image
                        src={order.storeImage}
                        alt={order.storeName}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded-md border"
                        data-ai-hint={order.storeImageHint}
                    />
                    <div>
                        <h3 className="font-bold text-sm">{order.storeName}</h3>
                        <p className="text-xs text-muted-foreground">طلب رقم {order.orderNumber}</p>
                    </div>
                </div>
                <OrderStatusBadge status={order.status} />
            </div>

            {/* Middle Section */}
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getFormattedTime(order.timestamp)}</span>
                </div>
                <div className="font-bold">
                    {order.total.toLocaleString('ar-SA')}&nbsp;ر.ي
                </div>
            </div>

            {/* Bottom Section */}
            <Button asChild className="w-full" variant="outline">
                <Link href={`/orders/${order.id}`}>عرض التفاصيل</Link>
            </Button>
        </CardContent>
      </Card>
  );
}
