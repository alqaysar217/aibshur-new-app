import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="relative">
          <Image
            src={imageUrl}
            alt={name}
            width={400}
            height={200}
            className="w-full h-32 object-cover"
            data-ai-hint={imageHint}
          />
          <Badge
            className={`absolute top-2 left-2 ${isOpen ? 'bg-accent text-accent-foreground border-none' : 'bg-destructive text-destructive-foreground border-none'}`}
          >
            {status}
          </Badge>
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 bg-card/80 hover:bg-card h-8 w-8 rounded-full"
            onClick={(e) => {e.preventDefault(); console.log("Favorite clicked");}}
          >
            <Heart className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <CardContent className="p-3">
          <h3 className="font-bold truncate text-base">{name}</h3>
          <p className="text-xs text-muted-foreground truncate">{address}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <Badge variant="outline" className="text-xs">{category}</Badge>
            <span>{distance}</span>
            <div className="flex items-center gap-1">
              <span className="text-amber-500">⭐</span>
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
