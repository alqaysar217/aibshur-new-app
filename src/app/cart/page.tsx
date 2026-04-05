import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mt-12">سلة المشتريات</h1>
      <p className="text-muted-foreground my-4">
        محتويات السلة ستعرض هنا.
      </p>
      <Button asChild variant="outline">
        <Link href="/home">العودة إلى الرئيسية</Link>
      </Button>
    </div>
  );
}
