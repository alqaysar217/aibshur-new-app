'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Info,
  Database,
  Lock,
  Share2,
  Cookie,
  UserCheck,
  Trash2,
  History,
  FileText,
  ShieldQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const privacySections = [
    {
      icon: Info,
      title: "مقدمة",
      content: "نلتزم في تطبيق أبشر بحماية بياناتك الشخصية واحترام خصوصيتك أثناء استخدامك لخدماتنا. توضح هذه السياسة كيفية جمعنا للمعلومات واستخدامها وحمايتها.",
    },
    {
      icon: Database,
      title: "1. المعلومات التي نجمعها",
      content: "نقوم بجمع نوعين من المعلومات: معلومات تقدمها أنت مباشرة (مثل الاسم، رقم الهاتف، البريد الإلكتروني، عنوان التوصيل، وتفاصيل الدفع)، ومعلومات نجمعها تلقائيًا أثناء استخدامك للتطبيق (مثل الموقع الجغرافي، بيانات الاستخدام، ومعلومات الجهاز).",
    },
    {
      icon: Lock,
      title: "2. كيف نستخدم معلوماتك",
      content: "تُستخدم معلوماتك بشكل أساسي لتنفيذ طلباتك وتوصيلها، التواصل معك بشأن حسابك وطلباتك، تحسين جودة خدماتنا وتجربتك، تقديم عروض ومحتوى مخصص لك، ومنع الأنشطة الاحتيالية وغير القانونية.",
    },
    {
      icon: Share2,
      title: "3. مشاركة المعلومات",
      content: "لا نشارك بياناتك الشخصية إلا في الحالات الضرورية لتقديم الخدمة، وذلك مع: شركاء الدفع لتسهيل المعاملات المالية، التجار ومندوبي التوصيل لتنفيذ طلبك، وشركاء التسويق والتحليلات بشكل مجهول الهوية لدراسة الأداء وتحسينه.",
    },
    {
      icon: Cookie,
      title: "4. ملفات تعريف الارتباط (Cookies)",
      content: "نستخدم ملفات تعريف الارتباط والتقنيات المشابهة لتحسين تجربتك، تذكر تفضيلاتك، وتوفير وظائف أساسية. يمكنك التحكم في استخدامها من خلال إعدادات متصفحك.",
    },
    {
      icon: ShieldCheck,
      title: "5. حماية المعلومات",
      content: "نحن نطبق أعلى معايير الأمان التقنية والإدارية لحماية بياناتك من الوصول غير المصرح به. يتم تخزين جميع البيانات في خوادم آمنة ومُشفرة.",
    },
    {
      icon: UserCheck,
      title: "6. حقوقك كمستخدم",
      content: "لديك الحق الكامل في الاطلاع على بياناتك، طلب تعديلها أو حذفها. كما يمكنك رفض استخدام بياناتك لأغراض التسويق المباشر في أي وقت عبر التواصل مع فريق الدعم.",
    },
    {
      icon: History,
      title: "7. تخزين البيانات",
      content: "نحتفظ ببياناتك الشخصية طوال فترة استخدامك للتطبيق وللفترة القانونية اللازمة بعد ذلك للامتثال لالتزاماتنا القانونية وحل النزاعات.",
    },
    {
      icon: ShieldQuestion,
      title: "8. خصوصية الأطفال",
      content: "تطبيق أبشر مخصص لمن هم فوق 18 عامًا. نحن لا نجمع بيانات الأطفال عن قصد. إذا اكتشفنا جمع أي بيانات من طفل، سنقوم بحذفها فورًا.",
    },
    {
      icon: FileText,
      title: "9. تحديثات السياسة",
      content: "نحتفظ بالحق في تعديل سياسة الخصوصية هذه من وقت لآخر. سنقوم بإعلامك بأي تغييرات جوهرية عبر إشعار داخل التطبيق أو عبر البريد الإلكتروني المسجل لدينا.",
    },
];

export default function PrivacyPage() {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const date = new Date();
        const formattedDate = date.toLocaleDateString('ar-EG-u-nu-latn', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        setCurrentDate(formattedDate);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFB]">
            <header className="sticky top-0 z-20 glass">
                <div className="flex items-center justify-between h-16 px-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/account"><ArrowRight className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="font-black text-lg text-primary">الخصوصية والأمان</h1>
                    <div className="w-9 h-9" />
                </div>
            </header>

            <ScrollArea className="flex-1">
                <main className="p-4">
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="inline-block p-5 bg-primary/10 rounded-[35px] -rotate-3 transition-transform hover:rotate-0 duration-300">
                            <ShieldCheck className="h-16 w-16 text-primary animate-pulse"/>
                        </div>
                        <h2 className="text-3xl font-black mt-4">سياسة الخصوصية</h2>
                    </div>

                    <Card className="rounded-[30px] p-4 shadow-sm border-gray-200/80">
                        <div className="space-y-6">
                            {privacySections.map((section, index) => {
                                const Icon = section.icon;
                                return (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="flex-shrink-0 pt-1">
                                            <Icon className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div className="flex-1 border-r-2 border-primary pr-4">
                                            <h3 className="font-black text-lg">{section.title}</h3>
                                            <p className="font-bold text-gray-700 leading-relaxed text-justify mt-1">
                                                {section.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <div className="mt-8 p-6 bg-sidebar-active-gradient rounded-[25px] text-center text-primary-foreground flex flex-col items-center gap-2 shadow-lg">
                        <Lock className="h-8 w-8"/>
                        <p className="font-bold text-lg">أبشر - حماية بياناتك هي عهدنا</p>
                    </div>

                     <p className="text-center text-sm text-muted-foreground mt-4">
                        آخر تحديث: {currentDate}
                    </p>
                </main>
            </ScrollArea>
        </div>
    );
}
