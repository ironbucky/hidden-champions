"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { logIn } from "@/features/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(logIn, null);
  const searchParams = useSearchParams();
  const pendingParam = searchParams.get("pending");

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="card w-full max-w-md overflow-hidden">
        <div className="ajrak-thin" aria-hidden="true" />
        <div className="p-5 sm:p-8">
          <h1 className="display text-2xl text-fg">Log in</h1>

          {pendingParam && (
            <p className="mt-3 rounded-input bg-amber-bg p-3 text-sm text-amber-fg">
              Your account is pending founder verification. You can log in, but
              gated actions will be blocked until verified.
            </p>
          )}

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="phone" className="label">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="0300-1234567"
                className="input mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••"
                className="input mt-1"
              />
            </div>

            {state?.message && (
              <p className="text-sm text-terra-ink">{state.message}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full btn-primary disabled:opacity-50"
            >
              {pending ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-medium text-accent-ink underline underline-offset-2">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
