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
      <CardContent className="p-2 flex gap-3 items-start">
         <div className="relative w-20 h-20 flex-shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-md"
            data-ai-hint={product.imageHint}
          />
        </div>
        <div className="flex-1 flex flex-col justify-between h-20">
          <div>
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm leading-tight pr-2 line-clamp-1">{product.name}</h3>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground flex-shrink-0 -mt-1 -mr-2" onClick={(e) => { e.stopPropagation(); console.log('Favorite clicked'); }}>
                <Heart className="h-5 w-5" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {product.description}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                 <p className="text-sm font-bold text-primary">{product.price.toLocaleString('en-US')}&nbsp;ر.ي</p>
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span className="font-semibold text-xs text-foreground">{product.rating.toFixed(1)}</span>
                </div>
            </div>
            <div className="flex-shrink-0">
                {product.hasVariants ? (
                <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={(e) => {e.stopPropagation(); handleShowDetails();}}>
                    التفاصيل
                </Button>
                ) : quantity > 0 ? (
                    <QuantityCounter 
                        value={quantity} 
                        onIncrement={handleIncrement} 
                        onDecrement={handleDecrement} 
                    />
                ) : (
                <Button size="sm" className="h-8 text-xs px-3" onClick={handleAddToCart}>
                    <Plus className="h-4 w-4" />
                    إضافة
                </Button>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
