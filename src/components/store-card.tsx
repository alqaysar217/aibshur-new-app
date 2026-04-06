'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Route, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StoreCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  imageHint: string;
  address: string;
  distance: string;
  category: string;
  rating: number;
  status: 'مفتوح' | 'مغلق';
};

export function StoreCard({ id, name, imageUrl, imageHint, address, distance, category, rating, status }: StoreCardProps) {
  const isOpen = status === 'مفتوح';

  return (
    <Link href={`/store/${id}`} className="block">
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 p-2">
          {/* Image on the right */}
          <div className="flex-shrink-0">
            <Image
              src={imageUrl}
              alt={name}
              width={100}
              height={100}
              className="w-24 h-24 object-cover rounded-md"
              data-ai-hint={imageHint}
            />
          </div>

          {/* Info on the left */}
          <div className="flex-1 flex flex-col justify-between h-24 py-1">
            {/* Row 1: Name and Favorite button */}
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base truncate pr-2">{name}</h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive active:text-destructive active:scale-95 -mt-1 -ml-1"
                onClick={(e) => {e.preventDefault(); console.log("Favorite clicked");}}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Row 2: Address and Distance */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{address}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                    <Route className="h-3.5 w-3.5" />
                    <span className="font-medium">{distance}</span>
                </div>
            </div>

            {/* Row 3: Category, Rating, Status */}
            <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="px-2 py-0.5 font-normal">{category}</Badge>
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 font-semibold",
                    isOpen ? "text-primary" : "text-destructive"
                    )}>
                    <div className={cn("h-2 w-2 rounded-full", isOpen ? "bg-primary" : "bg-destructive")}></div>
                    <span>{status}</span>
                </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
