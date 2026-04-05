import { HomeHeader } from '@/components/home-header';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { StoreCard } from '@/components/store-card';
import { List, MapPin, Heart, Star } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

const categories = [
  { name: 'مطاعم', imageId: 'category-restaurants' },
  { name: 'صيدليات', imageId: 'category-pharmacies' },
  { name: 'ماركت', imageId: 'category-supermarkets' },
  { name: 'خضروات', imageId: 'category-vegetables' },
  { name: 'كافيه', imageId: 'category-cafes' },
  { name: 'تجميل', imageId: 'category-beauty' },
  { name: 'حلويات', imageId: 'category-sweets' },
  { name: 'مخابز', imageId: 'category-bakeries' },
];

const filters = [
    { name: 'الكل', icon: List },
    { name: 'الأقرب', icon: MapPin },
    { name: 'المفضلة', icon: Heart },
    { name: 'الأعلى تقييم', icon: Star },
];

const storesData = [
  { id: '1', name: 'مطعم البيت الصنعاني', imageId: 'store-yemeni-food', address: 'شارع حدة، صنعاء', distance: '1.2 كم', category: 'مطعم', rating: 4.5, status: 'مفتوح' },
  { id: '2', name: 'سوبر ماركت العالمية', imageId: 'store-supermarket', address: 'شارع الزبيري، صنعاء', distance: '0.8 كم', category: 'ماركت', rating: 4.8, status: 'مفتوح' },
  { id: '3', name: 'صيدلية الشفاء', imageId: 'store-pharmacy', address: 'الدائري، صنعاء', distance: '2.5 كم', category: 'صيدلية', rating: 4.2, status: 'مغلق' },
  { id: '4', name: 'كافيتيريا مزاج', imageId: 'store-cafe', address: 'شارع الجزائر، صنعاء', distance: '1.5 كم', category: 'كافيه', rating: 4.9, status: 'مفتوح' },
];

export default function HomePage() {
  const adBanners = PlaceHolderImages.filter(p => p.id.startsWith('ad-banner'));
  const stores = storesData.map(store => {
    const imageData = PlaceHolderImages.find(p => p.id === store.imageId);
    return {
        ...store,
        imageUrl: imageData?.imageUrl || '',
        imageHint: imageData?.imageHint || '',
    }
  });

  const categoryImages = categories.map(cat => {
      const imageData = PlaceHolderImages.find(p => p.id === cat.imageId);
      return {
          ...cat,
          imageUrl: imageData?.imageUrl || '',
          imageHint: imageData?.imageHint || '',
          description: imageData?.description || ''
      }
  });

  return (
    <div className="bg-background min-h-screen pb-20">
      <HomeHeader />
      
      <main className="p-4 space-y-6">
        {/* Store Categories */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          <div className="flex gap-4">
            {categoryImages.map((cat) => (
              <div key={cat.name} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center shadow-sm border overflow-hidden">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.description}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                    data-ai-hint={cat.imageHint}
                  />
                </div>
                <p className="text-xs font-medium text-center text-muted-foreground">{cat.name}</p>
              </div>
            ))}
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
            {stores.map(store => <StoreCard key={store.id} {...store} />)}
            {stores.map(store => <StoreCard key={`${store.id}-2`} {...store} id={`${store.id}-2`} />)}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
