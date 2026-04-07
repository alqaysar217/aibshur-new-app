import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>مرحباً بك في لوحة التحكم</CardTitle>
                    <CardDescription>
                        هنا يمكنك إدارة جميع جوانب تطبيق أبشر.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>استخدم القائمة الجانبية للتنقل بين الأقسام المختلفة.</p>
                </CardContent>
            </Card>
        </div>
    )
}
