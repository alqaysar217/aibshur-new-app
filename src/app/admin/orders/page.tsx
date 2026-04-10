'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';

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
    Package, Phone, Search, ShoppingCart, Star, Store, User, Wallet, X, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// MOCK DATA & TYPES
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

// Mock Data
const now = new Date();
const mockOrders: Order[] = [
    {
        id: 'ORD001', clientId: 'c1', clientName: 'علي محمد', clientPhone: '777111222',
        storeId: 's1', storeName: 'مطعم البيت الصنعاني', status: 'incoming',
        items: [{ productId: 'p1', productName: 'مندي دجاج', quantity: 2, price: 2500 }],
        financials: { subtotal: 5000, deliveryFee: 500, discount: 0, tip: 0, total: 5500 },
        payment: { method: 'cash', status: 'pending' },
        address: { description: 'بجانب متجر الورود، شارع الزبيري', latitude: 15.354, longitude: 44.206 },
        timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 10 * 60 * 1000)) },
    },
    {
        id: 'ORD002', clientId: 'c2', clientName: 'فاطمة حسن', clientPhone: '777333444',
        storeId: 's2', storeName: 'كافيتيريا مزاج', status: 'confirmed', delegateId: 'd1', delegateName: 'أحمد عبدالله',
        items: [{ productId: 'p2', productName: 'قهوة لاتيه', quantity: 1, price: 1200 }],
        financials: { subtotal: 1200, deliveryFee: 300, discount: 0, tip: 0, total: 1500 },
        payment: { method: 'wallet', status: 'paid' },
        address: { description: 'عمارة السلام، الدور الثالث', latitude: 15.360, longitude: 44.210 },
        timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 30 * 60 * 1000)), confirmedAt: Timestamp.fromDate(new Date(now.getTime() - 25 * 60 * 1000)) },
    },
    {
        id: 'ORD003', clientId: 'c3', clientName: 'خالد صالح', clientPhone: '777555666',
        storeId: 's1', storeName: 'مطعم البيت الصنعاني', status: 'dispatched', delegateId: 'd2', delegateName: 'محمد ناصر',
        items: [{ productId: 'p3', productName: 'فحسة', quantity: 1, price: 2800 }],
        financials: { subtotal: 2800, deliveryFee: 400, discount: 200, tip: 0, total: 3000 },
        payment: { method: 'bank_transfer', status: 'paid', receiptImageUrl: PlaceHolderImages.find(p => p.id === 'ad-banner-1')?.imageUrl },
        address: { description: 'مقابل حديقة السبعين', latitude: 15.340, longitude: 44.200 },
        timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 60 * 60 * 1000)), dispatchedAt: Timestamp.fromDate(new Date(now.getTime() - 15 * 60 * 1000)) },
    },
    {
        id: 'ORD004', clientId: 'c1', clientName: 'علي محمد', clientPhone: '777111222',
        storeId: 's3', storeName: 'صيدلية الشفاء', status: 'delivered', delegateId: 'd1', delegateName: 'أحمد عبدالله',
        items: [{ productId: 'p4', productName: 'بندول اكسترا', quantity: 3, price: 500 }],
        financials: { subtotal: 1500, deliveryFee: 200, discount: 0, tip: 200, total: 1900 },
        payment: { method: 'cash', status: 'paid' },
        address: { description: 'بجانب متجر الورود، شارع الزبيري', latitude: 15.354, longitude: 44.206 },
        timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), deliveredAt: Timestamp.fromDate(new Date(now.getTime() - (2 * 24 * 60 - 1) * 60 * 1000))},
        rating: { store: 5, delegate: 4, comment: 'خدمة ممتازة وتوصيل سريع' }
    },
    {
        id: 'ORD005', clientId: 'c4', clientName: 'سارة أحمد', clientPhone: '777888999',
        storeId: 's2', storeName: 'كافيتيريا مزاج', status: 'cancelled',
        items: [{ productId: 'p5', productName: 'كيكة العسل', quantity: 1, price: 1500 }],
        financials: { subtotal: 1500, deliveryFee: 300, discount: 0, tip: 0, total: 1800 },
        payment: { method: 'cash', status: 'pending' },
        address: { description: 'خلف فندق شهران', latitude: 15.365, longitude: 44.215 },
        timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), cancelledAt: Timestamp.fromDate(new Date(now.getTime() - (3 * 24 * 60 - 2) * 60 * 1000)) },
        cancellationReason: 'العميل لم يرد على الاتصال',
    },
];

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


export default function OrdersPage() {
    const [orders, setOrders] = useState(mockOrders);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("incoming");
    const [filters, setFilters] = useState({ searchTerm: '', storeId: 'all', status: 'all' });
    const { toast } = useToast();

    const filteredOrders = useMemo(() => {
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
            (filters.storeId === 'all' || o.storeId === filters.storeId) &&
            (filters.status === 'all' || o.status === filters.status)
        );
    }, [orders, activeTab, filters]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    };
    
    // A mock function to simulate updating order status
    const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast({ title: "تم تحديث حالة الطلب", description: `الطلب #${orderId} الآن "${statusInfo[newStatus].text}"` });
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? {...prev, status: newStatus} : null);
        }
    };
    
    // Time since order was created
    const getTimeSinceOrder = (date: Timestamp) => {
        const minutes = differenceInMinutes(new Date(), date.toDate());
        if (minutes < 60) return `${minutes} د`;
        const hours = Math.floor(minutes / 60);
        return `${hours} س`;
    };

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
                                        {[...new Set(mockOrders.map(o => o.storeId))].map(storeId => <SelectItem key={storeId} value={storeId}>{mockOrders.find(o => o.storeId === storeId)?.storeName}</SelectItem>)}
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
                                                <TableCell className="text-center font-mono">{order.id}</TableCell>
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

            {/* Order Details Dialog */}
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-2xl font-bold">تفاصيل الطلب: {selectedOrder?.id}</DialogTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {selectedOrder && <OrderStatusBadge status={selectedOrder.status} />}
                            {selectedOrder && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4"/>منذ {getTimeSinceOrder(selectedOrder.timestamps.createdAt)}</span>}
                        </div>
                    </DialogHeader>
                    {selectedOrder && (
                    <div className="grid md:grid-cols-2 gap-6 flex-1 overflow-y-auto p-1 pr-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User/>بيانات العميل</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p><strong>الاسم:</strong> {selectedOrder.clientName}</p>
                                    <p className="flex items-center justify-between"><strong>الهاتف:</strong> <span>{selectedOrder.clientPhone}</span> <Button size="icon" variant="ghost" className="h-7 w-7"><Phone className="h-4 w-4"/></Button></p>
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
                                <CardContent className="text-sm space-y-2">
                                    <p><strong>الاسم:</strong> {selectedOrder.delegateName}</p>
                                    <div className="h-48 rounded-lg overflow-hidden border">
                                        <MapViewer position={{ lat: 15.35, lng: 44.20 }} />
                                     </div>
                                </CardContent>
                            </Card>}
                        </div>

                        {/* Right Column */}
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
                            <Button variant="destructive" onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}><X/> إلغاء</Button>
                        </>}
                         {selectedOrder?.status === 'confirmed' && <>
                            <Button>إسناد لمندوب</Button>
                            <Button variant="destructive" onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}><X/> إلغاء</Button>
                        </>}
                         {selectedOrder?.status === 'dispatched' && <>
                            <Button variant="outline">سحب الطلب من المندوب</Button>
                        </>}
                        <DialogClose asChild><Button type="button" variant="secondary">إغلاق</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
