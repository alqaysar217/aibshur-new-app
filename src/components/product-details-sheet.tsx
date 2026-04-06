'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, CircleDollarSign, Layers, X } from 'lucide-react';
import type { Product } from './product-card';
import { QuantityCounter } from './quantity-counter';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type ProductDetailsSheetProps = {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// Mock data for variants
const variants = [
    { id: 'v1', name: 'صغير', price: 3000, imageId: 'product-variant-small' },
    { id: 'v2', name: 'وسط', price: 4000, imageId: 'product-variant-medium' },
    { id: 'v3', name: 'كبير', price: 5000, imageId: 'product-variant-large' },
];

export function ProductDetailsSheet({ product, isOpen, onOpenChange }: ProductDetailsSheetProps) {
  const [quantity, setQuantity] = useState(1);

  const productVariants = variants.map(v => {
    const imageData = PlaceHolderImages.find(img => img.id === v.imageId);
    return { ...v, imageUrl: imageData?.imageUrl || '', imageHint: imageData?.imageHint || '' };
  });

  useEffect(() => {
    if (isOpen) {
        setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 flex flex-col max-h-[90dvh] overflow-hidden bg-card border-none shadow-2xl m-2 rounded-t-lg" style={{borderRadius: "10px"}}>
        <SheetClose className="absolute right-4 top-4 z-20 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary bg-white/70 text-black">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </SheetClose>
        <div className="relative h-48 w-full">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint={product.imageHint}
            />
        </div>
        <div className="p-4 flex-1 overflow-y-auto" dir="rtl">
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
                    <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <span>{product.price.toLocaleString('ar-SA')}&nbsp;ر.ي</span>
                        <CircleDollarSign className="h-6 w-6" />
                    </div>
                )}
            </div>

            {product.hasVariants && (
                <div className="space-y-3">
                    <h4 className="font-bold text-right flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        اختر الحجم:
                    </h4>
                    {productVariants.map(variant => (
                        <Card key={variant.id} className='p-2'>
                            <div className='flex justify-between items-center gap-3'>
                                <Image src={variant.imageUrl} alt={variant.name} width={64} height={64} className="rounded-md object-cover" data-ai-hint={variant.imageHint} />
                                <div className='flex-1 text-right'>
                                    <p className='font-semibold'>{variant.name}</p>
                                    <div className='flex items-center gap-1 text-muted-foreground font-bold justify-start'>
                                        <span>{variant.price.toLocaleString('ar-SA')}&nbsp;ر.ي</span>
                                        <CircleDollarSign className="h-4 w-4" />
                                    </div>
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
