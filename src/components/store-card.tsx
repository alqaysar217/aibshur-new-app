'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, MapPin, Navigation } from 'lucide-react';
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
  workingHours: any[];
  isFavorite: boolean;
  onToggleFavorite: (storeId: string) => void;
};

export function StoreCard({ id, name, imageUrl, imageHint, address, deliveryTime, distance, category, rating, workingHours, isFavorite, onToggleFavorite }: StoreCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!workingHours) {
      setIsOpen(false);
      return;
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[new Date().getDay()];
    const todayWorkingHours = workingHours.find((wh: any) => wh.day === todayName);

    if (!todayWorkingHours || !todayWorkingHours.isOpen) {
      setIsOpen(false);
      return;
    }

    const now = new Date();
    const currentTime = now.getHours() + now.getMinutes() / 60;

    const parseTime = (timeStr: string | undefined): number => {
      if (!timeStr || !timeStr.includes(':')) return NaN;
      const [hour, minute] = timeStr.split(':').map(Number);
      return isNaN(hour) || isNaN(minute) ? NaN : hour + minute / 60;
    };

    const morningStart = parseTime(todayWorkingHours.morning_from);
    const morningEnd = parseTime(todayWorkingHours.morning_to);
    const eveningStart = parseTime(todayWorkingHours.evening_from);
    const eveningEnd = parseTime(todayWorkingHours.evening_to);

    const isCurrentlyInMorning = !isNaN(morningStart) && !isNaN(morningEnd) && currentTime >= morningStart && currentTime < morningEnd;
    const isCurrentlyInEvening = !isNaN(eveningStart) && !isNaN(eveningEnd) && currentTime >= eveningStart && currentTime < eveningEnd;
    
    setIsOpen(isCurrentlyInMorning || isCurrentlyInEvening);

  }, [workingHours]);


  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(id);
  };

  return (
    <Link href={`/store/${id}`} className="block group">
      <Card className="shadow-sm hover:shadow-md transition-shadow bg-card">
        <CardContent className="p-2 flex gap-3">
          <div className="relative w-[70px] h-[70px] flex-shrink-0">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={imageHint || ''}
            />
             <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-black/10 group-hover:ring-primary/50 transition-shadow"></div>
          </div>
          <div className="flex-1 flex flex-col justify-between gap-1">
            {/* Row 1 */}
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base truncate pr-2">{name}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-primary/60 hover:text-primary active:scale-95 -mt-1 -mr-2"
                onClick={handleFavoriteClick}
              >
                <Heart className={cn("h-5 w-5 stroke-primary transition-colors", isFavorite ? "text-red-500 fill-red-500 stroke-red-500" : "fill-transparent" )} />
              </Button>
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">{address}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span>{distance}</span>
                </div>
            </div>
            {/* Row 3 */}
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{category}</Badge>
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
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
