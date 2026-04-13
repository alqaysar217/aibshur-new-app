'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StoreCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  imageHint?: string;
  address: string;
  deliveryTime: string;
  distance: string;
  category: string;
  rating: number;
  isActive: boolean;
};

export function StoreCard({ id, name, imageUrl, imageHint, address, deliveryTime, distance, category, rating, isActive }: StoreCardProps) {
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
          <div className="flex-1 flex flex-col justify-center gap-1">
            {/* Row 1 */}
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base truncate">{name}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive active:text-destructive active:scale-95 -mt-1 -mr-2"
                onClick={(e) => {e.preventDefault(); console.log("Favorite clicked");}}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span className="truncate">{address}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{distance}</span>
              </div>
            </div>
            {/* Row 3 */}
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <span>{category}</span>
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "px-2 py-0.5 text-xs font-semibold",
                        isOpen
                        ? "border-primary text-primary"
                        : "border-destructive text-destructive"
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
