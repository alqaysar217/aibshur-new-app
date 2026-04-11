'use client';
import { useState, useMemo, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    LifeBuoy, MessageSquare, Check, Inbox, HelpCircle, PlusCircle, Edit, Trash, User, Mail, Clock,
    Search, Filter, Send, Paperclip, AlertOctagon, Timer, CheckCircle2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import SupportLoading from './loading';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';


type TicketStatus = 'open' | 'in_progress' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high';
type Reply = { authorName: string; message: string; createdAt: Timestamp; };
export type SupportTicket = { id: string; subject: string; userName: string; userEmail: string; priority: TicketPriority; status: TicketStatus; createdAt: Timestamp; updatedAt: Timestamp; description: string; replies: Reply[], attachments?: string[] };
type Faq = { id: string; category: string; question: string; answer: string; };

const statusMap: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
    open: { label: 'مفتوحة', color: 'bg-red-500', icon: Inbox },
    in_progress: { label: 'قيد المعالجة', color: 'bg-amber-500', icon: Timer },
    closed: { label: 'مغلقة', color: 'bg-green-500', icon: CheckCircle2 },
};

const priorityMap: Record<TicketPriority, { label: string; color: string; icon: React.ElementType }> = {
    low: { label: 'منخفضة', color: 'text-gray-500', icon: HelpCircle },
    medium: { label: 'متوسطة', color: 'text-amber-600', icon: MessageSquare },
    high: { label: 'عالية', color: 'text-red-600', icon: AlertOctagon },
};

const faqFormSchema = z.object({
    question: z.string().min(10, "السؤال يجب أن يكون 10 أحرف على الأقل"),
    answer: z.string().min(20, "الإجابة يجب أن تكون 20 حرفًا على الأقل"),
    category: z.string().min(2, "الفئة مطلوبة"),
});

