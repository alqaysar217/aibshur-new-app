import { type ElementType } from 'react';
import { ShoppingBag, Tag, Info } from 'lucide-react';

export type NotificationType = 'order_status' | 'promotion' | 'system';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
};

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'order_status',
    title: 'طلبك في الطريق!',
    body: 'مندوبنا أحمد في طريقه إليك لتسليم طلب #ORD123.',
    timestamp: new Date(new Date().getTime() - 5 * 60 * 1000), // 5 minutes ago
    isRead: false,
    link: '/orders/ORD123',
  },
  {
    id: 'n2',
    type: 'promotion',
    title: 'خصم 50% على مطعم البيت الصنعاني',
    body: 'استمتع بخصم كبير على وجباتك المفضلة. لا تفوت الفرصة!',
    timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    link: '/store/1',
  },
  {
    id: 'n3',
    type: 'system',
    title: 'تحديث جديد للتطبيق',
    body: 'لقد قمنا بتحسينات وإضافة مزايا جديدة. قم بالتحديث الآن.',
    timestamp: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
  },
    {
    id: 'n4',
    type: 'order_status',
    title: 'تم توصيل طلبك',
    body: 'تم توصيل طلبك #ORD101 بنجاح. نتمنى لك وجبة شهية!',
    timestamp: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    link: '/orders/ORD101',
  },
  {
    id: 'n5',
    type: 'promotion',
    title: 'عروض نهاية الأسبوع',
    body: 'توصيل مجاني على جميع الطلبات فوق 10,000 ريال.',
    timestamp: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
    link: '/',
  },
];

export const notificationTypeInfo: Record<NotificationType, { icon: ElementType, text: string }> = {
    order_status: { icon: ShoppingBag, text: 'الطلبات' },
    promotion: { icon: Tag, text: 'العروض' },
    system: { icon: Info, text: 'النظام' },
};
