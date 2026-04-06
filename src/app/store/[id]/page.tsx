'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingCart, Star, MapPin, Clock, Heart, List, TrendingUp, Drumstick, UtensilsCrossed, Sandwich, CupSoda, Leaf, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductCard, type Product } from '@/components/product-card';
import { ProductDetailsSheet } from '@/components/product-details-sheet';
import { cn } from '@/lib/utils';

// MOCK DATA
const storeDetails = {
  id: '1',
  name: 'مطعم البيت الصنعاني',
  imageUrl: PlaceHolderImages.find(p => p.id === 'store-banner-yemeni')?.imageUrl || '',
  imageHint: PlaceHolderImages.find(p => p.id === 'store-banner-yemeni')?.imageHint || '',
  rating: 4.5,
  category: 'مطعم',
  status: 'مفتوح',
  address: 'شارع حدة، صنعاء',
  distance: '1.2 كم',
  deliveryTime: '25-35',
  workingHours: '8ص - 11م',
};

const productFilters = [
    { name: 'الكل', icon: List },
    { name: 'الأكثر طلباً', icon: TrendingUp },
    { name: 'مفضلاتي', icon: Heart },
    { name: 'لحوم', icon: Drumstick },
    { name: 'أرز', icon: UtensilsCrossed },
    { name: 'وجبات سريعة', icon: Sandwich },
    { name: 'مشروبات', icon: CupSoda },
    { name: 'سلطات', icon: Leaf },
];

// Add imageId to map to placeholder images
const productsData: Omit<Product, 'imageUrl' | 'imageHint'>[] = [
  { id: 'p1', name: 'مندي دجاج', description: 'قطعة دجاج طرية مع أرز مندي مبهر ومزين بالزبيب والصنوبر.', price: 2500, rating: 4.8, hasVariants: false, imageId: 'product-mandi-chicken' },
  { id: 'p2', name: 'عقدة لحم', description: 'قطع لحم طازجة مطبوخة مع الخضروات والبهارات اليمنية الأصيلة.', price: 3000, rating: 4.9, hasVariants: true, imageId: 'product-ogda-meat' },
  { id: 'p3', name: 'فحسة', description: 'طبق يمني تقليدي من اللحم المفروم والمرق، يقدم في وعاء حجري ساخن.', price: 2800, rating: 4.7, hasVariants: false, imageId: 'product-fahsa' },
  { id: 'p4', name: 'بيبسي', description: 'مشروب غازي منعش.', price: 300, rating: 4.5, hasVariants: false, imageId: 'product-pepsi' },
];

const products: Product[] = productsData.map(p => {
    const imageData = PlaceHolderImages.find(img => img.id === (p as any).imageId);
    return { ...p, imageUrl: imageData?.imageUrl || '', imageHint: imageData?.imageHint || '' };
});


export default function StoreDetailsPage({ params }: { params: { id: string } }) {
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleShowDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <h2 className="font-bold text-lg truncate">{storeDetails.name}</h2>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
          </Button>
        </div>
      </header>

      <main className="pb-4">
        {/* Store Info */}
        <div className="relative h-40 w-full">
            <Image 
                src={storeDetails.imageUrl} 
                alt={storeDetails.name} 
                fill 
                className="object-cover" 
                data-ai-hint={storeDetails.imageHint}
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 right-0 p-4 text-white">
                <h1 className="text-2xl font-bold">{storeDetails.name}</h1>
                <div className="flex items-center gap-3 text-sm mt-1">
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span>{storeDetails.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{storeDetails.category}</span>
                     <span>•</span>
                    <span className={cn("font-semibold", storeDetails.status === 'مفتوح' ? 'text-green-400' : 'text-red-400')}>
                        {storeDetails.status}
                    </span>
                </div>
            </div>
        </div>

        {/* Store Details Bar */}
        <div className="p-3 bg-card border-b">
             <div className="flex justify-around text-xs text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{storeDetails.distance}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{storeDetails.deliveryTime} دق</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{storeDetails.workingHours}</span>
                </div>
                 <div className="flex flex-col items-center gap-1">
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="font-semibold">المفضلة</span>
                </div>
            </div>
        </div>

        {/* Product Filters */}
        <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-3 border-b">
          <div className="overflow-x-auto px-4 no-scrollbar">
            <div className="flex gap-2" dir="rtl">
              {productFilters.map((filter) => (
                <Button
                  key={filter.name}
                  variant={activeFilter === filter.name ? 'default' : 'outline'}
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setActiveFilter(filter.name)}
                >
                  <filter.icon />
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Product List */}
        <div className="p-4 grid grid-cols-1 gap-3">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onShowDetails={handleShowDetails} />
          ))}
           {products.map(product => (
            <ProductCard key={`${product.id}-2`} product={{...product, id: `${product.id}-2`}} onShowDetails={handleShowDetails} />
          ))}
        </div>
      </main>

      <ProductDetailsSheet 
        product={selectedProduct}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
