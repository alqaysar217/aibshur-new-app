'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, MapPin } from 'lucide-react';
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
    <Link href={`/store/${id}`} className="block group">
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
        <CardContent className="p-3 flex gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={imageHint || ''}
            />
            <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-black/10 group-hover:ring-primary/50 transition-shadow"></div>
          </div>
          <div className="flex-1 flex flex-col justify-between gap-1 py-1">
            {/* Row 1 */}
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base truncate">{name}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-primary/60 hover:text-primary active:scale-95 -mt-1 -mr-2"
                onClick={(e) => {e.preventDefault(); console.log("Favorite clicked");}}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">{address}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{distance}</span>
                </div>
            </div>
            {/* Row 3 */}
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{category}</Badge>
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                    </div>
                </div>
                <Badge
                    variant={isOpen ? 'default' : 'destructive'}
                    className="px-2.5 py-1 text-xs font-bold"
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
