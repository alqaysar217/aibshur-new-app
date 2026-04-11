import { Firestore, doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';

// --- MOCK DATA ---
// This data will be used to populate the database when you click "Seed Database" in the settings.

const mockFaqs = [
    { id: 'FAQ1', category: 'الحساب', question: 'كيف يمكنني تغيير رقم هاتفي؟', answer: 'لتغيير رقم هاتفك، يرجى الذهاب إلى صفحة "حسابي"، ثم الضغط على "تعديل الملف الشخصي" وإدخال الرقم الجديد. ستحتاج إلى تأكيد الرقم الجديد عبر رمز يتم إرساله إليك.' },
    { id: 'FAQ2', category: 'الدفع', question: 'ما هي طرق الدفع المتاحة؟', answer: 'نحن ندعم الدفع نقدًا عند الاستلام، والدفع عبر المحافظ الإلكترونية، وكذلك التحويلات البنكية المباشرة.' },
    { id: 'FAQ3', category: 'الطلبات', question: 'كيف يمكنني تتبع طلبي؟', answer: 'بعد تأكيد طلبك، يمكنك تتبعه مباشرة من قسم "طلباتي" في التطبيق. سترى حالة الطلب الحالية وموقع المندوب عندما يكون في الطريق إليك.' },
];

const mockTickets = [
    { id: 'TICKET-001', subject: 'مشكلة في تسجيل الدخول', userName: 'أحمد علي', userEmail: 'ahmed@example.com', priority: 'high', status: 'open', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), description: 'لا أستطيع تسجيل الدخول إلى حسابي، تظهر لي رسالة خطأ في كلمة المرور مع أنها صحيحة.', replies: [] },
    { id: 'TICKET-002', subject: 'تأخر وصول الطلب #123', userName: 'فاطمة حسن', userEmail: 'fatima@example.com', priority: 'medium', status: 'in_progress', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: 'طلبت من مطعم البيت الصنعاني ولم يصل الطلب بعد، مع أنه تجاوز الوقت المتوقع.', replies: [{ authorName: 'فريق الدعم', message: 'مرحباً فاطمة، نعتذر عن التأخير. جاري المتابعة مع المندوب وسنعود إليك بالتحديثات.', createdAt: Timestamp.fromDate(new Date(Date.now() - 23 * 60 * 60 * 1000)) }] },
    { id: 'TICKET-003', subject: 'استفسار عن كوبون خصم', userName: 'خالد صالح', userEmail: 'khalid@example.com', priority: 'low', status: 'closed', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: 'هل يمكن استخدام كوبون "WELCOME10" أكثر من مرة؟', replies: [{ authorName: 'فريق الدعم', message: 'مرحباً خالد، كوبون الترحيب يستخدم لمرة واحدة فقط لكل حساب. شكراً لتفهمك.', createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) }] },
];

const mockTemplates = [
    { id: 'accepted', title: 'عند قبول الطلب', icon: 'Package', template: 'تم قبول طلبك #{orderId} من متجر {storeName} وهو قيد التجهيز.', isActive: true },
    { id: 'dispatched', title: 'عند إرسال الطلب مع المندوب', icon: 'Bike', template: 'مندوبنا {delegateName} في الطريق إليك لتسليم طلبك!', isActive: true },
];

const mockBroadcasts = [
    { id: 'log1', readRate: '65%', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'promotion', title: 'خصم 20% على مطاعم محددة', body: 'استمتع بخصم كبير على وجباتك المفضلة!', targetType: 'province', targetValue: 'prov1', link: '/stores/1' },
    { id: 'log2', readRate: '80%', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), type: 'system', title: 'تحديث جديد متوفر!', body: 'لقد قمنا بتحسينات وإضافة مزايا جديدة. قم بالتحديث الآن.', targetType: 'all' },
];

const mockAdminNotifications = [
  { id: 'n_new_order', type: 'order_status', title: 'طلب جديد وارد!', body: 'وصل طلب جديد من العميل "محمد عبدالله". الرجاء المراجعة.', timestamp: new Date(), isRead: false, link: '/admin/orders' },
  { id: 'n_new_delegate', type: 'system', title: 'طلب انضمام مندوب جديد', body: 'قدم "علي صالح" طلبًا للانضمام كـ مندوب.', timestamp: new Date(new Date().getTime() - 1 * 60 * 60 * 1000), isRead: false, link: '/admin/delegates' },
  { id: 'n2', type: 'promotion', title: 'حملة تبرعات جديدة', body: 'تم إطلاق حملة تبرعات "سقيا الماء".', timestamp: new Date(new Date().getTime() - 5 * 60 * 60 * 1000), isRead: true, link: '/admin/donations' },
];

