'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const governorates = [
  'أمانة العاصمة', 'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'حضرموت',
  'المهرة', 'شبوة', 'أبين', 'لحج', 'الضالع', 'عمران', 'حجة', 'صعدة',
  'المحويت', 'مأرب', 'الجوف', 'البيضاء', 'ريمة', 'سقطرى'
];

export default function GovernorateSelectionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredGovernorates = governorates.filter(g =>
    g.includes(searchTerm)
  );

  const handleSelect = (governorate: string) => {
    console.log(`Selected governorate: ${governorate}`);
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-card p-6 pt-12">
      <h1 className="text-2xl font-bold text-center mb-6">اختر محافظتك</h1>
      <div className="relative mb-6">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ابحث عن محافظتك..."
          className="w-full ps-12 pe-4 py-2 h-12 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-grow">
        <ul className="space-y-3">
          {filteredGovernorates.map((gov) => (
            <li key={gov}>
              <Button
                variant="outline"
                className="w-full justify-start p-4 text-base h-auto"
                onClick={() => handleSelect(gov)}
              >
                {gov}
              </Button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
