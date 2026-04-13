'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { QuantityCounter } from './quantity-counter';
import { cn } from '@/lib/utils';


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
  isFavorite?: boolean;
};

type ProductCardProps = {
  product: Product;
  onShowDetails: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
};

export function ProductCard({ product, onShowDetails, onToggleFavorite }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={handleShowDetails}>
      <CardContent className="p-2 flex gap-3 items-start">
         <div className="relative w-20 h-20 flex-shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.imageHint}
          />
           <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-black/10 group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-300"></div>
        </div>
        <div className="flex-1 flex flex-col justify-between self-stretch">
          {/* Row 1 */}
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-base leading-tight pr-2 line-clamp-1 text-primary">{product.name}</h3>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary flex-shrink-0 -mt-1 -mr-2" onClick={handleFavoriteClick}>
              <Heart className={cn("h-5 w-5", product.isFavorite && "text-primary fill-primary")} />
            </Button>
          </div>
          {/* Row 2 */}
          <p className="text-xs text-muted-foreground my-1 line-clamp-2">
            {product.description}
          </p>
          {/* Row 3 */}
          <div className="flex justify-between items-center mt-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="font-bold text-sm text-foreground">{product.rating.toFixed(1)}</span>
              </div>
              <p className="text-base font-bold text-primary">{product.price.toLocaleString('en-US')}&nbsp;ريال</p>
            </div>
            <div className="flex-shrink-0">
                {product.hasVariants ? (
                  <Button size="sm" className="h-9 px-3 text-xs bg-sidebar-active-gradient text-sidebar-primary-foreground" onClick={(e) => {e.stopPropagation(); handleShowDetails();}}>
                      عرض التفاصيل
                  </Button>
                ) : quantity > 0 ? (
                    <QuantityCounter 
                        value={quantity} 
                        onIncrement={handleIncrement} 
                        onDecrement={handleDecrement} 
                    />
                ) : (
                  <Button size="sm" className="h-9 px-3 text-xs bg-sidebar-active-gradient text-sidebar-primary-foreground" onClick={handleAddToCart}>
                    <ShoppingCart className="h-4 w-4 text-primary-foreground" />
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
