'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, ShoppingCart, Store, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreCard } from '@/components/store-card';
import { ProductCard, type Product as ProductType } from '@/components/product-card';
import { ProductDetailsSheet } from '@/components/product-details-sheet';
import { BottomNav } from '@/components/bottom-nav';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Types from Firestore
type StoreType = {
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

type FirestoreProduct = {
  id: string;
  name: string;
  description: string;
  mainImageUrl?: string;
  rating: number;
  hasVariants: boolean;
  basePrice?: number;
  storeId: string;
  categoryId: string;
  is_active: boolean;
};

type UserProfile = {
  favoriteStoreIds?: string[];
  favoriteProductIds?: string[];
};

type AppCategory = {
  id: string;
  name: string;
  image: string;
};

export default function FavoritesPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Fetch user profile to get favorite IDs
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}/profile`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  // Fetch all stores, products, and categories
  const { data: allStores, isLoading: isLoadingStores } = useCollection<StoreType>(useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]));
  const { data: allProducts, isLoading: isLoadingProducts } = useCollection<FirestoreProduct>(useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]));
  const { data: categories, isLoading: isLoadingCategories } = useCollection<AppCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'app_categories') : null, [firestore]));

  const isLoading = isUserLoading || isLoadingProfile || isLoadingStores || isLoadingProducts || isLoadingCategories;

  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {} as Record<string, string>);
  }, [categories]);

  const favoriteStores = useMemo(() => {
    if (!allStores || !userProfile?.favoriteStoreIds) return [];
    return allStores.filter(store => userProfile.favoriteStoreIds!.includes(store.id));
  }, [allStores, userProfile]);

  const favoriteProducts: ProductType[] = useMemo(() => {
    if (!allProducts || !userProfile?.favoriteProductIds) return [];
    return allProducts
        .filter(product => userProfile.favoriteProductIds!.includes(product.id))
        .map(p => {
          const isValidUrl = p.mainImageUrl && (p.mainImageUrl.startsWith('http') || p.mainImageUrl.startsWith('/'));
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.basePrice || 0,
            rating: p.rating,
            hasVariants: p.hasVariants,
            imageUrl: isValidUrl ? p.mainImageUrl! : '/logo.png',
            imageHint: p.name,
          };
        });
  }, [allProducts, userProfile]);

  const handleShowDetails = (product: ProductType) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };
  
  const renderStoreSkeletons = () => (
    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
  );

  const renderProductSkeletons = () => (
    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
  );

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
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-xl bg-muted p-1 h-auto">
            <TabsTrigger value="stores" className="gap-2 h-12 text-base rounded-lg data-[state=active]:bg-sidebar-active-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                <Store className="h-5 w-5" />
                المتاجر
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 h-12 text-base rounded-lg data-[state=active]:bg-sidebar-active-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                <ShoppingBasket className="h-5 w-5" />
                المنتجات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stores" className="space-y-4 mt-4">
            {isLoading ? renderStoreSkeletons() : favoriteStores.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {favoriteStores.map(store => {
                       const isValidUrl = store.imageUrl && (store.imageUrl.startsWith('http') || store.imageUrl.startsWith('/'));
                       return (
                          <StoreCard
                            key={store.id}
                            id={store.id}
                            name={store.name}
                            address={store.address}
                            imageUrl={isValidUrl ? store.imageUrl : '/logo.png'}
                            deliveryTime={store.deliveryTime}
                            distance="0 كم" // Placeholder
                            category={categoriesMap[store.categoryId] || 'غير محدد'}
                            rating={store.rating}
                            isActive={store.is_active}
                          />
                       );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>لا يوجد متاجر مفضلة بعد.</p>
                </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4 mt-4">
             {isLoading ? renderProductSkeletons() : favoriteProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {favoriteProducts.map(product => <ProductCard key={product.id} product={product} onShowDetails={handleShowDetails} />)}
                </div>
             ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>لا يوجد منتجات مفضلة بعد.</p>
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