const defaultSettings = {
    appName: 'تطبيق أبشر',
    supportEmail: 'support@absher.com',
    supportPhone: '+967 777 777 777',
    currencySymbol: 'ر.ي',
    primaryColor: '#1FAF9A',
    appLogo: '/logo.png',
    defaultDeliveryFee: 500,
    maintenanceMode: false,
    enableEmailNotifications: true,
    enablePushNotifications: true,
};

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFuture = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);


const mockProvinces = [
    { id: 'prov1', province_name: 'أمانة العاصمة', customer_service_number: '01-555-555', whatsapp_number: '777555555', is_active: true, createdAt: Timestamp.fromDate(now), updatedAt: Timestamp.fromDate(now) },
    { id: 'prov2', province_name: 'حضرموت', customer_service_number: '05-333-333', whatsapp_number: '777333333', is_active: true, createdAt: Timestamp.fromDate(now), updatedAt: Timestamp.fromDate(now) }
];

const mockCategories = [
    { id: 'cat1', name: 'مطاعم', image: 'https://picsum.photos/seed/cat-resto/128/128', is_active: true },
    { id: 'cat2', name: 'سوبر ماركت', image: 'https://picsum.photos/seed/cat-market/128/128', is_active: true }
];

const mockStores = [
    { id: 'store1', name: 'مطعم البيت الصنعاني', imageUrl: 'https://picsum.photos/seed/store1/100/100', rating: 4.5, deliveryTime: '25-35', provinceId: 'prov1', categoryId: 'cat1', latitude: 15.352, longitude: 44.206, is_active: true, workingHours: [] },
    { id: 'store2', name: 'سوبر ماركت العالمية', imageUrl: 'https://picsum.photos/seed/store2/100/100', rating: 4.8, deliveryTime: '15-25', provinceId: 'prov1', categoryId: 'cat2', latitude: 15.36, longitude: 44.19, is_active: true, workingHours: [] },
    { id: 'store3', name: 'حضرموت للمأكولات', imageUrl: 'https://picsum.photos/seed/store3/100/100', rating: 4.7, deliveryTime: '30-45', provinceId: 'prov2', categoryId: 'cat1', latitude: 14.54, longitude: 49.13, is_active: true, workingHours: [] },
];

const mockProducts = [
    { id: 'prod1', name: 'مندي دجاج', description: 'دجاج مندي مع أرز', storeId: 'store1', categoryId: 'cat1', mainImageUrl: 'https://picsum.photos/seed/prod-mandi/200/200', hasVariants: false, basePrice: 2500, is_active: true, rating: 4.8 },
    { id: 'prod2', name: 'عقدة لحم', description: 'عقدة لحم بلدي', storeId: 'store1', categoryId: 'cat1', mainImageUrl: 'https://picsum.photos/seed/prod-ogda/200/200', hasVariants: true, variants: [{ name: 'صغير', price: 3000 }, { name: 'كبير', price: 5000 }], is_active: true, rating: 4.9 },
    { id: 'prod3', name: 'ماء معدني', description: 'ماء صحي', storeId: 'store2', categoryId: 'cat2', mainImageUrl: 'https://picsum.photos/seed/prod-water/200/200', hasVariants: false, basePrice: 150, is_active: true, rating: 4.5 },
    { id: 'prod4', name: 'مضغوط لحم', description: 'لحم مضغوط مع أرز', storeId: 'store3', categoryId: 'cat1', mainImageUrl: 'https://picsum.photos/seed/prod-madghout/200/200', hasVariants: false, basePrice: 4000, is_active: true, rating: 4.9 },
    { id: 'prod5', name: 'شاورما دجاج', description: 'ساندويتش شاورما', storeId: 'store1', categoryId: 'cat1', mainImageUrl: 'https://picsum.photos/seed/prod-shawarma/200/200', hasVariants: false, basePrice: 800, is_active: true, rating: 4.6 },
    { id: 'prod6', name: 'لبن', description: 'لبن طازج', storeId: 'store2', categoryId: 'cat2', mainImageUrl: 'https://picsum.photos/seed/prod-laban/200/200', hasVariants: false, basePrice: 300, is_active: true, rating: 4.7 },
    { id: 'prod7', name: 'مندي لحم', description: 'مندي لحم مع أرز', storeId: 'store3', categoryId: 'cat1', mainImageUrl: 'https://picsum.photos/seed/prod-mandi-meat/200/200', hasVariants: false, basePrice: 4500, is_active: true, rating: 4.8 },
];

