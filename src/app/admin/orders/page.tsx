'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// Firebase imports
import { collection, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';

// Components
import OrdersLoading from './loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
    AlertTriangle, BadgeDollarSign, Bike, Building, Calendar, Check, CheckCircle, ChevronDown, Circle, Clock, Contact, CookingPot,
    CreditCard, FileText, HandCoins, Hourglass, Link as LinkIcon, ListFilter, Mail, MapPin, MessageCircle, MoreVertical,
    Package, Phone, Search, ShoppingCart, Star, Store, User, Wallet, X, XCircle, UserCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Types
import type { Driver } from '../delegates/page';

type OrderStatus = 'incoming' | 'confirmed' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
type PaymentMethod = 'cash' | 'wallet' | 'bank_transfer';
type PaymentStatus = 'pending' | 'paid' | 'refunded';

interface Order {
    id: string;
    clientId: string;
    clientName: string;
    clientPhone: string;
    storeId: string;
    storeName: string;
    delegateId?: string;
    delegateName?: string;
    status: OrderStatus;
    items: { productId: string; productName: string; quantity: number; price: number; }[];
    financials: { subtotal: number; deliveryFee: number; discount: number; tip: number; total: number; };
    payment: { method: PaymentMethod; status: PaymentStatus; receiptImageUrl?: string; };
    address: { description: string; latitude: number; longitude: number; };
    timestamps: { createdAt: Timestamp; confirmedAt?: Timestamp; dispatchedAt?: Timestamp; deliveredAt?: Timestamp; cancelledAt?: Timestamp; };
    cancellationReason?: string;
    rating?: { store: number; delegate: number; comment: string; };
}

const statusInfo: Record<OrderStatus, { text: string; icon: React.ElementType; color: string; ringColor: string; }> = {
    incoming: { text: 'طلب وارد', icon: Hourglass, color: 'text-amber-600', ringColor: 'ring-amber-500' },
    confirmed: { text: 'مؤكد', icon: Check, color: 'text-sky-600', ringColor: 'ring-sky-500' },
    preparing: { text: 'جاري التجهيز', icon: CookingPot, color: 'text-orange-600', ringColor: 'ring-orange-500' },
    dispatched: { text: 'مع المندوب', icon: Bike, color: 'text-indigo-600', ringColor: 'ring-indigo-500' },
    delivered: { text: 'مكتمل', icon: CheckCircle, color: 'text-green-600', ringColor: 'ring-green-500' },
    cancelled: { text: 'ملغي', icon: XCircle, color: 'text-red-600', ringColor: 'ring-red-500' },
};

const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
    const { text, icon: Icon, color } = statusInfo[status];
    return <Badge variant="outline" className={`gap-1.5 border-current ${color}`}><Icon className="h-3.5 w-3.5"/>{text}</Badge>;
};

