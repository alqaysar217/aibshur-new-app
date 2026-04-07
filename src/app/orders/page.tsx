'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, ShoppingCart, List, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderCard, type Order } from '@/components/order-card';
import { BottomNav } from '@/components/bottom-nav';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// MOCK DATA
const now = new Date('2024-07-22T12:00:00Z');
const ordersData: Omit<Order, 'storeImage' | 'storeImageHint'>[] = [
  // Current Orders
  { id: 'ORD123', storeName: 'مطعم البيت الصنعاني', orderNumber: '#123', status: 'on_the_way', timestamp: new Date('2024-07-22T11:45:00Z'), total: 5800, storeImageId: 'store-yemeni-food' },
  { id: 'ORD124', storeName: 'كافيتيريا مزاج', orderNumber: '#124', status: 'preparing', timestamp: new Date('2024-07-22T11:25:00Z'), total: 2200, storeImageId: 'store-cafe' },
  { id: 'ORD125', storeName: 'سوبر ماركت العالمية', orderNumber: '#125', status: 'accepted', timestamp: new Date('2024-07-22T11:05:00Z'), total: 9500, storeImageId: 'store-supermarket' },
  { id: 'ORD126', storeName: 'صيدلية الشفاء', orderNumber: '#126', status: 'pending', timestamp: new Date('2024-07-22T10:00:00Z'), total: 3400, storeImageId: 'store-pharmacy' },
  // Previous Orders
  { id: 'ORD101', storeName: 'مطعم البيت الصنعاني', orderNumber: '#101', status: 'delivered', timestamp: new Date('2024-07-20T14:30:00Z'), total: 6200, storeImageId: 'store-yemeni-food' },
  // Cancelled Orders
  { id: 'ORD102', storeName: 'كافيتيريا مزاج', orderNumber: '#102', status: 'cancelled', timestamp: new Date('2024-07-19T18:00:00Z'), total: 1800, storeImageId: 'store-cafe' },
];

const orders: Order[] = ordersData.map(order => {
  const imageData = PlaceHolderImages.find(p => p.id === order.storeImageId);
  return {
    ...order,
    storeImage: imageData?.imageUrl || '',
    storeImageHint: imageData?.imageHint || '',
  };
});

const currentOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'on_the_way'].includes(o.status));
const completedOrders = orders.filter(o => o.status === 'delivered');
const cancelledOrders = orders.filter(o => o.status === 'cancelled');

export default function OrdersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">طلباتي</h1>
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
      
      <main className="flex-1">
        <Tabs defaultValue="current" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 sticky top-16 z-10 rounded-none px-0">
            <TabsTrigger value="current" className="gap-2 h-full">
              <List className="h-5 w-5"/>
              الحالية
            </TabsTrigger>
            <TabsTrigger value="previous" className="gap-2 h-full">
              <CheckCircle className="h-5 w-5"/>
              السابقة
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2 h-full">
              <XCircle className="h-5 w-5"/>
              الملغية
            </TabsTrigger>
          </TabsList>
          
          <div className="p-4 space-y-4">
            <TabsContent value="current">
              {currentOrders.length > 0 ? (
                  <div className="space-y-3">
                      {currentOrders.map(order => <OrderCard key={order.id} order={order} />)}
                  </div>
              ) : (
                  <div className="text-center py-16">
                      <p className="text-muted-foreground">لا توجد طلبات حالية.</p>
                  </div>
              )}
            </TabsContent>

            <TabsContent value="previous">
            {completedOrders.length > 0 ? (
                    <div className="space-y-3">
                        {completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">لا توجد طلبات مكتملة بعد.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="cancelled">
            {cancelledOrders.length > 0 ? (
                    <div className="space-y-3">
                        {cancelledOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">لا توجد طلبات ملغاة.</p>
                    </div>
                )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}
