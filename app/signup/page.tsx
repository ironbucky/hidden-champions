"use client";

import { useActionState } from "react";
import { signUp } from "@/features/auth/actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="card w-full max-w-md overflow-hidden">
        <div className="ajrak-thin" aria-hidden="true" />
        <div className="p-5 sm:p-8">
          <h1 className="display text-2xl text-fg">Join Hidden Champions</h1>
          <p className="mt-2 text-sm text-muted">
            Sign up with your Pakistani phone number. The founder will verify you
            before you can upload or unlock contacts.
          </p>

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
                minLength={6}
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
              {pending ? "Signing up…" : "Sign up"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-accent-ink underline underline-offset-2">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
