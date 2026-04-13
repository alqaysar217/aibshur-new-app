'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, Heart, List, MapPin, Search as SearchIcon, ShoppingCart, Star, TrendingUp, Store, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreCard } from '@/components/store-card';
import { ProductCard, type Product as ProductType } from '@/components/product-card';
import { ProductDetailsSheet } from '@/components/product-details-sheet';
import { BottomNav } from '@/components/bottom-nav';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
  workingHours: any[];
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

type AppCategory = {
  id: string;
  name: string;
  image: string;
};

type UserProfile = {
  favoriteStoreIds?: string[];
  favoriteProductIds?: string[];
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();

  // Fetch user profile to get favorite IDs
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'profile', 'main');
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Data Fetching
  const storesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stores'), where('is_active', '==', true)) : null, [firestore]);
  const { data: stores, isLoading: isLoadingStores } = useCollection<StoreType>(storesQuery);

  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products'), where('is_active', '==', true)) : null, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<FirestoreProduct>(productsQuery);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'app_categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<AppCategory>(categoriesQuery);

  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {} as Record<string, string>);
  }, [categories]);
  
  const isLoading = isLoadingStores || isLoadingProducts || isLoadingCategories;

  // Handlers
  const handleToggleFavoriteStore = async (storeId: string) => {
    if (!userProfileRef) return;
    const isCurrentlyFavorite = userProfile?.favoriteStoreIds?.includes(storeId);
    setDocumentNonBlocking(userProfileRef, {
      favoriteStoreIds: isCurrentlyFavorite ? arrayRemove(storeId) : arrayUnion(storeId),
    }, { merge: true });
  };

  const handleToggleFavoriteProduct = async (productId: string) => {
    if (!userProfileRef) return;
    const isCurrentlyFavorite = userProfile?.favoriteProductIds?.includes(productId);
    setDocumentNonBlocking(userProfileRef, {
      favoriteProductIds: isCurrentlyFavorite ? arrayRemove(productId) : arrayUnion(productId),
    }, { merge: true });
  };

  // Filtering Logic
  const filteredStores = useMemo(() => {
    if (!stores) return [];
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

  const filteredProducts: ProductType[] = useMemo(() => {
    if (!products) return [];
    return (products)
      .filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
          isFavorite: userProfile?.favoriteProductIds?.includes(p.id) ?? false,
        };
      });
  }, [products, searchTerm, userProfile]);


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

  const isSelectedProductFavorite = selectedProduct ? userProfile?.favoriteProductIds?.includes(selectedProduct.id) : false;

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stores" className="w-full" dir="rtl" onValueChange={setActiveTab}>
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
            {/* Store Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {storeFilters.map((filter) => {
                  const isActive = activeStoreFilter === filter.name;
                  return (
                    <Button 
                        key={filter.name} 
                        variant={isActive ? 'default' : 'outline'}
                        className={cn(
                            "rounded-full whitespace-nowrap shadow-sm transition-colors",
                            isActive ? "bg-sidebar-active-gradient text-primary-foreground" : "border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => setActiveStoreFilter(filter.name)}
                    >
                      <filter.icon className="h-4 w-4" />
                      {filter.name}
                    </Button>
                  )
              })}
            </div>
            {/* Store Results */}
            <div className="grid grid-cols-1 gap-4">
              {isLoadingStores ? renderStoreSkeletons() : filteredStores.length > 0 ? (
                filteredStores.map(store => {
                    const isFavorite = userProfile?.favoriteStoreIds?.includes(store.id) ?? false;
                    return (
                        <StoreCard 
                            key={store.id} 
                            id={store.id}
                            name={store.name}
                            address={store.address}
                            imageUrl={store.imageUrl || '/logo.png'}
                            deliveryTime={store.deliveryTime}
                            distance="0 كم" // Placeholder
                            category={categoriesMap[store.categoryId] || 'غير محدد'}
                            rating={store.rating}
                            workingHours={store.workingHours}
                            isFavorite={isFavorite}
                            onToggleFavorite={handleToggleFavoriteStore}
                        />
                    )
                })
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>لا توجد متاجر تطابق بحثك.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4 mt-4">
            {/* Product Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {productFilters.map((filter) => {
                  const isActive = activeProductFilter === filter.name;
                  return (
                    <Button 
                        key={filter.name} 
                        variant={isActive ? 'default' : 'outline'} 
                        className={cn(
                            "rounded-full whitespace-nowrap shadow-sm transition-colors",
                            isActive ? "bg-sidebar-active-gradient text-primary-foreground" : "border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => setActiveProductFilter(filter.name)}
                    >
                      <filter.icon className="h-4 w-4"/>
                      {filter.name}
                    </Button>
                  )
              })}
            </div>
            {/* Product Results */}
            <div className="grid grid-cols-1 gap-3">
              {isLoadingProducts ? renderProductSkeletons() : filteredProducts.length > 0 ? (
                filteredProducts.map(product => <ProductCard key={product.id} product={product} onShowDetails={handleShowDetails} onToggleFavorite={handleToggleFavoriteProduct} />)
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>لا توجد منتجات تطابق بحثك.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <ProductDetailsSheet 
        product={selectedProduct}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        isFavorite={isSelectedProductFavorite}
        onToggleFavorite={() => selectedProduct && handleToggleFavoriteProduct(selectedProduct.id)}
      />
      <BottomNav />
    </div>
  );
}
