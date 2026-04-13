'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { ArrowRight, ShoppingCart, Star, MapPin, Clock, Heart, List, TrendingUp, X, Bike } from 'lucide-react';
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
    address: string;
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
    mainImageUrl?: string;
    rating: number;
    hasVariants: boolean;
    basePrice?: number;
};

export default function StoreDetailsPage() {
  const params = useParams();
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [selectedProduct, setSelectedProduct] = useState<ProductCardType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [workingHoursText, setWorkingHoursText] = useState('');
  
  const firestore = useFirestore();

  // Fetch store details
  const storeDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'stores', params.id as string) : null, [firestore, params.id]);
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

    // Effect to calculate working hours string on the client
    useEffect(() => {
        if (store) {
            const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const todayWorkingHours = store.workingHours?.find((wh: any) => wh.day === todayName);

            if (todayWorkingHours?.isOpen) {
                const now = new Date();
                const currentHour = now.getHours();
    
                const [morningStartHour] = todayWorkingHours.morning_from.split(':').map(Number);
                const [morningEndHour] = todayWorkingHours.morning_to.split(':').map(Number);
    
                if (currentHour >= morningStartHour && currentHour < morningEndHour) {
                    setWorkingHoursText(`الفترة الحالية: ${todayWorkingHours.morning_from} - ${todayWorkingHours.morning_to}`);
                    return;
                }
    
                if (todayWorkingHours.evening_from && todayWorkingHours.evening_to) {
                    const [eveningStartHour] = todayWorkingHours.evening_from.split(':').map(Number);
                    const [eveningEndHour] = todayWorkingHours.evening_to.split(':').map(Number);
    
                    if (currentHour >= eveningStartHour && currentHour < eveningEndHour) {
                        setWorkingHoursText(`الفترة الحالية: ${todayWorkingHours.evening_from} - ${todayWorkingHours.evening_to}`);
                        return;
                    }
                }
                
                // If not in an active period, but the store is open for the day, show the next upcoming period.
                if (currentHour < morningStartHour) {
                    setWorkingHoursText(`يفتح صباحاً: ${todayWorkingHours.morning_from}`);
                } else if (todayWorkingHours.evening_from && currentHour < parseInt(todayWorkingHours.evening_from.split(':')[0], 10)) {
                    setWorkingHoursText(`يفتح مساءً: ${todayWorkingHours.evening_from}`);
                } else {
                    setWorkingHoursText(''); // Closed for the day
                }
            } else {
                setWorkingHoursText('');
            }
        }
    }, [store]);

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
            <div className="p-4 bg-card border-b">
              <div className="flex items-start gap-4">
                <Skeleton className="w-20 h-20 rounded-full"/>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4"/>
                  <Skeleton className="h-4 w-1/2"/>
                  <Skeleton className="h-4 w-1/3"/>
                </div>
              </div>
            </div>
            <div className="sticky top-16 z-10 bg-background/95 py-3 border-b"><div className="flex gap-2 px-4"><Skeleton className="h-9 w-20 rounded-full" /><Skeleton className="h-9 w-28 rounded-full" /></div></div>
            <div className="p-4 grid grid-cols-1 gap-3"><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-24 w-full rounded-lg" /></div>
          </main>
        </div>
      );
  }

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayWorkingHours = store.workingHours?.find((wh: any) => wh.day === todayName);

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
        <div className="p-4 bg-card border-b space-y-4">
            <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                    <Image 
                        src={store.imageUrl} 
                        alt={store.name} 
                        width={80} 
                        height={80}
                        className="object-cover rounded-full border-4 border-background shadow-lg ring-2 ring-primary/30"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold">{store.name}</h1>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 -mr-2">
                            <Heart className="h-5 w-5 text-primary"/>
                        </Button>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 truncate">
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="truncate">{store.address}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Bike className="h-4 w-4 text-primary" />
                            <span>0 كم</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3 border-t pt-3">
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-semibold">{categoriesMap[store.categoryId] || ''}</Badge>
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                            <span className="font-bold text-foreground">{store.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <Badge variant={todayWorkingHours?.isOpen ? 'default' : 'destructive'} className="px-3 py-1 text-xs font-bold">
                        {todayWorkingHours?.isOpen ? 'مفتوح' : 'مغلق'}
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4 text-primary"/>
                        <span>الطلب يستغرق : {store.deliveryTime}د</span>
                    </div>
                    {todayWorkingHours?.isOpen && workingHoursText && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary"/>
                            <span>{workingHoursText}</span>
                        </div>
                    )}
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
                const isValidUrl = product.mainImageUrl && (product.mainImageUrl.startsWith('http') || product.mainImageUrl.startsWith('/'));
                const productForCard: ProductCardType = {
                    ...product,
                    price: product.basePrice || 0,
                    imageUrl: isValidUrl ? product.mainImageUrl! : '/logo.png',
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
