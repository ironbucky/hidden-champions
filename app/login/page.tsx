import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="h-96 w-full max-w-md animate-pulse rounded-card bg-surface-2" />
    </main>
  );
}
