import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mt-12">الشروط والسياسات</h1>
      <p className="text-muted-foreground my-4">
        محتوى الشروط والسياسات سيعرض هنا.
      </p>
      <Button asChild variant="outline">
        <Link href="/register">العودة إلى التسجيل</Link>
      </Button>
    </div>
  );
}
