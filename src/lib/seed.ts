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
const mockOrders = [
    { id: 'ord1', clientId: 'c1', clientName: 'أحمد علي', clientPhone: '777000001', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'delivered', items: [], financials: { subtotal: 8000, deliveryFee: 500, discount: 0, tip: 0, total: 8500 }, payment: { method: 'cash', status: 'paid' }, address: { description: '...', latitude: 0, longitude: 0 }, timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)) } },
    { id: 'ord2', clientId: 'c2', clientName: 'فاطمة حسن', clientPhone: '777000002', storeId: 'store2', storeName: 'سوبر ماركت العالمية', status: 'delivered', items: [], financials: { subtotal: 12000, deliveryFee: 300, discount: 1000, tip: 0, total: 11300 }, payment: { method: 'wallet', status: 'paid' }, address: { description: '...', latitude: 0, longitude: 0 }, timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)) } },
    { id: 'ord3', clientId: 'c3', clientName: 'خالد صالح', clientPhone: '777000003', storeId: 'store1', storeName: 'مطعم البيت الصنعاني', status: 'cancelled', items: [], financials: { subtotal: 5000, deliveryFee: 500, discount: 0, tip: 0, total: 5500 }, payment: { method: 'bank_transfer', status: 'pending' }, address: { description: '...', latitude: 0, longitude: 0 }, timestamps: { createdAt: Timestamp.fromDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) } },
];


export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

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
