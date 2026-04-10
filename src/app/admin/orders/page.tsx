'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Types
import type { Driver } from '../delegates/page';

const LocationMapViewer = dynamic(() => import('@/components/location-map-viewer').then(mod => mod.LocationMapViewer), { ssr: false, loading: () => <div className="h-48 w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div> });

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
    storeImage: string;
    storeImageHint: string;
    delegateId?: string;
    delegateName?: string;
    delegatePhotoUrl?: string;
    status: OrderStatus;
    items: { productId: string; productName: string; quantity: number; price: number; }[];
    financials: { subtotal: number; deliveryFee: number; discount: number; tip: number; total: number; };
    payment: { method: PaymentMethod; status: PaymentStatus; receiptImageUrl?: string; };
    address: { description: string; latitude: number; longitude: number; addressType?: 'home' | 'work' | 'other'; receiverName?: string; receiverPhone?: string; };
    timestamps: { createdAt: Date; confirmedAt?: Date; dispatchedAt?: Date; deliveredAt?: Date; cancelledAt?: Date; };
    cancellationReason?: string;
    notes?: string;
    rating?: { store: number; delegate: number; comment: string; };
    tipPayment?: { method: PaymentMethod; bankAccountId?: string; receiptNumber?: string; receiptImageUrl?: string; };
    delegatePosition?: { lat: number; lng: number };
}

// Mock Delegates
const mockDelegates: (Omit<Driver, 'id'> & {id: string, personalPhotoUrl: string, position: {lat: number, lng: number}} )[] = [
    { id: 'del1', name: 'أحمد علي', phone: '771111111', is_active: true, email: 'ahmed@example.com', address: 'a', idFrontPhotoUrl: '', personalPhotoUrl: 'https://picsum.photos/seed/del1/100/100', idType: 'card', position: { lat: 14.5450, lng: 49.1350 } },
    { id: 'del2', name: 'خالد صالح', phone: '772222222', is_active: true, email: 'khalid@example.com', address: 'a', idFrontPhotoUrl: '', personalPhotoUrl: 'https://picsum.photos/seed/del2/100/100', idType: 'card', position: { lat: 14.5390, lng: 49.1300 } },
    { id: 'del3', name: 'ياسر محمد', phone: '773333333', is_active: true, email: 'yasser@example.com', address: 'a', idFrontPhotoUrl: '', personalPhotoUrl: 'https://picsum.photos/seed/del3/100/100', idType: 'card', position: { lat: 14.5480, lng: 49.1290 } },
];
const mockDelegatesMap = mockDelegates.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});


