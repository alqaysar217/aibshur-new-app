'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

// Define the type for the data we are fetching from 'app_provinces'
type Governorate = {
  id: string;
  province_name: string;
  is_active: boolean;
};

export default function GovernorateSelectionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const selectionImage = PlaceHolderImages.find(p => p.id === 'governorate-selection-illustration');
  
  // --- Firebase Data Fetching ---
  const firestore = useFirestore();
  
  // Memoize the query to fetch only active governorates
  const governoratesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'app_provinces'), where('is_active', '==', true));
  }, [firestore]);
  
  const { data: activeGovernorates, isLoading } = useCollection<Governorate>(governoratesQuery);

  // Filter the active governorates based on search term
  const filteredGovernorates = useMemo(() => {
    if (!activeGovernorates) return [];
    return activeGovernorates.filter(g =>
      g.province_name.includes(searchTerm)
    );
  }, [activeGovernorates, searchTerm]);

  const handleSelect = (governorate: Governorate) => {
    // Here you would typically store the user's choice, e.g., in localStorage
    console.log(`Selected governorate: ${governorate.province_name} (ID: ${governorate.id})`);
    // Navigate to the next step
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-card">
      <div className="flex-shrink-0 p-6 pt-12 flex flex-col items-center text-center">
        {selectionImage && (
          <Image
            src={selectionImage.imageUrl}
            alt={selectionImage.description}
            width={300}
            height={200}
            className="mb-6 rounded-lg"
            data-ai-hint={selectionImage.imageHint}
          />
        )}
        <h1 className="text-3xl font-bold mb-2">اختر موقعك</h1>
        <p className="text-muted-foreground max-w-sm px-4">
            لنتمكن من عرض المتاجر والخدمات المتوفرة في منطقتك.
        </p>
      </div>

      <div className="flex flex-col flex-grow p-6 pt-2 min-h-0">
        <div className="relative mb-4">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
                type="text"
                placeholder="ابحث عن محافظتك..."
                className="w-full pr-12 pl-4 h-12 text-base bg-muted text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <ScrollArea className="flex-grow">
            <ul className="space-y-2">
            {isLoading ? (
              // Show skeleton loaders while data is being fetched
              [...Array(5)].map((_, i) => (
                <li key={i}>
                  <Skeleton className="w-full h-[50px] rounded-md" />
                </li>
              ))
            ) : filteredGovernorates.length > 0 ? (
                // Render the list of active governorates
                filteredGovernorates.map((gov) => (
                    <li key={gov.id}>
                    <Button
                        variant="outline"
                        className="w-full p-4 text-base h-auto"
                        onClick={() => handleSelect(gov)}
                    >
                        <span className="flex-1 text-right">{gov.province_name}</span>
                    </Button>
                    </li>
                ))
            ) : (
                // Show a message if no active governorates are found
                <p className="text-center text-muted-foreground pt-8">لا توجد محافظات متاحة حالياً.</p>
            )}
            </ul>
        </ScrollArea>
      </div>
    </div>
  );
}
