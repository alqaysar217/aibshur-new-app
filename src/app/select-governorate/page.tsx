'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const governorates = [
  'أمانة العاصمة', 'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'حضرموت',
  'المهرة', 'شبوة', 'أبين', 'لحج', 'الضالع', 'عمران', 'حجة', 'صعدة',
  'المحويت', 'مأرب', 'الجوف', 'البيضاء', 'ريمة', 'سقطرى'
];

export default function GovernorateSelectionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const selectionImage = PlaceHolderImages.find(p => p.id === 'governorate-selection-illustration');

  const filteredGovernorates = governorates.filter(g =>
    g.includes(searchTerm)
  );

  const handleSelect = (governorate: string) => {
    console.log(`Selected governorate: ${governorate}`);
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
                className="w-full pr-12 pl-4 h-12 text-base bg-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <ScrollArea className="flex-grow">
            <ul className="space-y-2">
            {filteredGovernorates.map((gov) => (
                <li key={gov}>
                <Button
                    variant="outline"
                    className="w-full justify-start text-right p-4 text-base h-auto"
                    onClick={() => handleSelect(gov)}
                >
                    {gov}
                </Button>
                </li>
            ))}
            </ul>
        </ScrollArea>
      </div>
    </div>
  );
}
