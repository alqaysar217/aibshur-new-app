'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { type Notification, notificationTypeInfo } from '@/lib/notifications';

type NotificationCardProps = {
  notification: Notification;
  onNotificationClick: (notification: Notification) => void;
};

export function NotificationCard({ notification, onNotificationClick }: NotificationCardProps) {
  const { type, title, body, timestamp, isRead, link } = notification;

  const Icon = notificationTypeInfo[type].icon;

  const relativeTime = formatDistanceToNow(timestamp, {
    addSuffix: true,
    locale: ar,
  });

  const content = (
    <Card
      className={cn(
        'transition-all duration-300 cursor-pointer hover:shadow-md',
        isRead ? 'bg-transparent shadow-none border-transparent hover:bg-secondary/50' : 'bg-card shadow-sm border'
      )}
      onClick={() => onNotificationClick(notification)}
    >
      <div className="p-3 flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
            'relative p-2.5 rounded-lg flex-shrink-0',
            isRead ? 'bg-muted' : 'bg-primary/10'
        )}>
          <Icon className={cn('h-6 w-6', isRead ? 'text-muted-foreground' : 'text-primary')} />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex justify-between items-start">
             <h3 className={cn(
                'text-sm truncate pr-2',
                isRead ? 'font-medium' : 'font-bold'
             )}>
                {title}
            </h3>
            {!isRead && <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></div>}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{body}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
            <Clock className="h-4 w-4" />
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  if (link) {
      return (
          <Link href={link} className="block" onClick={(e) => e.stopPropagation()}>
              {content}
          </Link>
      );
  }

  return content;
}

// Skeleton loader for notification card
export function NotificationSkeleton() {
    return (
        <div className="p-3 flex items-start gap-4 animate-pulse">
            <div className="p-2.5 rounded-lg bg-muted h-11 w-11 flex-shrink-0"></div>
            <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
        </div>
    )
}
