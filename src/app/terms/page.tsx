'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Scale,
  Info,
  Store,
  AppWindow,
  User,
  Ban,
  ClipboardList,
  Ticket,
  Bike,
  Copyright,
  ShieldAlert,
  Users,
  Database,
  Landmark,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const termsSections = [
    {
      icon: Info,
      title: "المقدمة",
      content: "مرحباً بك في تطبيق أبشر. باستخدامك للتطبيق فإنك توافق بشكل كامل على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق عليها، فيجب عليك عدم استخدام التطبيق.",
    },
    {
      icon: Store,
      title: "1. حول أبشر",
      content: "منصة أبشر هي منصة رقمية تعمل كوسيط تقني يربط بين المستخدمين وبين مجموعة واسعة من المطاعم والمتاجر ومقدمي الخدمات.",
    },
    {
      icon: AppWindow,
      title: "2. خدمات المنصة",
      content: "تشمل خدماتنا الرئيسية: عرض قوائم المطاعم والمتاجر، تسهيل طلب المنتجات، توفير خدمة التوصيل، نظام تقييم، وتقديم العروض الترويجية.",
    },
    {
      icon: User,
      title: "3. حسابك",
      content: "أنت مسؤول عن الحفاظ على سرية بيانات حسابك وصحة المعلومات المقدمة. تحتفظ المنصة بالحق في تعليق أو إنهاء أي حساب يخالف الشروط.",
    },
    {
      icon: Ban,
      title: "4. السلوك المحظور",
      content: "يُمنع منعاً باتاً استخدام التطبيق لأي أغراض غير قانونية، أو الاحتيال، أو الإساءة للمناديب أو المتاجر، أو محاولة التلاعب بنظام التطبيق.",
    },
    {
      icon: ClipboardList,
      title: "5. الطلبات",
      content: "تعتمد جميع الطلبات على مدى توفرها لدى المتجر. الأسعار المعروضة تشمل قيمة المنتج ورسوم التوصيل. لا يمكن تعديل الطلب بعد تأكيده.",
    },
    {
      icon: Ticket,
      title: "6. القسائم والترويج",
      content: "تخضع جميع القسائم والعروض الترويجية لشروط وأحكام خاصة بها، مثل تاريخ الصلاحية والحد الأدنى للطلب، ولا يمكن استبدالها بقيمة نقدية.",
    },
    {
      icon: Bike,
      title: "7. التوصيل",
      content: "يتم توصيل الطلبات عبر مندوبين مستقلين. وقت التوصيل المعروض هو وقت تقديري. يجب على المستخدم الرد على اتصالات المندوب والتواجد في موقع التسليم.",
    },
    {
      icon: Copyright,
      title: "8. الملكية الفكرية",
      content: "جميع المحتويات، التصاميم، الشعارات، والنصوص الموجودة في تطبيق أبشر هي ملكية حصرية للمنصة ومحمية بموجب قوانين الملكية الفكرية.",
    },
    {
      icon: ShieldAlert,
      title: "9. إخلاء المسؤولية",
      content: "منصة أبشر هي وسيط تقني فقط. نحن لا نتحمل أي مسؤولية عن جودة المنتجات أو سلامتها أو أي تأخير خارج عن سيطرتنا من قبل المتجر أو المندوب.",
    },
    {
      icon: Users,
      title: "10. التزامات الطرف الثالث",
      content: "تلتزم المتاجر الشريكة بتقديم منتجات ذات جودة عالية، ويلتزم المندوبون بالوصول في الوقت المحدد والتعامل باحترافية واحترام.",
    },
    {
      icon: Database,
      title: "11. التعويض",
      content: "يوافق المستخدم على تعويض منصة أبشر والدفاع عنها ضد أي مطالبات أو أضرار أو خسائر تنشأ عن سوء استخدامه للتطبيق أو انتهاكه لهذه الشروط.",
    },
    {
      icon: Landmark,
      title: "12. حماية البيانات",
      content: "نحن نلتزم بحماية بياناتك الشخصية. يتم استخدام معلوماتك فقط لغرض تحسين جودة الخدمة وتسهيل عمليات الطلب والتوصيل، ولن تتم مشاركتها مع أي طرف ثالث.",
    },
    {
      icon: Landmark,
      title: "13. الاختصاص القضائي",
      content: "تخضع هذه الشروط والأحكام وتُفسر وفقًا للقوانين المعمول بها في الجمهورية اليمنية. في حالة حدوث أي نزاع، يتم اللجوء إلى الجهات القضائية المختصة.",
    },
    {
      icon: FileText,
      title: "14. أحكام عامة",
      content: "تحتفظ منصة أبشر بالحق في تعديل هذه الشروط والأحكام في أي وقت. استمرارك في استخدام التطبيق بعد أي تعديلات يعني موافقتك على الشروط الجديدة.",
    },
];
  
export default function TermsPage() {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        // Set the date on the client side to avoid hydration mismatch
        const date = new Date();
        const formattedDate = date.toLocaleDateString('ar-EG-u-nu-latn', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        setCurrentDate(formattedDate);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
             {/* Header */}
            <header className="sticky top-0 z-20 glass">
                <div className="flex items-center justify-between h-16 px-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/account"><ArrowRight className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="font-black text-lg text-primary">الشروط والأحكام</h1>
                    <div className="w-9 h-9" />
                </div>
            </header>

            <ScrollArea className="flex-1">
                <main className="p-4">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="inline-block p-5 bg-primary/10 rounded-[35px]">
                            <Scale className="h-16 w-16 text-primary"/>
                        </div>
                        <h2 className="text-3xl font-black mt-4">اتفاقية الاستخدام</h2>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-4">
                        {termsSections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <Card key={index} className="rounded-[30px] overflow-hidden shadow-sm border-gray-200/80">
                                    <div className="flex items-center gap-4 p-4 bg-muted/40">
                                        <div className="p-3 rounded-[10px] bg-sidebar-active-gradient text-primary-foreground flex-shrink-0 shadow-md">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-black text-lg flex-1">{section.title}</h3>
                                    </div>
                                    <CardContent className="p-4 text-left">
                                        <p className="font-bold text-gray-700 leading-relaxed">{section.content}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                     {/* Footer Box */}
                    <div className="mt-8 p-6 bg-sidebar-active-gradient rounded-[30px] text-center text-primary-foreground">
                        <p className="font-bold">نحن في "أبشر" نثق في أن استخدامك سيكون مبنياً على الاحترام والمسؤولية المتبادلة.</p>
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        آخر تحديث: {currentDate}
                    </p>
                </main>
            </ScrollArea>
        </div>
    );
}