// Mock Orders
const mockOrdersData: Omit<Order, 'storeImage' | 'storeImageHint'>[] = [
    {
        id: 'ORD001',
        clientId: 'C01', clientName: 'عبدالله الحضرمي', clientPhone: '777123456',
        storeId: 'S01', storeName: 'مطعم البيت الصنعاني',
        status: 'incoming',
        items: [{ productId: 'P01', productName: 'مندي دجاج', quantity: 2, price: 2500 }, {productId: 'P02', productName: 'بيبسي', quantity: 2, price: 300}],
        financials: { subtotal: 5600, deliveryFee: 500, discount: 0, tip: 0, total: 6100 },
        payment: { method: 'cash', status: 'pending' },
        address: { description: 'المكلا، حي الشرج، بجانب فندق رامادا', latitude: 14.5424, longitude: 49.1333, addressType: 'home' },
        timestamps: { createdAt: new Date(Date.now() - 5 * 60 * 1000) }, // 5 mins ago
        notes: 'الرجاء عدم استخدام الجرس، الطفل نائم.'
    },
    {
        id: 'ORD002',
        clientId: 'C02', clientName: 'فاطمة الكندي', clientPhone: '775654321',
        storeId: 'S02', storeName: 'سوبر ماركت العالمية',
        status: 'confirmed',
        items: [{ productId: 'P02', productName: 'حليب المراعي', quantity: 4, price: 800 }],
        financials: { subtotal: 3200, deliveryFee: 300, discount: 0, tip: 0, total: 3500 },
        payment: { method: 'wallet', status: 'paid' },
        address: { description: 'المكلا، الديس، خلف مول المكلا', latitude: 14.5333, longitude: 49.1412 },
        timestamps: { createdAt: new Date(Date.now() - 15 * 60 * 1000), confirmedAt: new Date(Date.now() - 10 * 60 * 1000) },
    },
    {
        id: 'ORD003',
        clientId: 'C03', clientName: 'سالم بن محفوظ', clientPhone: '777888999',
        storeId: 'S01', storeName: 'مطعم البيت الصنعاني',
        status: 'dispatched',
        delegateId: 'del1', delegateName: 'أحمد علي', delegatePhotoUrl: 'https://picsum.photos/seed/del1/100/100',
        items: [{ productId: 'P03', productName: 'فحسة', quantity: 1, price: 2800 }],
        financials: { subtotal: 2800, deliveryFee: 400, discount: 0, tip: 0, total: 3200 },
        payment: { method: 'cash', status: 'pending' },
        address: { description: 'فوة، حي المساكن، بالقرب من مسجد بن هامل', latitude: 14.5678, longitude: 49.1111 },
        timestamps: { createdAt: new Date(Date.now() - 45 * 60 * 1000), confirmedAt: new Date(Date.now() - 40 * 60 * 1000), dispatchedAt: new Date(Date.now() - 20 * 60 * 1000) },
        delegatePosition: { lat: 14.555, lng: 49.122 }
    },
    {
        id: 'ORD004',
        clientId: 'C04', clientName: 'نورة باوزير', clientPhone: '774445556',
        storeId: 'S03', storeName: 'صيدلية الشفاء',
        status: 'delivered',
        delegateId: 'del2', delegateName: 'خالد صالح', delegatePhotoUrl: 'https://picsum.photos/seed/del2/100/100',
        items: [{ productId: 'P04', productName: 'بندول اكسترا', quantity: 1, price: 500 }],
        financials: { subtotal: 500, deliveryFee: 200, discount: 0, tip: 500, total: 1200 },
        payment: { method: 'wallet', status: 'paid' },
        address: { description: 'المكلا، الشرج، مقابل بوابة الميناء', latitude: 14.5380, longitude: 49.1280 },
        timestamps: { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000), dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000), deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000) },
        rating: { store: 5, delegate: 4, comment: "خدمة ممتازة وسريعة، المندوب كان محترفًا جدًا ووصل قبل الوقت المتوقع." },
        tipPayment: { method: 'wallet' },
    },
    {
        id: 'ORD005',
        clientId: 'C01', clientName: 'عبدالله الحضرمي', clientPhone: '777123456',
        storeId: 'S02', storeName: 'سوبر ماركت العالمية',
        status: 'cancelled',
        items: [{ productId: 'P05', productName: 'شوكولاتة جالاكسي', quantity: 5, price: 300 }],
        financials: { subtotal: 1500, deliveryFee: 300, discount: 0, tip: 0, total: 1800 },
        payment: { method: 'cash', status: 'pending' },
        address: { description: 'المكلا، حي الشرج، بجانب فندق رامادا', latitude: 14.5424, longitude: 49.1333 },
        timestamps: { createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), cancelledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000) },
        cancellationReason: 'العميل لم يرد على الاتصال.',
    },
    {
        id: 'ORD006',
        clientId: 'C05', clientName: 'مكتبة الأندلس', clientPhone: '775555555',
        storeId: 'S02', storeName: 'سوبر ماركت العالمية',
        status: 'incoming',
        items: [{ productId: 'P05', productName: 'مياه معدنية', quantity: 10, price: 150 }],
        financials: { subtotal: 1500, deliveryFee: 300, discount: 0, tip: 0, total: 1800 },
        payment: { method: 'cash', status: 'pending' },
        address: { description: 'المكلا، فوة', latitude: 14.5678, longitude: 49.1111, addressType: 'other', receiverName: 'محمد علي', receiverPhone: '771231234'},
        timestamps: { createdAt: new Date(Date.now() - 2 * 60 * 1000) },
    },
].map(o => ({...o, storeImage: 'https://picsum.photos/seed/store-logo/100/100', storeImageHint: 'store logo'}));


