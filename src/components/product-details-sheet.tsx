'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, CircleDollarSign, Layers } from 'lucide-react';
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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);


  const productVariants = variants.map(v => {
    const imageData = PlaceHolderImages.find(img => img.id === v.imageId);
    return { ...v, imageUrl: imageData?.imageUrl || '', imageHint: imageData?.imageHint || '' };
  });

  useEffect(() => {
    if (isOpen) {
        setQuantity(1);
        setSelectedVariant(null);
    }
  }, [isOpen]);

  if (!product) return null;

  const handleAddToCart = () => {
    // Logic to add to cart
    console.log(`Added ${quantity} of ${product.name} to cart.`);
    onOpenChange(false);
  }
  
  const handleVariantAddToCart = (variantId: string) => {
      const variant = productVariants.find(v => v.id === variantId);
      console.log(`Added 1 of ${product.name} (${variant?.name}) to cart.`);
      // Potentially close sheet or show added confirmation
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        dir="rtl" 
        className="p-0 flex flex-col max-h-[90dvh] overflow-hidden bg-background border-t-0 shadow-2xl mx-auto w-full max-w-md rounded-t-2xl"
      >
        <div className="relative h-48 w-full">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover rounded-t-2xl"
                data-ai-hint={product.imageHint}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-2xl"></div>
              <SheetClose className="absolute top-4 left-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary bg-white/50 hover:bg-white/75 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                <span className="sr-only">Close</span>
            </SheetClose>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
            <SheetHeader className="mb-4 text-right">
                <SheetTitle className="text-right text-2xl font-bold text-foreground">{product.name}</SheetTitle>
                <SheetDescription className="text-right text-base text-muted-foreground">{product.description}</SheetDescription>
            </SheetHeader>
            
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 fill-amber-100 text-amber-400" strokeWidth={1.5} />
                    <span className="font-bold text-lg text-foreground">{product.rating.toFixed(1)}</span>
                </div>

                {!product.hasVariants && (
                    <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <CircleDollarSign className="h-6 w-6" />
                        <span>{formatPrice(product.price)}&nbsp;ر.ي</span>
                    </div>
                )}
            </div>

            {product.hasVariants && (
                <div className="space-y-3">
                    <h4 className="text-right font-bold flex items-center justify-start gap-2 text-lg">
                        <Layers className="h-5 w-5" />
                        <span>اختر الحجم:</span>
                    </h4>
                     {productVariants.map(variant => (
                        <Card key={variant.id} className='p-3 shadow-sm border-border/80'>
                            <div className='flex justify-between items-center gap-4'>
                                 <Button size="sm" className="h-9 px-4 text-sm flex-shrink-0" onClick={() => handleVariantAddToCart(variant.id)}>إضافة</Button>
                                <div className='text-right flex-1'>
                                    <p className='font-semibold text-base'>{variant.name}</p>
                                    <div className='flex items-center justify-end gap-1.5 font-bold text-primary'>
                                        <CircleDollarSign className="h-4 w-4" />
                                        <span>{formatPrice(variant.price)}&nbsp;ر.ي</span>
                                    </div>
                                </div>
                                <Image src={variant.imageUrl} alt={variant.name} width={60} height={60} className="rounded-md object-cover" data-ai-hint={variant.imageHint} />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
        
        {!product.hasVariants && (
            <div className="p-4 border-t flex items-center justify-between gap-4 bg-background/95 backdrop-blur-sm sticky bottom-0">
                 <Button className="flex-1 h-12 text-lg font-semibold" onClick={handleAddToCart}>
                    إضافة إلى السلة
                </Button>
                <QuantityCounter 
                    value={quantity} 
                    onIncrement={(e) => { e.stopPropagation(); setQuantity(q => q + 1); }} 
                    onDecrement={(e) => { e.stopPropagation(); setQuantity(q => (q > 1 ? q - 1 : 1)); }}
                />
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
