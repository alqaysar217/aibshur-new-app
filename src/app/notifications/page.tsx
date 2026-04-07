'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, ShoppingBag, Tag, Info, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCard, NotificationSkeleton } from '@/components/notification-card';
import { type Notification, type NotificationType, mockNotifications } from '@/lib/notifications';
import { BottomNav } from '@/components/bottom-nav';

const filters: { id: NotificationType | 'all'; text: string; icon: React.ElementType }[] = [
  { id: 'all', text: 'الكل', icon: Bell },
  { id: 'order_status', text: 'الطلبات', icon: ShoppingBag },
  { id: 'promotion', text: 'العروض', icon: Tag },
  { id: 'system', text: 'النظام', icon: Info },
];

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);
  
  const handleNotificationClick = (notification: Notification) => {
    // In a real app, you'd update this in your backend
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
  };

  const filteredNotifications = notifications.filter(
    n => activeFilter === 'all' || n.type === activeFilter
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">الإشعارات</h1>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Filter Bar */}
        <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-3 border-b">
            <div className="overflow-x-auto px-4 no-scrollbar">
                <div className="flex gap-2" dir="rtl">
                    {filters.map((filter) => (
                        <Button
                            key={filter.id}
                            variant={activeFilter === filter.id ? 'default' : 'outline'}
                            className="rounded-full whitespace-nowrap shadow-sm"
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            <filter.icon />
                            {filter.text}
                        </Button>
                    ))}
                </div>
            </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-2">
          {loading ? (
            <>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationCard 
                key={notification.id} 
                notification={notification}
                onNotificationClick={handleNotificationClick}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 text-muted-foreground/70">
                <Bell className="h-20 w-20 mb-4" />
                <h2 className="text-lg font-semibold">لا توجد تنبيهات حالياً</h2>
                <p className="text-sm">سيتم عرض الإشعارات الجديدة هنا.</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
