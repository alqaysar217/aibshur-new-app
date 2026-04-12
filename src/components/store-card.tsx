'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Star, MapPin } from 'lucide-react';
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
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 p-2">
          {/* Image on the right */}
          <div className="flex-shrink-0">
            <Image
              src={imageUrl}
              alt={name}
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded-md"
              data-ai-hint={imageHint || ''}
            />
          </div>

          {/* Info on the left */}
          <div className="flex-1 flex flex-col justify-between h-20">
            {/* Row 1: Name and Favorite button */}
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-sm truncate pr-2">{name}</h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive active:text-destructive active:scale-95 -mt-0.5 -ml-1"
                onClick={(e) => {e.preventDefault(); console.log("Favorite clicked");}}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            {/* Row 2: Delivery Time & Distance */}
            <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1 truncate">
                    <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">{deliveryTime} دقيقة</span>
                </div>
                 <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">{distance}</span>
                </div>
            </div>

            {/* Row 3: Category, Rating, Status */}
            <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="px-1.5 py-0.5 font-normal text-[10px]">{category}</Badge>
                <div className="flex items-center gap-0.5">
                    <Star className="h-4 w-4 fill-amber-100 text-amber-400" strokeWidth={1.5} />
                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-semibold",
                    isOpen
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  )}
                >
                  {isOpen ? 'مفتوح' : 'مغلق'}
                </Badge>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
