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
        <div className="flex items-center gap-4 p-3">
          {/* Circular Image on the right */}
          <div className="flex-shrink-0">
            <Image
              src={imageUrl}
              alt={name}
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded-full border-2 border-primary/10"
              data-ai-hint={imageHint || ''}
            />
          </div>

          {/* Info on the left */}
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Row 1: Name and Favorite button */}
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

            {/* Row 2: Distance */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>{distance}</span>
            </div>
            
            {/* Row 3: Category & Rating */}
             <div className="flex items-center justify-between text-sm">
                <Badge variant="outline" className="font-normal">{category}</Badge>
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-100 text-amber-400" strokeWidth={1.5} />
                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                </div>
            </div>

            {/* Row 4: Delivery Time & Status */}
            <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">{deliveryTime} دق</span>
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
        </div>
      </Card>
    </Link>
  );
}
