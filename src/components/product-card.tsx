'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Star, Plus } from 'lucide-react';
import { QuantityCounter } from './quantity-counter';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  imageUrl: string;
  imageHint: string;
  hasVariants: boolean;
  imageId?: string;
};

type ProductCardProps = {
  product: Product;
  onShowDetails: (product: Product) => void;
};

export function ProductCard({ product, onShowDetails }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening details sheet
    setQuantity(1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => (prev > 0 ? prev - 1 : 0));
  };
  
  const handleShowDetails = () => {
    onShowDetails(product);
  }

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={handleShowDetails}>
      <CardContent className="p-3 flex gap-4 items-center">
         <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-md"
            data-ai-hint={product.imageHint}
          />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-base leading-tight pr-2">{product.name}</h3>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground flex-shrink-0 -mt-1 -ml-2" onClick={(e) => { e.stopPropagation(); console.log('Favorite clicked'); }}>
              <Heart className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 h-8">
            {product.description}
          </p>
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1 items-start">
                <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold text-sm text-foreground">{product.rating.toFixed(1)}</span>
                </div>
                <p className="text-base font-bold text-primary">{product.price.toLocaleString()}&nbsp;ر.ي</p>
            </div>
            {product.hasVariants ? (
              <Button variant="outline" size="sm" className="h-9 self-end" onClick={(e) => {e.stopPropagation(); handleShowDetails();}}>
                عرض التفاصيل
              </Button>
            ) : quantity > 0 ? (
                <QuantityCounter 
                    value={quantity} 
                    onIncrement={handleIncrement} 
                    onDecrement={handleDecrement} 
                />
            ) : (
              <Button size="sm" className="h-9 self-end" onClick={handleAddToCart}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
