'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, X } from 'lucide-react';
import type { Product } from './product-card';
import { QuantityCounter } from './quantity-counter';

type ProductDetailsSheetProps = {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// Mock data for variants
const variants = [
    { id: 'v1', name: 'صغير', price: 3000 },
    { id: 'v2', name: 'وسط', price: 4000 },
    { id: 'v3', name: 'كبير', price: 5000 },
];

export function ProductDetailsSheet({ product, isOpen, onOpenChange }: ProductDetailsSheetProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
        setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 flex flex-col" side="bottom">
        <div className="relative h-48 w-full">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint={product.imageHint}
            />
             <Button size="icon" variant="ghost" className="absolute top-3 right-3 bg-card/50 hover:bg-card/80 rounded-full h-8 w-8" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5 text-white" />
             </Button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
            <SheetHeader className="text-right mb-4">
                <SheetTitle className="text-2xl">{product.name}</SheetTitle>
                <SheetDescription>{product.description}</SheetDescription>
            </SheetHeader>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-bold text-lg text-foreground">{product.rating.toFixed(1)}</span>
                </div>
                {!product.hasVariants && (
                    <p className="text-2xl font-bold text-primary">{product.price.toLocaleString()} ر.ي</p>
                )}
            </div>

            {product.hasVariants && (
                <div className="space-y-3">
                    <h4 className="font-bold">اختر الحجم:</h4>
                    {variants.map(variant => (
                        <Card key={variant.id} className='p-3'>
                            <div className='flex justify-between items-center'>
                                <div>
                                    <p className='font-semibold'>{variant.name}</p>
                                    <p className='text-muted-foreground font-bold'>{variant.price.toLocaleString()} ر.ي</p>
                                </div>
                                <Button size="sm">إضافة</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
        
        {!product.hasVariants && (
            <div className="p-4 border-t flex items-center justify-between gap-4 bg-card">
                 <QuantityCounter 
                    value={quantity} 
                    onIncrement={(e) => { e.stopPropagation(); setQuantity(q => q + 1); }} 
                    onDecrement={(e) => { e.stopPropagation(); setQuantity(q => (q > 1 ? q - 1 : 1)); }}
                />
                <Button className="flex-1 h-12 text-lg">
                    إضافة إلى السلة
                </Button>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