const mockClients = [
    { id: 'client1', name: 'أحمد علي', phone: '777000001', governorateId: 'prov1', addressDescription: 'شارع 15، جوار الجامع', addressType: 'home', latitude: 15.35, longitude: 44.21, is_active: true },
    { id: 'client2', name: 'فاطمة حسن', phone: '777000002', governorateId: 'prov2', addressDescription: 'خلف المستشفى', addressType: 'work', latitude: 14.53, longitude: 49.12, is_active: true },
    { id: 'client3', name: 'خالد صالح', phone: '777000003', governorateId: 'prov1', addressDescription: 'فوق البقالة', addressType: 'home', latitude: 15.34, longitude: 44.18, is_active: true },
];

const mockDrivers = [
    { id: 'driver1', name: 'أحمد عبدالله', phone: '777111222', email: 'ahmed.d@example.com', address: 'شارع الزبيري، صنعاء', idType: 'card', personalPhotoUrl: 'https://picsum.photos/seed/driver1/200/200', idFrontPhotoUrl: 'https://picsum.photos/seed/id1front/400/250', idBackPhotoUrl: 'https://picsum.photos/seed/id1back/400/250', is_active: true, status: 'active', createdAt: Timestamp.fromDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)), latitude: 15.36, longitude: 44.19 },
    { id: 'driver2', name: 'علي محمد', phone: '777333444', email: 'ali.m@example.com', address: 'شارع حدة، صنعاء', idType: 'passport', personalPhotoUrl: 'https://picsum.photos/seed/driver2/200/200', idFrontPhotoUrl: 'https://picsum.photos/seed/id2front/400/250', is_active: true, status: 'active', createdAt: Timestamp.fromDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), latitude: 15.35, longitude: 44.20 },
];

