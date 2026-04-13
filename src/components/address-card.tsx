'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Briefcase, MapPin, CheckCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AddressCardProps = {
    id: string;
    isDefault: boolean;
    name: string;
    city: string;
    street: string;
    addressType: 'home' | 'work' | 'other';
    onSetDefault: () => void;
    onDelete: () => void;
};

export function AddressCard({ id, isDefault, name, city, street, addressType, onSetDefault, onDelete }: AddressCardProps) {
    const Icon = addressType === 'home' ? Home : addressType === 'work' ? Briefcase : MapPin;

    return (
        <Card className={cn("transition-all", isDefault && "border-primary ring-2 ring-primary")}>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary flex-shrink-0" />
                        <div>
                            <h3 className="font-bold">{name} - {city}</h3>
                            <p className="text-sm text-muted-foreground">{street}</p>
                        </div>
                    </div>
                    {isDefault && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                    {!isDefault && (
                        <Button variant="outline" size="sm" onClick={onSetDefault}>
                            تعيين كافتراضي
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