export default function SupportPage() {
    const firestore = useFirestore();
    const [activeTab, setActiveTab] = useState<'tickets' | 'faq'>('tickets');
    
    // Tickets State
    const {data: tickets, isLoading: isLoadingTickets} = useCollection<SupportTicket>(useMemoFirebase(() => firestore && collection(firestore, 'supportTickets'), [firestore]));
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [filters, setFilters] = useState({ status: 'all', priority: 'all', search: '' });

    // FAQ State
    const {data: faqs, isLoading: isLoadingFaqs} = useCollection<Faq>(useMemoFirebase(() => firestore && collection(firestore, 'faqs'), [firestore]));
    const [faqDialog, setFaqDialog] = useState<{ open: boolean, isEditing: boolean, data: Faq | null }>({ open: false, isEditing: false, data: null });
    const [deleteFaqAlert, setDeleteFaqAlert] = useState<Faq | null>(null);

    const { toast } = useToast();
    const isLoading = isLoadingTickets || isLoadingFaqs;

    const faqForm = useForm<z.infer<typeof faqFormSchema>>({
        resolver: zodResolver(faqFormSchema),
        defaultValues: { question: '', answer: '', category: '' },
    });

    const filteredTickets = useMemo(() => {
        return (tickets || []).filter(t => 
            (filters.status === 'all' || t.status === filters.status) &&
            (filters.priority === 'all' || t.priority === filters.priority) &&
            (t.subject.includes(filters.search) || t.userName.includes(filters.search) || t.id.includes(filters.search))
        ).sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    }, [tickets, filters]);
    
    const stats = useMemo(() => ({
        open: (tickets || []).filter(t => t.status === 'open').length,
        inProgress: (tickets || []).filter(t => t.status === 'in_progress').length,
        closedToday: (tickets || []).filter(t => t.status === 'closed' && format(t.createdAt.toDate(), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
        avgResponseTime: '3 ساعات', // Mock
    }), [tickets]);

    const faqCategories = useMemo(() => [...new Set((faqs || []).map(f => f.category))], [faqs]);
    
    const handleFaqSubmit = (values: z.infer<typeof faqFormSchema>) => {
        if (!firestore) return;
        if (faqDialog.isEditing && faqDialog.data) {
            updateDocumentNonBlocking(doc(firestore, 'faqs', faqDialog.data.id), values);
            toast({ title: 'تم تحديث السؤال بنجاح' });
        } else {
            addDocumentNonBlocking(collection(firestore, 'faqs'), values);
            toast({ title: 'تمت إضافة السؤال بنجاح' });
        }
        setFaqDialog({ open: false, isEditing: false, data: null });
    };

    const confirmDeleteFaq = () => {
        if(deleteFaqAlert && firestore) {
            deleteDocumentNonBlocking(doc(firestore, 'faqs', deleteFaqAlert.id));
            toast({title: "تم الحذف بنجاح"});
            setDeleteFaqAlert(null);
        }
    };

    if (isLoading) {
        return <SupportLoading />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground">مركز الدعم الفني</h1>
                    <p className="text-muted-foreground mt-1">إدارة تذاكر الدعم والأسئلة الشائعة لتقديم أفضل مساعدة.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">التذاكر المفتوحة</CardTitle><Inbox className="text-red-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.open}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">قيد المعالجة</CardTitle><Timer className="text-amber-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.inProgress}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">أُغلقت اليوم</CardTitle><CheckCircle2 className="text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold">+{stats.closedToday}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">متوسط وقت الرد</CardTitle><Clock className="text-blue-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgResponseTime}</div></CardContent></Card>
            </div>
            
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} dir="rtl">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tickets" className="gap-2"><Inbox/> تذاكر الدعم</TabsTrigger>
                    <TabsTrigger value="faq" className="gap-2"><HelpCircle/> قاعدة المعرفة (FAQ)</TabsTrigger>
                </TabsList>
                <TabsContent value="tickets" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-grow">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="ابحث برقم التذكرة، اسم العميل، أو الموضوع..." value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} className="pr-10" />
                                </div>
                                <Select value={filters.status} onValueChange={v => setFilters(f => ({...f, status: v}))}><SelectTrigger className="w-full sm:w-48"><div className="flex items-center gap-2"><Filter/> <SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem>{Object.entries(statusMap).map(([key, val]) => <SelectItem key={key} value={key}>{val.label}</SelectItem>)}</SelectContent></Select>
                                <Select value={filters.priority} onValueChange={v => setFilters(f => ({...f, priority: v}))}><SelectTrigger className="w-full sm:w-48"><div className="flex items-center gap-2"><Filter/> <SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">كل الأولويات</SelectItem>{Object.entries(priorityMap).map(([key, val]) => <SelectItem key={key} value={key}>{val.label}</SelectItem>)}</SelectContent></Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow>
                                        <TableHead className="text-center">رقم التذكرة</TableHead>
                                        <TableHead className="text-center">الموضوع</TableHead>
                                        <TableHead className="text-center">العميل</TableHead>
                                        <TableHead className="text-center">الأولوية</TableHead>
                                        <TableHead className="text-center">الحالة</TableHead>
                                        <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                        {filteredTickets.map(t => {
                                            const PriorityIcon = priorityMap[t.priority].icon;
                                            return (
                                                <TableRow key={t.id} onClick={() => setSelectedTicket(t)} className="cursor-pointer">
                                                    <TableCell className="text-center font-mono">{t.id}</TableCell>
                                                    <TableCell className="text-center font-medium">{t.subject}</TableCell>
                                                    <TableCell className="text-center">{t.userName}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className={cn("flex items-center justify-center gap-1", priorityMap[t.priority].color)}>
                                                            <PriorityIcon className="h-4 w-4"/> {priorityMap[t.priority].label}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center"><Badge className={cn("text-white border-none", statusMap[t.status].color)}>{statusMap[t.status].label}</Badge></TableCell>
                                                    <TableCell className="text-center">{formatDistanceToNow(t.createdAt.toDate(), { addSuffix: true, locale: ar })}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="faq" className="mt-4">
                     <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>الأسئلة الشائعة</CardTitle>
                                <Button onClick={() => setFaqDialog({ open: true, isEditing: false, data: null })}><PlusCircle/>إضافة سؤال</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {faqCategories.map(category => (
                                    <div key={category}>
                                        <h3 className="font-bold my-4 text-primary">{category}</h3>
                                        {(faqs || []).filter(f => f.category === category).map(faq => (
                                             <AccordionItem value={faq.id} key={faq.id}>
                                                <AccordionTrigger className="text-right justify-between">
                                                    <div className="flex-1 text-right">{faq.question}</div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-4">
                                                    <p className="text-muted-foreground">{faq.answer}</p>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => { faqForm.reset(faq); setFaqDialog({ open: true, isEditing: true, data: faq }); }}><Edit/>تعديل</Button>
                                                        <Button variant="destructive" size="sm" onClick={() => setDeleteFaqAlert(faq)}><Trash/>حذف</Button>
                                                    </div>
                                                </AccordionContent>
                                             </AccordionItem>
                                        ))}
                                    </div>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {/* View Ticket Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl [&>button]:right-auto [&>button]:left-4" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">تفاصيل التذكرة: {selectedTicket?.id}</DialogTitle>
                        <DialogDescription className="text-right">{selectedTicket?.subject}</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User/>بيانات العميل</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div><strong>الاسم:</strong> {selectedTicket?.userName}</div>
                                <div><strong>البريد:</strong> {selectedTicket?.userEmail}</div>
                            </CardContent>
                        </Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MessageSquare/>نص المشكلة</CardTitle></CardHeader>
                            <CardContent><p className="text-sm text-muted-foreground">{selectedTicket?.description}</p></CardContent>
                        </Card>
                        <div className="space-y-4">
                            <h4 className="font-semibold">الردود</h4>
                            {selectedTicket?.replies.map((reply, i) => (
                                <div key={i} className="flex gap-3">
                                    <Avatar><AvatarFallback>{reply.authorName.charAt(0)}</AvatarFallback></Avatar>
                                    <div className="flex-1 p-3 rounded-lg bg-muted">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold">{reply.authorName}</span>
                                            <span className="text-muted-foreground">{formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true, locale: ar })}</span>
                                        </div>
                                        <p className="text-sm mt-1">{reply.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-3">
                                 <Avatar><AvatarFallback>أ</AvatarFallback></Avatar>
                                <div className="flex-1 space-y-2">
                                    <Textarea placeholder="اكتب ردك هنا..." />
                                    <div className="flex justify-between">
                                        <Button size="sm" variant="outline"><Paperclip/> إرفاق ملف</Button>
                                        <Button size="sm"><Send/> إرسال الرد</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add/Edit FAQ Dialog */}
            <Dialog open={faqDialog.open} onOpenChange={(open) => !open && setFaqDialog({ open: false, isEditing: false, data: null })}>
                <DialogContent dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>{faqDialog.isEditing ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</DialogTitle>
                    </DialogHeader>
                    <Form {...faqForm}>
                        <form onSubmit={faqForm.handleSubmit(handleFaqSubmit)} className="space-y-4">
                             <FormField control={faqForm.control} name="category" render={({ field }) => ( <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input {...field} placeholder="مثال: الدفع، الطلبات..." /></FormControl><FormMessage /></FormItem> )} />
                             <FormField control={faqForm.control} name="question" render={({ field }) => ( <FormItem><FormLabel>السؤال</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                             <FormField control={faqForm.control} name="answer" render={({ field }) => ( <FormItem><FormLabel>الإجابة</FormLabel><FormControl><Textarea {...field} className="min-h-32" /></FormControl><FormMessage /></FormItem> )} />
                             <DialogFooter><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose><Button type="submit">حفظ</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteFaqAlert} onOpenChange={(open) => !open && setDeleteFaqAlert(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right"><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start">
                        <AlertDialogAction onClick={confirmDeleteFaq}>تأكيد</AlertDialogAction>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