const statusInfo: Record<OrderStatus, { text: string; icon: React.ElementType; color: string; ringColor: string; }> = {
    incoming: { text: 'طلب وارد', icon: Clock, color: 'text-amber-600', ringColor: 'ring-amber-500' },
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
    const [orders, setOrders] = useState<Order[]>(mockOrdersData);
    const [delegates] = useState(mockDelegates);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("incoming");
    const [filters, setFilters] = useState({ searchTerm: '', storeId: 'all', date: undefined as DateRange | undefined });
    const { toast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

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
            case 'incoming': currentOrders = orders.filter(o => o.status === 'incoming'); break;
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
        setOrders(prevOrders => prevOrders.map(o => {
            if (o.id === orderId) {
                const statusTimestampKey = `${newStatus}At` as const;
                return {
                    ...o,
                    status: newStatus,
                    timestamps: { ...o.timestamps, [statusTimestampKey]: new Date() },
                    ...details
                };
            }
            return o;
        }));

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
                delegateName: delegate.name,
                delegatePhotoUrl: (delegate as any).personalPhotoUrl,
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
        toast({
            title: "قيد التطوير",
            description: "سيتم إضافة ميزة تصدير البيانات قريباً.",
        });
    }
    
    if (isLoading) {
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
                                                <TableCell className="text-center font-semibold" dir="ltr">{order.financials.total.toLocaleString()}&nbsp;ر.ي</TableCell>
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
                            <div className="flex items-center gap-4 text-sm">
                                {selectedOrder && <OrderStatusBadge status={selectedOrder.status} />}
                            </div>
                            {selectedOrder && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-4 w-4"/>{getTimeSinceOrder(selectedOrder.timestamps.createdAt)}</span>}
                        </div>
                        <DialogTitle className="text-2xl font-bold text-right">تفاصيل الطلب: #{selectedOrder?.id.substring(0, 8)}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                    <div className="space-y-4 flex-1 overflow-y-auto p-1 pr-4">
                        {/* Group 1: Client & Delivery */}
                        <Card>
                           <CardHeader><CardTitle className="text-base flex items-center gap-2"><User/>بيانات العميل</CardTitle></CardHeader>
                           <CardContent className="text-sm space-y-2">
                               <p><strong>الاسم:</strong> {selectedOrder.clientName}</p>
                               <p className="flex items-center justify-between"><strong>الهاتف:</strong> <span dir="ltr">{selectedOrder.clientPhone}</span> <Button size="icon" variant="ghost" className="h-7 w-7"><Phone className="h-4 w-4"/></Button></p>
                               <p><strong>العنوان:</strong> {selectedOrder.address.description}</p>
                           </CardContent>
                        </Card>

                        {selectedOrder.address.addressType === 'other' && selectedOrder.address.receiverName && (
                           <Card>
                               <CardHeader><CardTitle className="text-base flex items-center gap-2"><Contact/>بيانات المستلم</CardTitle></CardHeader>
                               <CardContent className="text-sm space-y-2">
                                   <p><strong>الاسم:</strong> {selectedOrder.address.receiverName}</p>
                                   {selectedOrder.address.receiverPhone && <p><strong>الهاتف:</strong> {selectedOrder.address.receiverPhone}</p>}
                               </CardContent>
                           </Card>
                        )}

                        {selectedOrder.delegateId && (
                           <Card>
                           <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bike/>بيانات المندوب</CardTitle></CardHeader>
                           <CardContent className="text-sm space-y-2">
                               <div className="flex items-center gap-3">
                                   <Avatar>
                                       <AvatarImage src={selectedOrder.delegatePhotoUrl} alt={selectedOrder.delegateName}/>
                                       <AvatarFallback>{selectedOrder.delegateName?.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                   <div>
                                       <p><strong>الاسم:</strong> {selectedOrder.delegateName}</p>
                                       <p><strong>الهاتف:</strong> {(mockDelegatesMap as any)[selectedOrder.delegateId]?.phone}</p>
                                   </div>
                               </div>
                           </CardContent>
                       </Card>
                        )}
                        
                        <Card>
                           <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin/>موقع التوصيل</CardTitle></CardHeader>
                           <CardContent>
                               <LocationMapViewer
                                   mainPosition={{ lat: selectedOrder.address.latitude, lng: selectedOrder.address.longitude }}
                                   secondaryPosition={selectedOrder.status === 'dispatched' ? selectedOrder.delegatePosition : undefined}
                               />
                           </CardContent>
                        </Card>

                        <Separator className="my-4" />

                        {/* Group 2: Order & Financials */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Image src={selectedOrder.storeImage} alt={selectedOrder.storeName} width={40} height={40} className="rounded-md object-cover border" />
                                    <CardTitle className="text-base">{selectedOrder.storeName}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="w-[50px] text-center">الكمية</TableHead><TableHead className="w-[80px] text-center">السعر</TableHead><TableHead className="text-left w-[90px]">الإجمالي</TableHead></TableRow></TableHeader>
                                    <TableBody>{selectedOrder.items.map(item => (
                                        <TableRow key={item.productId}><TableCell className="font-medium">{item.productName}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell dir="ltr" className="text-center">{item.price.toLocaleString()}</TableCell><TableCell className="text-left" dir="ltr">{(item.price * item.quantity).toLocaleString()}</TableCell></TableRow>
                                    ))}</TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BadgeDollarSign/>الملخص المالي</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>إجمالي المنتجات</span><span dir="ltr">{selectedOrder.financials.subtotal.toLocaleString()}&nbsp;ر.ي</span></div>
                                {selectedOrder.financials.discount > 0 && <div className="flex justify-between text-destructive"><span>خصم</span><span dir="ltr">-{selectedOrder.financials.discount.toLocaleString()}&nbsp;ر.ي</span></div>}
                                <div className="flex justify-between"><span>رسوم التوصيل</span><span dir="ltr">{selectedOrder.financials.deliveryFee.toLocaleString()}&nbsp;ر.ي</span></div>
                                <Separator/>
                                <div className="flex justify-between font-bold text-base"><span>الإجمالي النهائي</span><span dir="ltr">{selectedOrder.financials.total.toLocaleString()}&nbsp;ر.ي</span></div>
                            </CardContent>
                        </Card>

                        <Card>
                           <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard/>الدفع</CardTitle></CardHeader>
                           <CardContent className="text-sm space-y-2">
                               <p><strong>الطريقة:</strong> {translatePaymentMethod(selectedOrder.payment.method)}</p>
                               <p><strong>الحالة:</strong> {translatePaymentStatus(selectedOrder.payment.status)}</p>
                               {selectedOrder.payment.receiptImageUrl && <Image src={selectedOrder.payment.receiptImageUrl} alt="إيصال" width={100} height={100} className="rounded-md border mt-2"/>}
                           </CardContent>
                        </Card>

                        {(selectedOrder.status === 'delivered' || selectedOrder.notes || selectedOrder.cancellationReason) && (
                            <Separator className="my-4" />
                        )}

                        {selectedOrder.status === 'delivered' && (
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star/>التقييم والإكرامية</CardTitle></CardHeader>
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
                                        <p><strong>الإكرامية:</strong> <span className="font-bold text-primary">{selectedOrder.financials.tip > 0 ? `${selectedOrder.financials.tip.toLocaleString()} ر.ي` : 'لا يوجد'}</span></p>
                                        {selectedOrder.financials.tip > 0 && <p><strong>طريقة الدفع:</strong> {selectedOrder.tipPayment ? translatePaymentMethod(selectedOrder.tipPayment.method) : 'غير محدد'}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {selectedOrder.notes && (
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText/>ملاحظات الطلب</CardTitle></CardHeader>
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
                                        <p className="text-sm text-muted-foreground">{delegate.phone}</p>
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

