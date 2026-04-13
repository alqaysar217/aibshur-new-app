'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Map, Bell, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressCard } from '@/components/address-card';
import { AddAddressDialog } from '@/components/add-address-dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

// Type for Address, should match what's in backend.json
type Address = {
    id: string;
    userId: string;
    addressType: 'home' | 'work' | 'other';
    customName?: string;
    city: string;
    street: string;
    latitude: number;
    longitude: number;
};

// Type for User Profile to get default address
type UserProfile = {
    id: string;
    defaultAddressId?: string;
};


export default function AddressesPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => (user?.uid && firestore) ? doc(firestore, 'users', user.uid, 'profile', 'main') : null, [user, firestore]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    const userAddressesQuery = useMemoFirebase(() => {
        if (!user?.uid || !firestore) return null;
        return query(collection(firestore, 'addresses'), where('userId', '==', user.uid));
    }, [user, firestore]);
    const { data: userAddresses, isLoading: isLoadingAddresses } = useCollection<Address>(userAddressesQuery);
    
    const handleSetDefault = (addressId: string) => {
        if (!userProfileRef) return;
        setDocumentNonBlocking(userProfileRef, { defaultAddressId: addressId }, { merge: true });
    };

    const handleDelete = (addressId: string) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'addresses', addressId));
        // If the deleted address was the default, clear it from the profile
        if (userProfile?.defaultAddressId === addressId) {
            handleSetDefault(''); // or handle it more gracefully
        }
    };

    const isLoading = isUserLoading || isLoadingProfile || isLoadingAddresses;

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen bg-background">
                 <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
                    <div className="flex items-center justify-between h-16 px-2">
                        <Button variant="ghost" size="icon" asChild><Link href="/account"><ArrowRight className="h-5 w-5" /></Link></Button>
                        <h1 className="font-bold text-lg">عنوان التوصيل</h1>
                        <div className="w-9 h-9" />
                    </div>
                </header>
                <main className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between h-16 px-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/account"><ArrowRight className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="font-bold text-lg">عنوان التوصيل</h1>
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

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-y-auto pb-24">
                {userAddresses && userAddresses.length > 0 ? (
                    <div className="space-y-3">
                        {userAddresses.map((address) => {
                            const name = address.addressType === 'other'
                                ? address.customName
                                : (address.addressType === 'home' ? 'المنزل' : 'العمل');
                            
                            return (
                                <AddressCard
                                    key={address.id}
                                    id={address.id}
                                    addressType={address.addressType}
                                    name={name || 'عنوان'}
                                    city={address.city}
                                    street={address.street}
                                    isDefault={address.id === userProfile?.defaultAddressId}
                                    onSetDefault={() => handleSetDefault(address.id)}
                                    onDelete={() => handleDelete(address.id)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground">
                        <Map className="h-24 w-24 mb-4" />
                        <h2 className="text-xl font-semibold">لا توجد عناوين محفوظة</h2>
                        <p className="max-w-xs mt-2">ابدأ بإضافة عنوان جديد لتسهيل عملية التوصيل.</p>
                    </div>
                )}
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
                 <Button
                    className="rounded-full h-16 w-16 shadow-lg bg-sidebar-active-gradient text-primary-foreground"
                    onClick={() => setIsAddDialogOpen(true)}
                >
                    <Plus className="h-8 w-8" />
                </Button>
            </div>

            <AddAddressDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} userId={user?.uid} />
        </div>
    );
}