const MapViewer = dynamic(() => import('@/components/user-location-viewer').then(mod => mod.UserLocationViewer), { ssr: false, loading: () => <div className="h-48 w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });

const CancellationDialog = ({ open, onOpenChange, onConfirm }: { open: boolean, onOpenChange: (open: boolean) => void, onConfirm: (reason: string) => void }) => {
    const [reason, setReason] = useState('');
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد إلغاء الطلب</AlertDialogTitle>
                    <AlertDialogDescription>الرجاء إدخال سبب الإلغاء. سيتم حفظ هذا السبب في السجلات.</AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea placeholder="مثال: لم يرد العميل على الاتصال..." value={reason} onChange={e => setReason(e.target.value)} />
                <AlertDialogFooter className="flex-row-reverse sm:justify-start">
                    <AlertDialogAction onClick={() => onConfirm(reason)} disabled={!reason}>تأكيد الإلغاء</AlertDialogAction>
                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default function OrdersPage() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("incoming");
    const [filters, setFilters] = useState({ searchTerm: '', storeId: 'all' });
    const { toast } = useToast();

    // Data Fetching
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'orders') : null, [firestore]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    const delegatesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'drivers_v2') : null, [firestore]);
    const { data: delegates, isLoading: isLoadingDelegates } = useCollection<Driver>(delegatesQuery);

    const activeDelegates = useMemo(() => (delegates || []).filter(d => d.is_active), [delegates]);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        let currentOrders: Order[];
        switch (activeTab) {
            case 'incoming': currentOrders = orders.filter(o => o.status === 'incoming'); break;
            case 'active': currentOrders = orders.filter(o => ['confirmed', 'preparing', 'dispatched'].includes(o.status)); break;
            case 'completed': currentOrders = orders.filter(o => o.status === 'delivered'); break;
            case 'cancelled': currentOrders = orders.filter(o => o.status === 'cancelled'); break;
            default: currentOrders = [];
        }
        
        return currentOrders.filter(o =>
            (o.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) || o.clientPhone.includes(filters.searchTerm)) &&
            (filters.storeId === 'all' || o.storeId === filters.storeId)
        ).sort((a, b) => b.timestamps.createdAt.toMillis() - a.timestamps.createdAt.toMillis());
    }, [orders, activeTab, filters]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const updateOrderStatus = (orderId: string, newStatus: OrderStatus, details: Record<string, any> = {}) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', orderId);
        
        const statusTimestampKey = `timestamps.${newStatus}At`;
        
        const dataToUpdate = {
            status: newStatus,
            [statusTimestampKey]: serverTimestamp(),
            ...details,
        };

        updateDocumentNonBlocking(orderRef, dataToUpdate);

        toast({ title: "تم تحديث حالة الطلب", description: `الطلب #${orderId.substring(0,6)} الآن "${statusInfo[newStatus].text}"` });
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? {...prev, status: newStatus, ...details} : null);
        }
    };
    
    const handleCancel = (order: Order) => {
        setSelectedOrder(order);
        setIsCancelOpen(true);
    };
    
    const confirmCancel = (reason: string) => {
        if (selectedOrder) {
            updateOrderStatus(selectedOrder.id, 'cancelled', { cancellationReason: reason });
        }
        setIsCancelOpen(false);
        setSelectedOrder(null);
    };

    const handleAssign = (order: Order) => {
        setSelectedOrder(order);
        setIsAssignOpen(true);
    };
    
    const confirmAssignDelegate = (delegate: Driver) => {
        if (selectedOrder) {
            updateOrderStatus(selectedOrder.id, 'preparing', { 
                delegateId: delegate.id,
                delegateName: delegate.name 
            });
        }
        setIsAssignOpen(false);
        setIsDetailsOpen(false);
        setSelectedOrder(null);
    };
    
    const getTimeSinceOrder = (date: Timestamp) => {
        return formatDistanceToNow(date.toDate(), { addSuffix: true, locale: ar });
    };
    
    const isLoading = isLoadingOrders || isLoadingDelegates;
    if (isLoading) {
        return <OrdersLoading />;
    }
    
    const uniqueStores = useMemo(() => {
        if (!orders) return [];
        const storeMap = new Map<string, string>();
        orders.forEach(order => {
            if (!storeMap.has(order.storeId)) {
                storeMap.set(order.storeId, order.storeName);
            }
        });
        return Array.from(storeMap.entries());
    }, [orders]);


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground">إدارة الطلبات</h1>
                    <p className="text-muted-foreground mt-1">متابعة جميع مراحل الطلبات من الاستلام حتى التسليم.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="incoming" className="gap-2"><Hourglass/>طلبات واردة</TabsTrigger>
                    <TabsTrigger value="active" className="gap-2"><Bike/>طلبات نشطة</TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2"><CheckCircle/>الأرشيف</TabsTrigger>
                    <TabsTrigger value="cancelled" className="gap-2"><XCircle/>الملغية</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input placeholder="ابحث برقم الطلب أو هاتف العميل..." value={filters.searchTerm} onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))} className="w-full sm:w-64" />
                                <Select value={filters.storeId} onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}>
                                    <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل المتاجر</SelectItem>
                                        {uniqueStores.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center">رقم الطلب</TableHead>
                                            <TableHead className="text-center">العميل</TableHead>
                                            <TableHead className="text-center">المتجر</TableHead>
                                            <TableHead className="text-center">الحالة</TableHead>
                                            <TableHead className="text-center">الإجمالي</TableHead>
                                            <TableHead className="text-center">الإجراء</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="text-center font-mono">{order.id.substring(0, 8)}</TableCell>
                                                <TableCell className="text-center">{order.clientName}</TableCell>
                                                <TableCell className="text-center">{order.storeName}</TableCell>
                                                <TableCell className="text-center"><OrderStatusBadge status={order.status} /></TableCell>
                                                <TableCell className="text-center font-semibold">{order.financials.total.toLocaleString()} ر.ي</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>عرض التفاصيل</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </Tabs>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-2xl font-bold">تفاصيل الطلب: {selectedOrder?.id.substring(0, 8)}</DialogTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {selectedOrder && <OrderStatusBadge status={selectedOrder.status} />}
                            {selectedOrder && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4"/>{getTimeSinceOrder(selectedOrder.timestamps.createdAt)}</span>}
                        </div>
                    </DialogHeader>
                    {selectedOrder && (
                    <div className="grid md:grid-cols-2 gap-6 flex-1 overflow-y-auto p-1 pr-4">
                        <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User/>بيانات العميل</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p><strong>الاسم:</strong> {selectedOrder.clientName}</p>
                                    <p className="flex items-center justify-between"><strong>الهاتف:</strong> <span dir="ltr">{selectedOrder.clientPhone}</span> <Button size="icon" variant="ghost" className="h-7 w-7"><Phone className="h-4 w-4"/></Button></p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin/>عنوان التوصيل</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                     <p className="text-sm">{selectedOrder.address.description}</p>
                                     <div className="h-48 rounded-lg overflow-hidden border">
                                        <MapViewer position={{ lat: selectedOrder.address.latitude, lng: selectedOrder.address.longitude }} />
                                     </div>
                                </CardContent>
                            </Card>
                             {selectedOrder.delegateId && <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bike/>بيانات المندوب</CardTitle></CardHeader>
                                <CardContent className="text-sm"><p><strong>الاسم:</strong> {selectedOrder.delegateName}</p></CardContent>
                            </Card>}
                             {selectedOrder.cancellationReason && <Card className="border-destructive/50 bg-destructive/10">
                                <CardHeader><CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle/>سبب الإلغاء</CardTitle></CardHeader>
                                <CardContent className="text-sm text-destructive font-semibold">{selectedOrder.cancellationReason}</CardContent>
                            </Card>}
                        </div>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store/>بيانات المتجر</CardTitle></CardHeader>
                                <CardContent className="text-sm"><p><strong>الاسم:</strong> {selectedOrder.storeName}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart/>محتويات الطلب</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>المنتج</TableHead><TableHead>الكمية</TableHead><TableHead>الإجمالي</TableHead></TableRow></TableHeader>
                                        <TableBody>{selectedOrder.items.map(item => (
                                            <TableRow key={item.productId}><TableCell>{item.productName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{(item.price * item.quantity).toLocaleString()}</TableCell></TableRow>
                                        ))}</TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BadgeDollarSign/>الملخص المالي</CardTitle></CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>قيمة المنتجات</span><span>{selectedOrder.financials.subtotal.toLocaleString()} ر.ي</span></div>
                                    <div className="flex justify-between"><span>رسوم التوصيل</span><span>{selectedOrder.financials.deliveryFee.toLocaleString()} ر.ي</span></div>
                                    {selectedOrder.financials.discount > 0 && <div className="flex justify-between text-destructive"><span>خصم</span><span>-{selectedOrder.financials.discount.toLocaleString()} ر.ي</span></div>}
                                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>الإجمالي</span><span>{selectedOrder.financials.total.toLocaleString()} ر.ي</span></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard/>الدفع</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p><strong>الطريقة:</strong> {selectedOrder.payment.method}</p>
                                    <p><strong>الحالة:</strong> {selectedOrder.payment.status}</p>
                                    {selectedOrder.payment.receiptImageUrl && <Image src={selectedOrder.payment.receiptImageUrl} alt="إيصال" width={100} height={100} className="rounded-md border mt-2"/>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    )}
                    <DialogFooter className="gap-2 flex-row-reverse sm:justify-start">
                        {selectedOrder?.status === 'incoming' && <>
                            <Button onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}><Check/> تأكيد الطلب</Button>
                            <Button variant="destructive" onClick={() => handleCancel(selectedOrder)}><X/> إلغاء</Button>
                        </>}
                         {selectedOrder?.status === 'confirmed' && <>
                            <Button onClick={() => handleAssign(selectedOrder)}>إسناد لمندوب</Button>
                            <Button variant="destructive" onClick={() => handleCancel(selectedOrder)}><X/> إلغاء</Button>
                        </>}
                         {selectedOrder?.status === 'preparing' && selectedOrder.delegateId && <>
                            <Button onClick={() => updateOrderStatus(selectedOrder.id, 'dispatched')}>إرسال للمندوب</Button>
                         </>}
                         {selectedOrder?.status === 'dispatched' && <>
                            <Button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}>تأكيد التسليم</Button>
                            <Button variant="outline">سحب الطلب من المندوب</Button>
                        </>}
                        <DialogClose asChild><Button type="button" variant="secondary">إغلاق</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إسناد الطلب لمندوب</DialogTitle>
                        <DialogDescription>اختر مندوبًا فعالاً لتوصيل هذا الطلب.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {activeDelegates.map(delegate => (
                            <Card key={delegate.id} className="p-3 flex justify-between items-center cursor-pointer hover:bg-muted" onClick={() => confirmAssignDelegate(delegate)}>
                                <div>
                                    <p className="font-semibold">{delegate.name}</p>
                                    <p className="text-sm text-muted-foreground">{delegate.phone}</p>
                                </div>
                                <UserCheck className="text-primary"/>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
            
            <CancellationDialog open={isCancelOpen} onOpenChange={setIsCancelOpen} onConfirm={confirmCancel} />

        </div>
    );
}
