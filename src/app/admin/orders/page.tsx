'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Firebase and Data
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { 
    AlertTriangle, BadgeDollarSign, Bike, Building, Calendar as CalendarIcon, Check, CheckCircle, ChevronDown, Circle, Clock, Contact, CookingPot,
    CreditCard, FileDown, FileText, HandCoins, Hourglass, Link as LinkIcon, ListFilter, Mail, MapPin, MessageCircle, MoreVertical,
    Package, Phone, Search, ShoppingCart, Star, Store, User, UserCheck, Wallet, X, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge, type OrderStatus } from '@/components/order-status-badge';

// Types
import type { Driver } from '../delegates/page';
import type { Store as StoreType } from '../stores/page';

const LocationMapViewer = dynamic(() => import('@/components/location-map-viewer').then(mod => mod.LocationMapViewer), { ssr: false, loading: () => <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });

type PaymentMethod = 'cash' | 'wallet' | 'bank_transfer';
type PaymentStatus = 'pending' | 'paid' | 'refunded';

// This is the shape of the data coming directly from Firestore
type OrderFS = {
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
    address: { description: string; latitude: number; longitude: number; addressType?: 'home' | 'work' | 'other'; receiverName?: string; receiverPhone?: string; };
    timestamps: { createdAt: Timestamp; confirmedAt?: Timestamp; dispatchedAt?: Timestamp; deliveredAt?: Timestamp; cancelledAt?: Timestamp; scheduledDeliveryTime?: Timestamp; };
    cancellationReason?: string;
    notes?: string;
    rating?: { store: number; delegate: number; comment: string; };
    tipPayment?: { method: PaymentMethod; bankAccountId?: string; receiptNumber?: string; receiptImageUrl?: string; };
}