const mockOrders: Omit<any, 'id'>[] = [
    // Today's orders
    { clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'incoming', items: [{productId: 'prod2', productName: 'عقدة لحم', quantity: 1, price: 3000}], financials: { subtotal: 3000, deliveryFee: 500, discount: 0, tip: 0, total: 3500 }, payment: { method: 'cash', status: 'pending' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(0)) } },
    { clientId: 'client2', clientName: 'فاطمة حسن', clientPhone: '777000002', storeId: 'store2', storeName: 'سوبر ماركت العالمية', status: 'preparing', delegateId: 'driver1', delegateName: 'أحمد عبدالله', items: [{productId: 'prod3', productName: 'ماء معدني', quantity: 6, price: 150}, {productId: 'prod6', productName: 'لبن', quantity: 2, price: 300}], financials: { subtotal: 1500, deliveryFee: 200, discount: 0, tip: 0, total: 1700 }, payment: { method: 'wallet', status: 'paid' }, address: { description: 'خلف المستشفى', latitude: 14.53, longitude: 49.12 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(0)) } },
    
    // Yesterday's orders
    { clientId: 'client3', clientName: 'خالد صالح', clientPhone: '777000003', storeId: 'store3', storeName: 'حضرموت للمأكولات', status: 'delivered', delegateId: 'driver2', delegateName: 'علي محمد', items: [{productId: 'prod4', productName: 'مضغوط لحم', quantity: 2, price: 4000}], financials: { subtotal: 8000, deliveryFee: 600, discount: 500, tip: 300, total: 8400 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'فوق البقالة', latitude: 15.34, longitude: 44.18 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(1)), dispatchedAt: Timestamp.fromDate(daysAgo(1)), deliveredAt: Timestamp.fromDate(daysAgo(1)) } },
    { clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'delivered', delegateId: 'driver1', delegateName: 'أحمد عبدالله', items: [{productId: 'prod5', productName: 'شاورما دجاج', quantity: 5, price: 800}], financials: { subtotal: 4000, deliveryFee: 500, discount: 0, tip: 0, total: 4500 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(1)), dispatchedAt: Timestamp.fromDate(daysAgo(1)), deliveredAt: Timestamp.fromDate(daysAgo(1)) } },
    { clientId: 'client2', clientName: 'فاطمة حسن', clientPhone: '777000002', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'cancelled', items: [{productId: 'prod1', productName: 'مندي دجاج', quantity: 1, price: 2500}], financials: { subtotal: 2500, deliveryFee: 500, discount: 0, tip: 0, total: 3000 }, payment: { method: 'wallet', status: 'pending' }, address: { description: 'خلف المستشفى', latitude: 14.53, longitude: 49.12 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(1)), cancelledAt: Timestamp.fromDate(daysAgo(1)) } },

    // 2 days ago
    { clientId: 'client3', clientName: 'خالد صالح', clientPhone: '777000003', storeId: 'store2', storeName: 'سوبر ماركت العالمية', status: 'delivered', delegateId: 'driver1', delegateName: 'أحمد عبدالله', items: [{productId: 'prod3', productName: 'ماء معدني', quantity: 12, price: 150}], financials: { subtotal: 1800, deliveryFee: 200, discount: 0, tip: 0, total: 2000 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'فوق البقالة', latitude: 15.34, longitude: 44.18 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(2)), dispatchedAt: Timestamp.fromDate(daysAgo(2)), deliveredAt: Timestamp.fromDate(daysAgo(2)) } },
    { clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store3', storeName: 'حضرموت للمأكولات', status: 'delivered', delegateId: 'driver2', delegateName: 'علي محمد', items: [{productId: 'prod7', productName: 'مندي لحم', quantity: 1, price: 4500}], financials: { subtotal: 4500, deliveryFee: 600, discount: 0, tip: 500, total: 5600 }, payment: { method: 'wallet', status: 'paid' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(2)), dispatchedAt: Timestamp.fromDate(daysAgo(2)), deliveredAt: Timestamp.fromDate(daysAgo(2)) } },
    
    // 3 days ago
    { clientId: 'client2', clientName: 'فاطمة حسن', clientPhone: '777000002', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'delivered', delegateId: 'driver1', delegateName: 'أحمد عبدالله', items: [{productId: 'prod1', productName: 'مندي دجاج', quantity: 3, price: 2500}, {productId: 'prod5', productName: 'شاورما دجاج', quantity: 4, price: 800}], financials: { subtotal: 10700, deliveryFee: 500, discount: 1000, tip: 0, total: 10200 }, payment: { method: 'bank_transfer', status: 'paid' }, address: { description: 'خلف المستشفى', latitude: 14.53, longitude: 49.12 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(3)), dispatchedAt: Timestamp.fromDate(daysAgo(3)), deliveredAt: Timestamp.fromDate(daysAgo(3)) } },
    
    // 4 days ago
    { clientId: 'client3', clientName: 'خالد صالح', clientPhone: '777000003', storeId: 'store2', storeName: 'سوبر ماركت العالمية', status: 'delivered', delegateId: 'driver2', delegateName: 'علي محمد', items: [{productId: 'prod3', productName: 'ماء معدني', quantity: 24, price: 150}], financials: { subtotal: 3600, deliveryFee: 200, discount: 0, tip: 0, total: 3800 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'فوق البقالة', latitude: 15.34, longitude: 44.18 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(4)), dispatchedAt: Timestamp.fromDate(daysAgo(4)), deliveredAt: Timestamp.fromDate(daysAgo(4)) } },
    { clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'delivered', delegateId: 'driver1', delegateName: 'أحمد عبدالله', items: [{productId: 'prod5', productName: 'شاورما دجاج', quantity: 10, price: 800}], financials: { subtotal: 8000, deliveryFee: 500, discount: 0, tip: 0, total: 8500 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(4)), dispatchedAt: Timestamp.fromDate(daysAgo(4)), deliveredAt: Timestamp.fromDate(daysAgo(4)) } },
    
    // 5 days ago
    { clientId: 'client2', clientName: 'فاطمة حسن', clientPhone: '777000002', storeId: 'store3', storeName: 'حضرموت للمأكولات', status: 'delivered', delegateId: 'driver2', delegateName: 'علي محمد', items: [{productId: 'prod4', productName: 'مضغوط لحم', quantity: 1, price: 4000}, {productId: 'prod7', productName: 'مندي لحم', quantity: 1, price: 4500}], financials: { subtotal: 8500, deliveryFee: 600, discount: 0, tip: 0, total: 9100 }, payment: { method: 'wallet', status: 'paid' }, address: { description: 'خلف المستشفى', latitude: 14.53, longitude: 49.12 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(5)), dispatchedAt: Timestamp.fromDate(daysAgo(5)), deliveredAt: Timestamp.fromDate(daysAgo(5)) } },
    
    // 6 days ago
    { clientId: 'client3', clientName: 'خالد صالح', clientPhone: '777000003', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'delivered', delegateId: 'driver1', delegateName: 'أحمد عبدالله', items: [{productId: 'prod2', productName: 'عقدة لحم', quantity: 1, price: 5000}], financials: { subtotal: 5000, deliveryFee: 500, discount: 0, tip: 0, total: 5500 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'فوق البقالة', latitude: 15.34, longitude: 44.18 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(6)), dispatchedAt: Timestamp.fromDate(daysAgo(6)), deliveredAt: Timestamp.fromDate(daysAgo(6)) } },
    
    // Scheduled Appointments
    { clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'incoming', items: [{productId: 'prod1', productName: 'مندي دجاج', quantity: 2, price: 2500}], financials: { subtotal: 5000, deliveryFee: 500, discount: 0, tip: 0, total: 5500 }, payment: { method: 'cash', status: 'pending' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(now), scheduledDeliveryTime: Timestamp.fromDate(daysFuture(1)) } },
    { clientId: 'client2', clientName: 'فاطمة حسن', clientPhone: '777000002', storeId: 'store3', storeName: 'حضرموت للمأكولات', status: 'incoming', items: [{productId: 'prod7', productName: 'مندي لحم', quantity: 4, price: 4500}], financials: { subtotal: 18000, deliveryFee: 600, discount: 0, tip: 0, total: 18600 }, payment: { method: 'wallet', status: 'paid' }, address: { description: 'خلف المستشفى', latitude: 14.53, longitude: 49.12 }, timestamps: { createdAt: Timestamp.fromDate(now), scheduledDeliveryTime: Timestamp.fromDate(daysFuture(2)) } },
    { clientId: 'client3', clientName: 'خالد صالح', clientPhone: '777000003', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'delivered', delegateId: 'driver1', delegateName: 'أحمد عبدالله', items: [{ productId: 'prod1', productName: 'مندي دجاج', quantity: 1, price: 2500 }], financials: { subtotal: 2500, deliveryFee: 500, discount: 0, tip: 0, total: 3000 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'فوق البقالة', latitude: 15.34, longitude: 44.18 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(3)), scheduledDeliveryTime: Timestamp.fromDate(daysAgo(2)), deliveredAt: Timestamp.fromDate(daysAgo(2)) }},
    { clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store2', storeName: 'سوبر ماركت العالمية', status: 'cancelled', cancellationReason: 'العميل ألغى الطلب', items: [{ productId: 'prod3', productName: 'ماء معدني', quantity: 10, price: 150 }], financials: { subtotal: 1500, deliveryFee: 200, discount: 0, tip: 0, total: 1700 }, payment: { method: 'wallet', status: 'pending' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(daysAgo(1)), scheduledDeliveryTime: Timestamp.fromDate(daysAgo(0)), cancelledAt: Timestamp.fromDate(daysAgo(1)) }},
];


