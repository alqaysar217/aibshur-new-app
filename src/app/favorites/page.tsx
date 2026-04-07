'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, ShoppingCart, Store, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreCard } from '@/components/store-card';
import { ProductCard, type Product } from '@/components/product-card';
import { ProductDetailsSheet } from '@/components/product-details-sheet';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BottomNav } from '@/components/bottom-nav';

// MOCK DATA (reusing from other pages)
const storesData = [
  { id: '1', name: 'مطعم البيت الصنعاني', imageId: 'store-yemeni-food', address: 'شارع حدة، صنعاء', distance: '1.2 كم', category: 'مطعم', rating: 4.5, status: 'مفتوح' },
  { id: '4', name: 'كافيتيريا مزاج', imageId: 'store-cafe', address: 'شارع الجزائر، صنعاء', distance: '1.5 كم', category: 'كافيه', rating: 4.9, status: 'مفتوح' },
];

const productsData: Omit<Product, 'imageUrl' | 'imageHint'>[] = [
  { id: 'p2', name: 'عقدة لحم', description: 'قطع لحم طازجة مطبوخة مع الخضروات والبهارات اليمنية الأصيلة.', price: 3000, rating: 4.9, hasVariants: true, imageId: 'product-ogda-meat' },
  { id: 'p3', name: 'فحسة', description: 'طبق يمني تقليدي من اللحم المفروم والمرق، يقدم في وعاء حجري ساخن.', price: 2800, rating: 4.7, hasVariants: false, imageId: 'product-fahsa' },
];


const favoriteStores = storesData.map(store => {
    const imageData = PlaceHolderImages.find(p => p.id === store.imageId);
    return {
        ...store,
        imageUrl: imageData?.imageUrl || '',
        imageHint: imageData?.imageHint || '',
    }
});

const favoriteProducts: Product[] = productsData.map(p => {
    const imageData = PlaceHolderImages.find(img => img.id === (p as any).imageId);
    return { ...p, imageUrl: imageData?.imageUrl || '', imageHint: imageData?.imageHint || '' };
});


export default function FavoritesPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleShowDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">المفضلة</h1>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/notifications"><Bell className="h-5 w-5" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 space-y-4">
        {/* Tabs */}
        <Tabs defaultValue="stores" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stores" className="gap-2 h-full">
                <Store />
                المتاجر
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 h-full">
                <ShoppingBasket />
                المنتجات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stores" className="space-y-4 mt-4">
            {favoriteStores.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {favoriteStores.map(store => <StoreCard key={store.id} {...store} />)}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">لا يوجد متاجر مفضلة بعد.</p>
                </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4 mt-4">
             {favoriteProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {favoriteProducts.map(product => <ProductCard key={product.id} product={product} onShowDetails={handleShowDetails} />)}
                </div>
             ) : (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">لا يوجد منتجات مفضلة بعد.</p>
                </div>
             )}
          </TabsContent>
        </Tabs>
      </main>
      
      <ProductDetailsSheet 
        product={selectedProduct}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
      <BottomNav />
    </div>
  );
}
