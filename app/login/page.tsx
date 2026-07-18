import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-12 text-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