export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // Seed with new rich data
  mockProvinces.forEach(item => batch.set(doc(db, 'app_provinces', item.id), item));
  mockCategories.forEach(item => batch.set(doc(db, 'app_categories', item.id), item));
  mockStores.forEach(item => batch.set(doc(db, 'stores', item.id), item));
  mockProducts.forEach(item => batch.set(doc(db, 'products', item.id), item));
  mockClients.forEach(item => batch.set(doc(db, 'clients', item.id), item));
  mockDrivers.forEach(item => batch.set(doc(db, 'drivers_v2', item.id), item));
  mockOrders.forEach((order, index) => batch.set(doc(db, 'orders', `ord${index + 1}`), order));


  // Seed other collections
  mockFaqs.forEach(faq => {
    const docRef = doc(db, 'faqs', faq.id);
    batch.set(docRef, faq);
  });

  mockTickets.forEach(ticket => {
    const { id, ...data } = ticket;
    const docRef = doc(db, 'supportTickets', id);
    batch.set(docRef, { ...data, createdAt: Timestamp.fromDate(data.createdAt), updatedAt: Timestamp.fromDate(data.createdAt) });
  });

  mockTemplates.forEach(template => {
    const docRef = doc(db, 'notificationTemplates', template.id);
    batch.set(docRef, template);
  });

  mockBroadcasts.forEach(broadcast => {
    const { id, ...data } = broadcast;
    const docRef = doc(db, 'broadcasts', id);
    batch.set(docRef, { ...data, createdAt: Timestamp.fromDate(data.createdAt) });
  });

  mockAdminNotifications.forEach(notification => {
    const { id, ...data } = notification;
    const docRef = doc(db, 'notifications', id);
    batch.set(docRef, { ...data, timestamp: Timestamp.fromDate(data.timestamp) });
  });
  
  // Seed System Settings
  const settingsRef = doc(db, 'systemSettings', 'main');
  batch.set(settingsRef, defaultSettings);

  await batch.commit();
}
