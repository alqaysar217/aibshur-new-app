'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StoreCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  imageHint?: string;
  deliveryTime: string;
  distance: string;
  category: string;
  rating: number;
  isActive: boolean;
};

export function StoreCard({ id, name, imageUrl, imageHint, deliveryTime, distance, category, rating, isActive }: StoreCardProps) {
  const isOpen = isActive;

  return (
    <Link href={`/store/${id}`} className="block">
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3 flex gap-3">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover rounded-md"
              data-ai-hint={imageHint || ''}
            />
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-base truncate pr-2">{name}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive active:text-destructive active:scale-95 -mt-1 -mr-2"
                  onClick={(e) => {e.preventDefault(); console.log("Favorite clicked");}}
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm mt-1 text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-100 text-amber-400" strokeWidth={1.5} />
                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{category}</span>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{deliveryTime} دق</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-xs font-semibold",
                  isOpen
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
              >
                {isOpen ? 'مفتوح' : 'مغلق'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
