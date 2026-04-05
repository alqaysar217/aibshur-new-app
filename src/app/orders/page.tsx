import { BottomNav } from "@/components/bottom-nav";
import { HomeHeader } from "@/components/home-header";

export default function OrdersPage() {
    return (
        <div className="bg-card min-h-screen pb-16">
            <HomeHeader />
            <main className="p-4 text-center mt-12">
                <h1 className="text-2xl font-bold">طلباتي</h1>
                <p className="text-muted-foreground mt-2">قائمة الطلبات ستظهر هنا.</p>
            </main>
            <BottomNav />
        </div>
    );
}
