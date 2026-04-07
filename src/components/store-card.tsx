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
        <div className="flex items-center gap-2 p-2">
          {/* Image on the right */}
          <div className="flex-shrink-0">
            <Image
              src={imageUrl}
              alt={name}
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded-md"
              data-ai-hint={imageHint}
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

            {/* Row 2: Address and Distance */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{address}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 pl-1">
                    <Route className="h-4 w-4" />
                    <span className="font-medium">{distance}</span>
                </div>
            </div>

            {/* Row 3: Category, Rating, Status */}
            <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="px-1.5 py-0.5 font-normal text-[10px]">{category}</Badge>
                <div className="flex items-center gap-0.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                </div>
                <div className={cn(
                    "flex items-center gap-1 font-semibold",
                    isOpen ? "text-primary" : "text-destructive"
                    )}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-primary" : "bg-destructive")}></div>
                    <span>{status}</span>
                </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
