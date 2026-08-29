import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EnterSuccessPage() {
  return (
    <div className="glass mx-auto grid max-w-lg gap-4 rounded-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">You are in</h1>
      <p className="text-muted-foreground">
        Payment succeeded. Your product will appear in the current 48-hour
        league as soon as the webhook confirms it.
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild>
          <Link href="/">Start voting</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/rankings">See rankings</Link>
        </Button>
      </div>
    </div>
  );
}
