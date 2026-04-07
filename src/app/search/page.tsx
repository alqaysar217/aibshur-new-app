'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, Heart, List, MapPin, Search as SearchIcon, ShoppingCart, Star, TrendingUp, Store, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreCard } from '@/components/store-card';
import { ProductCard, type Product } from '@/components/product-card';
import { ProductDetailsSheet } from '@/components/product-details-sheet';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BottomNav } from '@/components/bottom-nav';

// MOCK DATA (reusing from other pages)
const storesData = [
  { id: '1', name: 'مطعم البيت الصنعاني', imageId: 'store-yemeni-food', address: 'شارع حدة، صنعاء', distance: '1.2 كم', category: 'مطعم', rating: 4.5, status: 'مفتوح' },
  { id: '2', name: 'سوبر ماركت العالمية', imageId: 'store-supermarket', address: 'شارع الزبيري، صنعاء', distance: '0.8 كم', category: 'ماركت', rating: 4.8, status: 'مفتوح' },
  { id: '3', name: 'صيدلية الشفاء', imageId: 'store-pharmacy', address: 'الدائري، صنعاء', distance: '2.5 كم', category: 'صيدلية', rating: 4.2, status: 'مغلق' },
  { id: '4', name: 'كافيتيريا مزاج', imageId: 'store-cafe', address: 'شارع الجزائر، صنعاء', distance: '1.5 كم', category: 'كافيه', rating: 4.9, status: 'مفتوح' },
];

const productsData: Omit<Product, 'imageUrl' | 'imageHint'>[] = [
  { id: 'p1', name: 'مندي دجاج', description: 'قطعة دجاج طرية مع أرز مندي مبهر ومزين بالزبيب والصنوبر.', price: 2500, rating: 4.8, hasVariants: false, imageId: 'product-mandi-chicken' },
  { id: 'p2', name: 'عقدة لحم', description: 'قطع لحم طازجة مطبوخة مع الخضروات والبهارات اليمنية الأصيلة.', price: 3000, rating: 4.9, hasVariants: true, imageId: 'product-ogda-meat' },
  { id: 'p3', name: 'فحسة', description: 'طبق يمني تقليدي من اللحم المفروم والمرق، يقدم في وعاء حجري ساخن.', price: 2800, rating: 4.7, hasVariants: false, imageId: 'product-fahsa' },
  { id: 'p4', name: 'بيبسي', description: 'مشروب غازي منعش.', price: 300, rating: 4.5, hasVariants: false, imageId: 'product-pepsi' },
];


const stores = storesData.map(store => {
    const imageData = PlaceHolderImages.find(p => p.id === store.imageId);
    return {
        ...store,
        imageUrl: imageData?.imageUrl || '',
        imageHint: imageData?.imageHint || '',
    }
});

const products: Product[] = productsData.map(p => {
    const imageData = PlaceHolderImages.find(img => img.id === (p as any).imageId);
    return { ...p, imageUrl: imageData?.imageUrl || '', imageHint: imageData?.imageHint || '' };
});

const storeFilters = [
    { name: 'الكل', icon: List },
    { name: 'الأقرب', icon: MapPin },
    { name: 'المفضلة', icon: Heart },
    { name: 'الأعلى تقييم', icon: Star },
];

const productFilters = [
    { name: 'الكل', icon: List },
    { name: 'الأكثر طلباً', icon: TrendingUp },
    { name: 'المفضلة', icon: Heart },
];

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState('stores');
  const [activeStoreFilter, setActiveStoreFilter] = useState('الكل');
  const [activeProductFilter, setActiveProductFilter] = useState('الكل');
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
          <h1 className="font-bold text-lg">البحث</h1>
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
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ابحث عن متجر أو منتج..."
            className="w-full pr-10 pl-4 h-12 text-base bg-card text-right"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stores" className="w-full" dir="rtl" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stores" className="gap-2 h-full">
                <Store className="h-5 w-5" />
                المتاجر
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 h-full">
                <ShoppingBasket className="h-5 w-5" />
                المنتجات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stores" className="space-y-4 mt-4">
            {/* Store Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {storeFilters.map((filter) => (
                <Button 
                    key={filter.name} 
                    variant={activeStoreFilter === filter.name ? 'default' : 'outline'} 
                    className="rounded-full whitespace-nowrap"
                    onClick={() => setActiveStoreFilter(filter.name)}
                >
                  <filter.icon />
                  {filter.name}
                </Button>
              ))}
            </div>
            {/* Store Results */}
            <div className="grid grid-cols-1 gap-4">
              {stores.map(store => <StoreCard key={store.id} {...store} />)}
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4 mt-4">
            {/* Product Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {productFilters.map((filter) => (
                <Button 
                    key={filter.name} 
                    variant={activeProductFilter === filter.name ? 'default' : 'outline'} 
                    className="rounded-full whitespace-nowrap"
                    onClick={() => setActiveProductFilter(filter.name)}
                >
                  <filter.icon />
                  {filter.name}
                </Button>
              ))}
            </div>
            {/* Product Results */}
            <div className="grid grid-cols-1 gap-3">
              {products.map(product => <ProductCard key={product.id} product={product} onShowDetails={handleShowDetails} />)}
            </div>
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