// This is the shape of the data after we process it for the UI
export interface Order extends Omit<OrderFS, 'timestamps'> {
    storeImage?: string;
    delegatePhotoUrl?: string;
    delegatePosition?: { lat: number; lng: number };
    timestamps: { createdAt: Date; confirmedAt?: Date; dispatchedAt?: Date; deliveredAt?: Date; cancelledAt?: Date; scheduledDeliveryTime?: Date; };
}


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
    const [filters, setFilters] = useState({ searchTerm: '', storeId: 'all', date: undefined as DateRange | undefined });
    const { toast } = useToast();
    const firestore = useFirestore();

    const { data: ordersFS, isLoading: isLoadingOrders } = useCollection<OrderFS>(useMemoFirebase(() => firestore ? collection(firestore, 'orders') : null, [firestore]));
    const { data: delegates, isLoading: isLoadingDelegates } = useCollection<Driver>(useMemoFirebase(() => firestore ? collection(firestore, 'drivers_v2') : null, [firestore]));
    const { data: stores, isLoading: isLoadingStores } = useCollection<StoreType>(useMemoFirebase(() => firestore ? collection(firestore, 'stores') : null, [firestore]));

    const delegatesMap = useMemo(() => delegates?.reduce((acc, d) => ({...acc, [d.id]: d}), {}) || {}, [delegates]);
    const storesMap = useMemo(() => stores?.reduce((acc, s) => ({...acc, [s.id]: s}), {}) || {}, [stores]);
    
    const orders: Order[] = useMemo(() => {
        if (!ordersFS) return [];
        return ordersFS.map(orderFS => {
            const store = storesMap[orderFS.storeId];
            const delegate = delegatesMap[orderFS.delegateId || ''];

            const timestamps: Order['timestamps'] = { createdAt: orderFS.timestamps.createdAt.toDate() };
            if (orderFS.timestamps.confirmedAt) timestamps.confirmedAt = orderFS.timestamps.confirmedAt.toDate();
            if (orderFS.timestamps.dispatchedAt) timestamps.dispatchedAt = orderFS.timestamps.dispatchedAt.toDate();
            if (orderFS.timestamps.deliveredAt) timestamps.deliveredAt = orderFS.timestamps.deliveredAt.toDate();
            if (orderFS.timestamps.cancelledAt) timestamps.cancelledAt = orderFS.timestamps.cancelledAt.toDate();
            if (orderFS.timestamps.scheduledDeliveryTime) timestamps.scheduledDeliveryTime = orderFS.timestamps.scheduledDeliveryTime.toDate();
            
            return {
                ...orderFS,
                timestamps,
                storeImage: store?.imageUrl,
                delegatePhotoUrl: delegate?.personalPhotoUrl,
                delegatePosition: (delegate?.latitude && delegate?.longitude) ? { lat: delegate.latitude, lng: delegate.longitude } : undefined,
            }
        });
    }, [ordersFS, storesMap, delegatesMap]);


    const activeDelegates = useMemo(() => (delegates || []).filter(d => d.is_active), [delegates]);

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
    
    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        let currentOrders: Order[];
        switch (activeTab) {
            case 'incoming': currentOrders = orders.filter(o => o.status === 'incoming' && !o.timestamps.scheduledDeliveryTime); break;
            case 'active': currentOrders = orders.filter(o => ['confirmed', 'preparing', 'dispatched'].includes(o.status)); break;
            case 'completed': currentOrders = orders.filter(o => o.status === 'delivered'); break;
            case 'cancelled': currentOrders = orders.filter(o => o.status === 'cancelled'); break;
            default: currentOrders = [];
        }
        
        return currentOrders.filter(o => {
            const matchesSearch = (o.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) || o.clientPhone.includes(filters.searchTerm));
            const matchesStore = (filters.storeId === 'all' || o.storeId === filters.storeId);
            const orderDate = o.timestamps.createdAt;
            const matchesDate = !filters.date || (filters.date.from && orderDate >= filters.date.from && (!filters.date.to || orderDate <= filters.date.to));
            return matchesSearch && matchesStore && matchesDate;
        }).sort((a, b) => b.timestamps.createdAt.getTime() - a.timestamps.createdAt.getTime());

    }, [orders, activeTab, filters]);


    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };
    
    const updateOrderStatus = (orderId: string, newStatus: OrderStatus, details: Record<string, any> = {}) => {
        if (!firestore) return;
        const statusTimestampKey = `${newStatus}At`;
        const payload = {
            status: newStatus,
            [`timestamps.${statusTimestampKey}`]: serverTimestamp(),
            ...details,
        };
        updateDocumentNonBlocking(doc(firestore, 'orders', orderId), payload);
        toast({ title: "تم تحديث حالة الطلب" });
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
                delegateName: delegate.name,
            });
        }
        setIsAssignOpen(false);
        setIsDetailsOpen(false);
        setSelectedOrder(null);
    };
    
    const getTimeSinceOrder = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    };

    const translatePaymentMethod = (method: PaymentMethod) => {
        const map = { cash: 'نقداً عند الاستلام', wallet: 'محفظة إلكترونية', bank_transfer: 'تحويل بنكي' };
        return map[method] || method;
    }
    const translatePaymentStatus = (status: PaymentStatus) => {
        const map = { pending: 'قيد الانتظار', paid: 'مدفوع', refunded: 'مسترجع' };
        return map[status] || status;
    }

    const generateConfirmationMessage = (order: Order) => {
        const productLines = order.items.map(item => `- ${item.productName} (x${item.quantity})`).join('\n');
        return encodeURIComponent(
    `مرحباً ${order.clientName}،
    لدينا طلب جديد لك من متجر ${order.storeName} برقم #${order.id.substring(0, 6)}.
    التفاصيل:
    ${productLines}
    الإجمالي: ${order.financials.total.toLocaleString('en-US')} ر.ي
    هل تؤكد الطلب؟`
        );
    };
    
    const handleSendWhatsApp = (order: Order) => {
        const message = generateConfirmationMessage(order);
        window.open(`https://wa.me/${order.clientPhone}?text=${message}`, '_blank');
    }
    
    const handleSendSMS = (order: Order) => {
        const message = generateConfirmationMessage(order);
        window.open(`sms:${order.clientPhone}?body=${message}`, '_blank');
    }
    
     const handleExport = () => {
        if (!filteredOrders.length) {
            toast({ title: "لا توجد بيانات للتصدير", description: "قم بتغيير الفلاتر للحصول على نتائج." });
            return;
        }

        const headers = ["ID", "Client Name", "Client Phone", "Store Name", "Status", "Total", "Created At", "Items"];
        const csvRows = [headers.join(",")];

        for (const order of filteredOrders) {
            const row = [
                order.id,
                `"${order.clientName}"`,
                order.clientPhone,
                `"${order.storeName}"`,
                order.status,
                order.financials.total,
                order.timestamps.createdAt.toISOString(),
                `"${order.items.map(i => `${i.productName} (x${i.quantity})`).join("; ")}"`
            ];
            csvRows.push(row.join(","));
        }

        const csvString = csvRows.join("\n");
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "تم بدء التصدير", description: `يتم تنزيل ${filteredOrders.length} طلب.` });
    };
    
    if (isLoadingOrders || isLoadingDelegates || isLoadingStores) {
        return <OrdersLoading />;
    }


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
                    <TabsTrigger value="incoming" className="gap-2"><Clock/>طلبات واردة</TabsTrigger>
                    <TabsTrigger value="active" className="gap-2"><Bike/>طلبات نشطة</TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2"><CheckCircle/>الأرشيف</TabsTrigger>
                    <TabsTrigger value="cancelled" className="gap-2"><XCircle/>الملغية</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                <Input placeholder="ابحث برقم الطلب أو هاتف العميل..." value={filters.searchTerm} onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))} className="w-full sm:w-auto sm:flex-grow" />
                                <Select value={filters.storeId} onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}>
                                    <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل المتاجر</SelectItem>
                                        {uniqueStores.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                          "w-full sm:w-64 justify-start text-left font-normal",
                                          !filters.date && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {filters.date?.from ? (
                                          filters.date.to ? (
                                            <>
                                              {format(filters.date.from, "LLL dd, y")} -{" "}
                                              {format(filters.date.to, "LLL dd, y")}
                                            </>
                                          ) : (
                                            format(filters.date.from, "LLL dd, y")
                                          )
                                        ) : (
                                          <span>اختر تاريخ</span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={filters.date?.from}
                                        selected={filters.date}
                                        onSelect={(date) => setFilters(f => ({...f, date}))}
                                        numberOfMonths={2}
                                      />
                                    </PopoverContent>
                                </Popover>
                                <Button onClick={handleExport} variant="outline"><FileDown/> تصدير</Button>
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
                                                <TableCell className="text-center font-semibold" dir="ltr">{order.financials.total.toLocaleString('en-US')}&nbsp;ر.ي</TableCell>
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
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <div className="flex justify-between items-start">
                            <DialogTitle className="text-2xl font-bold text-right">تفاصيل الطلب: #{selectedOrder?.id.substring(0, 8)}</DialogTitle>
                        </div>
                        <div className="flex justify-start items-center gap-4 text-sm pt-1">
                            {selectedOrder && <OrderStatusBadge status={selectedOrder.status} />}
                            {selectedOrder && <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4"/>{getTimeSinceOrder(selectedOrder.timestamps.createdAt)}</span>}
                        </div>
                    </DialogHeader>
                    {selectedOrder && (
                    <div className="space-y-4 flex-1 overflow-y-auto p-1 pr-4">
                        
                        <Card>
                           <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5 text-primary"/>بيانات العميل</CardTitle></CardHeader>
                           <CardContent className="text-sm space-y-3">
                               <div className="flex items-center gap-2">
                                   <User className="h-4 w-4 text-muted-foreground"/>
                                   <span><strong>الاسم:</strong> {selectedOrder.clientName}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                   <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground"/>
                                    <span><strong>الهاتف:</strong></span>
                                   </div>
                                   <span dir="ltr">{selectedOrder.clientPhone}</span>
                               </div>
                               <div className="flex items-start gap-2">
                                   <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                   <span><strong>العنوان:</strong> {selectedOrder.address.description}</span>
                               </div>
                           </CardContent>
                        </Card>

                        {selectedOrder.address.addressType === 'other' && selectedOrder.address.receiverName && (
                           <Card>
                               <CardHeader><CardTitle className="text-base flex items-center gap-2"><Contact className="h-5 w-5 text-primary"/>بيانات المستلم</CardTitle></CardHeader>
                               <CardContent className="text-sm space-y-3">
                                   <div className="flex items-center gap-2">
                                       <User className="h-4 w-4 text-muted-foreground"/>
                                       <span><strong>الاسم:</strong> {selectedOrder.address.receiverName}</span>
                                   </div>
                                   {selectedOrder.address.receiverPhone && 
                                   <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                           <Phone className="h-4 w-4 text-muted-foreground"/>
                                           <span><strong>الهاتف:</strong></span>
                                        </div>
                                       <span dir="ltr">{selectedOrder.address.receiverPhone}</span>
                                    </div>}
                               </CardContent>
                           </Card>
                        )}

                        {selectedOrder.delegateId && (
                           <Card>
                               <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bike className="h-5 w-5 text-primary"/>بيانات المندوب</CardTitle></CardHeader>
                               <CardContent className="text-sm">
                                   <div className="flex items-center gap-3">
                                       <Avatar>
                                           <AvatarImage src={selectedOrder.delegatePhotoUrl} alt={selectedOrder.delegateName}/>
                                           <AvatarFallback>{selectedOrder.delegateName?.charAt(0)}</AvatarFallback>
                                       </Avatar>
                                       <div className="flex-grow space-y-2">
                                           <div className="flex items-center gap-2">
                                              <User className="h-4 w-4 text-muted-foreground"/>
                                              <p><strong>الاسم:</strong> {selectedOrder.delegateName}</p>
                                            </div>
                                           <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground"/>
                                                    <p><strong>الهاتف:</strong></p>
                                                </div>
                                                <span dir="ltr">{(delegatesMap as any)[selectedOrder.delegateId]?.phone}</span>
                                            </div>
                                       </div>
                                   </div>
                               </CardContent>
                           </Card>
                        )}
                        
                        <Card>
                           <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/>موقع التوصيل</CardTitle></CardHeader>
                           <CardContent>
                               <LocationMapViewer
                                   mainPosition={{ lat: selectedOrder.address.latitude, lng: selectedOrder.address.longitude }}
                                   secondaryPosition={selectedOrder.status === 'dispatched' ? selectedOrder.delegatePosition : undefined}
                               />
                           </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Image src={selectedOrder.storeImage || '/logo-app.png'} alt={selectedOrder.storeName} width={40} height={40} className="rounded-md object-cover border" />
                                    <CardTitle className="text-base">{selectedOrder.storeName}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="w-[50px] text-center">الكمية</TableHead><TableHead className="w-[80px] text-center">السعر</TableHead><TableHead className="text-left w-[90px]">الإجمالي</TableHead></TableRow></TableHeader>
                                    <TableBody>{selectedOrder.items.map(item => (
                                        <TableRow key={item.productId}><TableCell className="font-medium">{item.productName}</TableCell><TableCell className="text-center">{item.quantity.toLocaleString('en-US')}</TableCell><TableCell dir="ltr" className="text-center">{item.price.toLocaleString('en-US')}</TableCell><TableCell className="text-left" dir="ltr">{(item.price * item.quantity).toLocaleString('en-US')}</TableCell></TableRow>
                                    ))}</TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BadgeDollarSign className="h-5 w-5 text-primary"/>الملخص المالي</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>إجمالي المنتجات</span><span dir="ltr">{selectedOrder.financials.subtotal.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                                {selectedOrder.financials.discount > 0 && <div className="flex justify-between text-destructive"><span>خصم</span><span dir="ltr">-{selectedOrder.financials.discount.toLocaleString('en-US')}&nbsp;ر.ي</span></div>}
                                <div className="flex justify-between"><span>رسوم التوصيل</span><span dir="ltr">{selectedOrder.financials.deliveryFee.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                                <Separator/>
                                <div className="flex justify-between font-bold text-base"><span>الإجمالي النهائي</span><span dir="ltr">{selectedOrder.financials.total.toLocaleString('en-US')}&nbsp;ر.ي</span></div>
                            </CardContent>
                        </Card>

                        <Card>
                           <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary"/>الدفع</CardTitle></CardHeader>
                           <CardContent className="text-sm space-y-2">
                               <p><strong>الطريقة:</strong> {translatePaymentMethod(selectedOrder.payment.method)}</p>
                               <p><strong>الحالة:</strong> {translatePaymentStatus(selectedOrder.payment.status)}</p>
                               {selectedOrder.payment.receiptImageUrl && <Image src={selectedOrder.payment.receiptImageUrl} alt="إيصال" width={100} height={100} className="rounded-md border mt-2"/>}
                           </CardContent>
                        </Card>
                        
                        {selectedOrder.status === 'delivered' && (
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-5 w-5 text-primary"/>التقييم والإكرامية</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {selectedOrder.rating ? (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <span>تقييم المندوب:</span>
                                            <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-5 w-5", i < selectedOrder.rating!.delegate ? "text-amber-400 fill-amber-400" : "text-gray-300")}/>)}</div>
                                        </div>
                                        <p className="border-t pt-2 text-muted-foreground">"{selectedOrder.rating.comment}"</p>
                                    </>
                                    ) : <p className="text-muted-foreground">لم يتم تقييم الطلب بعد.</p>}
                                    
                                    <div className="border-t pt-3 mt-3">
                                        <p><strong>الإكرامية:</strong> <span className="font-bold text-primary">{selectedOrder.financials.tip > 0 ? `${selectedOrder.financials.tip.toLocaleString('en-US')} ر.ي` : 'لا يوجد'}</span></p>
                                        {selectedOrder.financials.tip > 0 && <p><strong>طريقة الدفع:</strong> {selectedOrder.tipPayment ? translatePaymentMethod(selectedOrder.tipPayment.method) : 'غير محدد'}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {selectedOrder.notes && (
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>ملاحظات الطلب</CardTitle></CardHeader>
                                <CardContent className="text-sm"><p>{selectedOrder.notes}</p></CardContent>
                            </Card>
                        )}

                        {selectedOrder.cancellationReason && (
                            <Card className="border-destructive/50 bg-destructive/10">
                               <CardHeader><CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle/>سبب الإلغاء</CardTitle></CardHeader>
                               <CardContent className="text-sm text-destructive font-semibold">{selectedOrder.cancellationReason}</CardContent>
                           </Card>
                        )}
                    </div>
                    )}
                    <DialogFooter className="gap-2 flex-row-reverse sm:justify-start">
                        {selectedOrder?.status === 'incoming' && <>
                             <Button onClick={() => handleSendWhatsApp(selectedOrder)} variant="outline" className="text-green-600 border-green-500 hover:bg-green-50 hover:text-green-700"><MessageCircle/> واتساب</Button>
                             <Button onClick={() => handleSendSMS(selectedOrder)} variant="outline"><Mail/> SMS</Button>
                             <div className="border-r mx-2 h-8 self-center"></div>
                             <Button onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}><Check/> تأكيد نهائي</Button>
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
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={delegate.personalPhotoUrl} alt={delegate.name}/>
                                        <AvatarFallback>{delegate.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{delegate.name}</p>
                                        <p className="text-sm text-muted-foreground" dir="ltr">{delegate.phone}</p>
                                    </div>
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
