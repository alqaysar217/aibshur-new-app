'use client';

import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuantityCounterProps = {
  value: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
  className?: string;
};

export function QuantityCounter({ value, onIncrement, onDecrement, className }: QuantityCounterProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={onDecrement} disabled={value === 0}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-bold text-lg">{value}</span>
      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={onIncrement}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
