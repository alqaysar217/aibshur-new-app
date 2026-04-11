'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Check, CookingPot, Bike, CheckCircle, XCircle } from 'lucide-react';
import type { ElementType } from 'react';

export type OrderStatus = 'incoming' | 'confirmed' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';

const statusInfo: Record<OrderStatus, { text: string; icon: ElementType; color: string; }> = {
    incoming: { text: 'طلب وارد', icon: Clock, color: 'text-amber-600' },
    confirmed: { text: 'مؤكد', icon: Check, color: 'text-sky-600' },
    preparing: { text: 'جاري التجهيز', icon: CookingPot, color: 'text-orange-600' },
    dispatched: { text: 'مع المندوب', icon: Bike, color: 'text-indigo-600' },
    delivered: { text: 'مكتمل', icon: CheckCircle, color: 'text-green-600' },
    cancelled: { text: 'ملغي', icon: XCircle, color: 'text-red-600' },
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
    const info = statusInfo[status];
    if (!info) {
        return <Badge variant="outline">{status}</Badge>;
    }
    const { text, icon: Icon, color } = info;
    return <Badge variant="outline" className={`gap-1.5 border-current ${color}`}><Icon className="h-3.5 w-3.5"/>{text}</Badge>;
};
