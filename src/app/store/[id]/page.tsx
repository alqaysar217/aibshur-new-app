'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { ArrowRight, ShoppingCart, Star, MapPin, Clock, Heart, List, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard, type Product as ProductCardType } from '@/components/product-card';
import { ProductDetailsSheet } from '@/components/product-details-sheet';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';

// Type for the store data from firestore
type Store = {
    id: string;
    name: string;
    imageUrl: string;
    rating: number;
    deliveryTime: string;
    is_active: boolean;
    categoryId: string;
    workingHours: any[]; // simplified for now
};

// Type for products from firestore
type FirestoreProduct = {
    id: string;
    name: string;
    description: string;
    mainImageUrl: string;
    rating: number;
    hasVariants: boolean;
    basePrice?: number;
};

export default function StoreDetailsPage() {
  const params = useParams<{ id: string }>();
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [selectedProduct, setSelectedProduct] = useState<ProductCardType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const firestore = useFirestore();

  // Fetch store details
  const storeDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'stores', params.id) : null, [firestore, params.id]);
  const { data: store, isLoading: isLoadingStore } = useDoc<Store>(storeDocRef);

  // Fetch products for this store
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'products'),
        where('storeId', '==', params.id),
        where('is_active', '==', true)
    );
  }, [firestore, params.id]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<FirestoreProduct>(productsQuery);

  // Fetch categories to get category name
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'app_categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection(categoriesQuery);
  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return categories.reduce((acc, cat: any) => {
        acc[cat.id] = cat.name;
        return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const handleShowDetails = (product: ProductCardType) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };
  
  const isLoading = isLoadingStore || isLoadingProducts || isLoadingCategories;

  if (isLoading || !store) {
      // Return a skeleton loading UI
      return (
        <div className="bg-background min-h-screen">
          <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b"><div className="flex items-center justify-between h-16 px-2"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-6 w-32" /><Skeleton className="h-9 w-9 rounded-full" /></div></header>
          <main className="pb-4">
            <Skeleton className="h-40 w-full" />
            <div className="p-3 bg-card border-b"><div className="flex justify-around"><Skeleton className="h-10 w-16" /><Skeleton className="h-10 w-16" /><Skeleton className="h-10 w-16" /><Skeleton className="h-10 w-16" /></div></div>
            <div className="sticky top-16 z-10 bg-background/95 py-3 border-b"><div className="flex gap-2 px-4"><Skeleton className="h-9 w-20 rounded-full" /><Skeleton className="h-9 w-28 rounded-full" /></div></div>
            <div className="p-4 grid grid-cols-1 gap-3"><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-24 w-full rounded-lg" /></div>
          </main>
        </div>
      );
  }

  const productFilters = [
    { name: 'الكل', icon: List },
    { name: 'الأكثر طلباً', icon: TrendingUp },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <h2 className="font-bold text-lg truncate">{store.name}</h2>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
          </Button>
        </div>
      </header>

      <main className="pb-4">
        {/* Store Info */}
        <div className="relative h-40 w-full">
            <Image 
                src={store.imageUrl} 
                alt={store.name} 
                fill 
                className="object-cover" 
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 right-0 p-4 text-white">
                <h1 className="text-2xl font-bold">{store.name}</h1>
                <div className="flex items-center gap-3 text-sm mt-1">
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
                        <span className="text-white">{store.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{categoriesMap[store.categoryId] || ''}</span>
                     <span>•</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold",
                        store.is_active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      )}
                    >
                      {store.is_active ? 'مفتوح' : 'مغلق'}
                    </Badge>
                </div>
            </div>
        </div>

        {/* Store Details Bar */}
        <div className="p-3 bg-card border-b">
             <div className="flex justify-around text-xs text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-semibold">N/A</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{store.deliveryTime} دق</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-semibold">N/A</span>
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
          {isLoadingProducts ? (
            <>
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </>
          ) : products && products.length > 0 ? (
            products.map(product => {
                const productForCard: ProductCardType = {
                    ...product,
                    price: product.basePrice || 0,
                    imageUrl: product.mainImageUrl,
                    imageHint: '',
                };
                return (
                    <ProductCard 
                        key={product.id} 
                        product={productForCard} 
                        onShowDetails={handleShowDetails} 
                    />
                );
            })
          ) : (
             <div className="text-center py-10 text-muted-foreground">
              <p>لا توجد منتجات متاحة في هذا المتجر حالياً.</p>
            </div>
          )}
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
