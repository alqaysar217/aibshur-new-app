'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Headset, Search, ShoppingCart, CreditCard, User, Gem, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BottomNav } from '@/components/bottom-nav';

const helpCategories = [
  { name: 'الطلبات', icon: ShoppingCart, color: 'bg-blue-100', iconColor: 'text-blue-600' },
  { name: 'الدفع', icon: CreditCard, color: 'bg-green-100', iconColor: 'text-green-600' },
  { name: 'الحساب', icon: User, color: 'bg-orange-100', iconColor: 'text-orange-600' },
  { name: 'العضوية', icon: Gem, color: 'bg-purple-100', iconColor: 'text-purple-600' },
];

const faqs = [
  {
    id: 'faq1',
    question: 'كيف يمكنني تتبع حالة طلبي؟',
    answer: 'يمكنك تتبع طلبك مباشرة من قسم "طلباتي" في التطبيق. ستظهر لك خريطة توضح موقع المندوب وحالة الطلب الحالية، سواء كان قيد التحضير أو في الطريق إليك.',
  },
  {
    id: 'faq2',
    question: 'ما هي طرق الدفع التي تقبلونها؟',
    answer: 'نقبل الدفع نقدًا عند الاستلام، والدفع عبر المحفظة الإلكترونية داخل التطبيق، بالإضافة إلى التحويلات البنكية المباشرة لحساباتنا المعتمدة.',
  },
  {
    id: 'faq3',
    question: 'هل يمكنني إلغاء الطلب بعد تأكيده؟',
    answer: 'نعم، يمكنك إلغاء الطلب طالما لم يتم إرساله مع المندوب. لإلغاء الطلب، اذهب إلى صفحة "تفاصيل الطلب" واضغط على زر "إلغاء الطلب".',
  },
  {
    id: 'faq4',
    question: 'كيف أستفيد من نقاط الولاء؟',
    answer: 'تحصل على نقاط ولاء مع كل طلب تقوم به. يمكنك استبدال هذه النقاط برصيد في محفظتك أو الحصول على خصومات خاصة على طلباتك القادمة من قسم "نقاط الولاء" في حسابك.',
  },
];

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">مركز المساعدة</h1>
          <div className="w-9 h-9" />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-8">
        {/* Top Section */}
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-primary/10 rounded-full">
            <Headset className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="بماذا يمكننا مساعدتك؟"
              className="w-full pr-12 pl-4 h-14 text-base bg-card shadow-lg"
              style={{ borderRadius: '15px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          {helpCategories.map((cat) => (
            <Card key={cat.name} className="shadow-sm hover:shadow-md transition-all cursor-pointer rounded-[10px]">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <div className={`p-3 rounded-full ${cat.color}`}>
                  <cat.icon className={`h-6 w-6 ${cat.iconColor}`} />
                </div>
                <p className="font-black text-lg text-center">{cat.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-xl font-black text-right mb-4">الأسئلة الشائعة</h2>
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full bg-card rounded-[10px] p-2 shadow-sm">
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-b-2 border-gray-50/50 last:border-b-0">
                  <AccordionTrigger className="text-right font-black text-base hover:no-underline p-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0 text-right">
                    <p className="font-medium text-muted-foreground leading-relaxed">
                        {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-[10px]">
              <p>لا توجد نتائج تطابق بحثك.</p>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <Card className="bg-gray-900 text-white" style={{ borderRadius: '25px' }}>
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">هل تحتاج إلى مساعدة فورية؟</h3>
            <p className="text-gray-300">تواصل مع فريق الدعم مباشرة عبر واتساب أو الاتصال.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="default"
                className="h-14 text-lg font-bold bg-white text-gray-900 hover:bg-gray-200"
                style={{ borderRadius: '10px' }}
              >
                <MessageSquare className="ml-2" />
                واتساب
              </Button>
               <Button
                variant="default"
                className="h-14 text-lg font-bold bg-primary text-primary-foreground"
                style={{ borderRadius: '10px' }}
              >
                <Phone className="ml-2" />
                اتصال
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
