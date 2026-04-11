import { Firestore, doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';

// Mock Data
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
  { id: 'n1', type: 'order_status', title: 'طلبك في الطريق!', body: 'مندوبنا أحمد في طريقه إليك لتسليم طلب #ORD123.', timestamp: new Date(new Date().getTime() - 5 * 60 * 1000), isRead: false, link: '/orders/ORD123' },
  { id: 'n2', type: 'promotion', title: 'خصم 50% على مطعم البيت الصنعاني', body: 'استمتع بخصم كبير على وجباتك المفضلة. لا تفوت الفرصة!', timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), isRead: false, link: '/store/1' },
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

const mockOrders = [
    { id: 'ord1', clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', delegateId: 'driver1', delegateName: 'أحمد عبدالله', status: 'delivered', items: [{productId: 'prod1', productName: 'مندي دجاج', quantity: 2, price: 2500}], financials: { subtotal: 5000, deliveryFee: 500, discount: 0, tip: 200, total: 5700 }, payment: { method: 'cash', status: 'paid' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)), dispatchedAt: Timestamp.fromDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 10*60000)), deliveredAt: Timestamp.fromDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 35*60000)) }, rating: { delegate: 5, store: 4, comment: 'توصيل سريع وخدمة ممتازة' } },
    { id: 'ord2', clientId: 'client2', clientName: 'فاطمة حسن', clientPhone: '777000002', storeId: 'store3', storeName: 'حضرموت للمأكولات', delegateId: 'driver2', delegateName: 'علي محمد', status: 'delivered', items: [{productId: 'prod1', productName: 'مندي دجاج', quantity: 1, price: 2500}], financials: { subtotal: 2500, deliveryFee: 300, discount: 0, tip: 0, total: 2800 }, payment: { method: 'wallet', status: 'paid' }, address: { description: 'خلف المستشفى', latitude: 14.53, longitude: 49.12 }, timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), dispatchedAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 15*60000)), deliveredAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 45*60000)) }, rating: { delegate: 4, store: 5, comment: 'كل شيء كان رائعاً' } },
    { id: 'ord3', clientId: 'client3', clientName: 'خالد صالح', clientPhone: '777000003', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'cancelled', items: [], financials: { subtotal: 5000, deliveryFee: 500, discount: 0, tip: 0, total: 5500 }, payment: { method: 'bank_transfer', status: 'pending' }, address: { description: 'فوق البقالة', latitude: 15.34, longitude: 44.18 }, timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) } },
    { id: 'ord4', clientId: 'client1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store2', storeName: 'سوبر ماركت العالمية', status: 'incoming', items: [{productId: 'prod3', productName: 'ماء معدني', quantity: 10, price: 150}], financials: { subtotal: 1500, deliveryFee: 0, discount: 0, tip: 0, total: 1500 }, payment: { method: 'cash', status: 'pending' }, address: { description: 'شارع 15، جوار الجامع', latitude: 15.35, longitude: 44.21 }, timestamps: { createdAt: Timestamp.fromDate(now) } },
];


export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // --- NEW ---
  mockProvinces.forEach(item => batch.set(doc(db, 'app_provinces', item.id), item));
  mockCategories.forEach(item => batch.set(doc(db, 'app_categories', item.id), item));
  mockStores.forEach(item => batch.set(doc(db, 'stores', item.id), item));
  mockProducts.forEach(item => batch.set(doc(db, 'products', item.id), item));
  mockClients.forEach(item => batch.set(doc(db, 'clients', item.id), item));
  mockDrivers.forEach(item => batch.set(doc(db, 'drivers_v2', item.id), item));
  // --- END NEW ---

  // Seed FAQs
  mockFaqs.forEach(faq => {
    const docRef = doc(db, 'faqs', faq.id);
    batch.set(docRef, faq);
  });

  // Seed Tickets
  mockTickets.forEach(ticket => {
    const { id, ...data } = ticket;
    const docRef = doc(db, 'supportTickets', id);
    batch.set(docRef, { ...data, createdAt: Timestamp.fromDate(data.createdAt), updatedAt: Timestamp.fromDate(data.createdAt) });
  });

  // Seed Notification Templates
  mockTemplates.forEach(template => {
    const docRef = doc(db, 'notificationTemplates', template.id);
    batch.set(docRef, template);
  });

  // Seed Broadcasts
  mockBroadcasts.forEach(broadcast => {
    const { id, ...data } = broadcast;
    const docRef = doc(db, 'broadcasts', id);
    batch.set(docRef, { ...data, createdAt: Timestamp.fromDate(data.createdAt) });
  });

  // Seed Admin Notifications
  mockAdminNotifications.forEach(notification => {
    const { id, ...data } = notification;
    const docRef = doc(db, 'notifications', id);
    batch.set(docRef, { ...data, timestamp: Timestamp.fromDate(data.timestamp) });
  });
  
  // Seed Orders
  mockOrders.forEach(order => {
    const { id, ...data } = order;
    const docRef = doc(db, 'orders', id);
    batch.set(docRef, data);
  });

  // Seed System Settings
  const settingsRef = doc(db, 'systemSettings', 'main');
  batch.set(settingsRef, defaultSettings);

  await batch.commit();
}
