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
        <div className="overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          <div className="flex gap-4">
            {isLoadingCategories ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <Skeleton className="w-12 h-4 rounded-md" />
                </div>
              ))
            ) : (
              categories?.map((cat) => (
                <div key={cat.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                  <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center shadow-sm border overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-xs font-medium text-center text-muted-foreground">{cat.name}</p>
                </div>
              ))
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
            {filters.map((filter, index) => (
                <Button key={filter.name} variant={index === 0 ? 'default' : 'outline'} className="rounded-full whitespace-nowrap">
                    <filter.icon />
                    {filter.name}
                </Button>
            ))}
        </div>

        {/* Store Cards */}
        <div className="grid grid-cols-1 gap-4">
          {showStoreLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[104px] w-full rounded-lg" />)
          ) : stores && stores.length > 0 ? (
            stores.map(store => (
              <StoreCard 
                key={store.id} 
                id={store.id}
                name={store.name}
                imageUrl={store.imageUrl}
                deliveryTime={store.deliveryTime}
                distance="0 كم"
                category={categoriesMap[store.categoryId] || 'فئة غير معروفة'}
                rating={store.rating}
                isActive={store.is_active}
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>لا توجد متاجر متاحة في محافظتك حالياً.</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
