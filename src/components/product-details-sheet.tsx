'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, Layers, ShoppingCart, Store, Tag, Heart } from 'lucide-react';
import type { Product } from './product-card';
import { QuantityCounter } from './quantity-counter';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type ProductDetailsSheetProps = {
  product: Product | null;
  storeName?: string;
  categoryName?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// Mock data for variants
const variants = [
    { id: 'v1', name: 'صغير', price: 3000, imageId: 'product-variant-small' },
    { id: 'v2', name: 'وسط', price: 4000, imageId: 'product-variant-medium' },
    { id: 'v3', name: 'كبير', price: 5000, imageId: 'product-variant-large' },
];

export function ProductDetailsSheet({ product, storeName, categoryName, isOpen, onOpenChange }: ProductDetailsSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

  const productVariants = variants.map(v => {
    const imageData = PlaceHolderImages.find(img => img.id === v.imageId);
    return { ...v, imageUrl: imageData?.imageUrl || '', imageHint: imageData?.imageHint || '' };
  });

  useEffect(() => {
    if (isOpen) {
        setQuantity(1);
        setVariantQuantities({});
    }
  }, [isOpen]);

  if (!product) return null;

  const handleConfirmAddToCart = () => {
    console.log(`Confirmed adding ${quantity} of ${product.name} to cart.`);
    onOpenChange(false);
  }

  const handleVariantQuantityChange = (variantId: string, newQuantity: number) => {
    setVariantQuantities(prev => ({...prev, [variantId]: Math.max(0, newQuantity)}));
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 flex flex-col max-h-[90dvh] w-full max-w-sm rounded-2xl gap-0 [&>button]:top-2 [&>button]:bg-black/20 [&>button]:text-white hover:[&>button]:bg-black/40"
      >
        <Button variant="ghost" size="icon" className="absolute right-4 top-3 z-10 h-9 w-9 text-white bg-black/20 hover:bg-black/40">
            <Heart className="h-5 w-5" />
        </Button>
        <div className="relative h-48 w-full">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover rounded-t-2xl"
                data-ai-hint={product.imageHint}
            />
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <DialogHeader className="text-right space-y-2">
                 <div className='flex justify-between items-start'>
                    <div>
                        <DialogTitle className="text-right text-2xl font-bold text-primary">{product.name}</DialogTitle>
                        <DialogDescription className="text-right text-base text-muted-foreground pt-1">{product.description}</DialogDescription>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
                        <Star className="h-5 w-5 text-primary fill-primary" />
                        <span className="font-bold text-lg text-foreground">{product.rating.toFixed(1)}</span>
                    </div>
                </div>
            </DialogHeader>
            
            <div className='space-y-3 text-sm'>
                {storeName && (
                    <div className='flex items-center gap-2 text-muted-foreground'>
                        <Store className="h-4 w-4 text-primary" />
                        <span>من متجر: <span className='font-semibold text-foreground'>{storeName}</span></span>
                    </div>
                )}
                 {categoryName && (
                    <div className='flex items-center gap-2 text-muted-foreground'>
                        <Tag className="h-4 w-4 text-primary" />
                        <span>الفئة: <span className='font-semibold text-foreground'>{categoryName}</span></span>
                    </div>
                )}
            </div>


            {product.hasVariants ? (
                <div className="space-y-3 pt-2">
                    <h4 className="text-right font-bold flex items-center justify-start gap-2 text-lg">
                        <Layers className="h-5 w-5" />
                        <span>اختر الحجم:</span>
                    </h4>
                     {productVariants.map(variant => {
                        const currentQuantity = variantQuantities[variant.id] || 0;
                        return (
                            <Card key={variant.id} className='p-3 shadow-sm border-border/80'>
                                <div className='flex justify-between items-center gap-3'>
                                    {currentQuantity > 0 ? (
                                        <QuantityCounter 
                                            value={currentQuantity}
                                            onIncrement={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, currentQuantity + 1)}}
                                            onDecrement={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, currentQuantity - 1)}}
                                        />
                                    ) : (
                                        <Button size="sm" className="h-9 px-4 text-xs flex-shrink-0" onClick={(e) => {e.stopPropagation(); handleVariantQuantityChange(variant.id, 1)}}>
                                            <ShoppingCart className="h-4 w-4 text-primary-foreground"/>
                                            إضافة
                                        </Button>
                                    )}
                                    <div className='flex items-center gap-3 text-right flex-1 justify-end'>
                                        <div className='flex-1'>
                                            <p className='font-semibold text-base'>{variant.name}</p>
                                            <div className='flex items-center justify-end gap-1.5 font-bold text-primary'>
                                                <span>{formatPrice(variant.price)}&nbsp;ريال</span>
                                            </div>
                                        </div>
                                        <Image src={variant.imageUrl} alt={variant.name} width={60} height={60} className="rounded-md object-cover" data-ai-hint={variant.imageHint} />
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                 <div className="flex justify-between items-center py-4">
                    <QuantityCounter 
                        value={quantity} 
                        onIncrement={() => setQuantity(q => q + 1)} 
                        onDecrement={() => setQuantity(q => (q > 1 ? q - 1 : 1))}
                    />
                    <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <span>{formatPrice(product.price * quantity)}&nbsp;ريال</span>
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-4 border-t sticky bottom-0 bg-background/95">
             <Button className="w-full h-12 text-lg font-semibold" onClick={handleConfirmAddToCart}>
                <ShoppingCart className="h-5 w-5"/>
                تأكيد الإضافة للسلة
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
