'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeHeader } from '@/components/home-header';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { StoreCard } from '@/components/store-card';
import { List, MapPin, Heart, Star } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';


// Define types from Firestore
type AppCategory = {
  id: string;
  name: string;
  image: string;
  is_active: boolean;
};

type Store = {
  id: string;
  name: string;
  imageUrl: string;
  address: string;
  rating: number;
  deliveryTime: string;
  provinceId: string;
  categoryId: string;
  is_active: boolean;
};

const filters = [
    { name: 'الكل', icon: List },
    { name: 'الأقرب', icon: MapPin },
    { name: 'المفضلة', icon: Heart },
    { name: 'الأعلى تقييم', icon: Star },
];

export default function HomePage() {
  const firestore = useFirestore();
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [activeStoreFilter, setActiveStoreFilter] = useState('الكل');

  // Get selected governorate from localStorage on client-side
  useEffect(() => {
    const storedId = localStorage.getItem('selectedGovernorateId');
    setSelectedGovernorateId(storedId);
  }, []);

  // Fetch active categories
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'app_categories'), where('is_active', '==', true));
  }, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<AppCategory>(categoriesQuery);
  
  const allCategories = useMemo(() => {
    if (!categories) return [];
    return [{ id: 'all', name: 'الكل', image: '/stor-1.png', is_active: true }, ...categories];
  }, [categories]);

  // Fetch active stores for the selected governorate
  const storesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedGovernorateId) return null;
    return query(
      collection(firestore, 'stores'),
      where('is_active', '==', true),
      where('provinceId', '==', selectedGovernorateId)
    );
  }, [firestore, selectedGovernorateId]);
  const { data: stores, isLoading: isLoadingStores } = useCollection<Store>(storesQuery);
  
  const filteredStores = useMemo(() => {
    if (!stores) return [];
    if (selectedCategoryId === 'all') return stores;
    return stores.filter(store => store.categoryId === selectedCategoryId);
  }, [stores, selectedCategoryId]);

  // Create a map for category names for quick lookup
  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const adBanners = PlaceHolderImages.filter(p => p.id.startsWith('ad-banner'));
  
  const showStoreLoading = isLoadingStores || !selectedGovernorateId;

  return (
    <div className="bg-background min-h-screen pb-20">
      <HomeHeader />
      
      <main className="p-4 space-y-6">
        {/* Store Categories */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
            <div className="flex gap-3">
              {isLoadingCategories ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                    <Skeleton className="w-20 h-20 rounded-xl" />
                    <Skeleton className="w-12 h-4 rounded-md" />
                  </div>
                ))
              ) : (
                allCategories.map((cat) => {
                  const isActive = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group"
                    >
                       <div className={cn(
                          "w-20 h-20 rounded-xl overflow-hidden relative flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105",
                           isActive && "ring-2 ring-primary/80 shadow-[0_0_20px_2px] shadow-primary/40"
                        )}>
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          width={80}
                          height={80}
                          className={cn(
                            'object-cover w-full h-full transition-all duration-300',
                            isActive ? 'scale-110' : ''
                          )}
                        />
                      </div>
                      <p
                        className={cn(
                          'text-xs font-bold text-center transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {cat.name}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
        </div>

        {/* Ads Banner */}
        <Carousel className="w-full" opts={{ direction: "rtl", loop: true }}>
          <CarouselContent>
            {adBanners.map((ad) => (
              <CarouselItem key={ad.id}>
                <Card className="overflow-hidden border-none">
                  <CardContent className="p-0 rounded-lg">
                    <Image src={ad.imageUrl} alt={ad.description} width={600} height={300} className="w-full aspect-video object-cover rounded-lg" data-ai-hint={ad.imageHint} />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Store Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filters.map((filter) => {
                const isActive = activeStoreFilter === filter.name;
                return (
                    <Button
                        key={filter.name}
                        variant={isActive ? 'default' : 'outline'}
                        className={cn(
                            "rounded-full whitespace-nowrap shadow-sm transition-colors",
                            !isActive && "border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => setActiveStoreFilter(filter.name)}
                    >
                        <filter.icon />
                        {filter.name}
                    </Button>
                )
            })}
        </div>

        {/* Store Cards */}
        <div className="grid grid-cols-1 gap-4">
          {showStoreLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-lg" />)
          ) : filteredStores && filteredStores.length > 0 ? (
            filteredStores.map(store => {
              const isValidUrl = store.imageUrl && (store.imageUrl.startsWith('http') || store.imageUrl.startsWith('/'));
              return (
              <StoreCard 
                key={store.id} 
                id={store.id}
                name={store.name}
                address={store.address}
                imageUrl={isValidUrl ? store.imageUrl : '/logo.png'}
                deliveryTime={store.deliveryTime}
                distance="0 كم"
                category={categoriesMap[store.categoryId] || 'فئة غير معروفة'}
                rating={store.rating}
                isActive={store.is_active}
              />
            )})
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                {stores && stores.length > 0 ? (
                     <p>لا توجد متاجر في هذه الفئة حالياً.</p>
                ) : (
                     <p>لا توجد متاجر متاحة في محافظتك حالياً.</p>
                )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
