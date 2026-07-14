"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface MobileNavMenuProps {
  categories: Category[];
  isLoggedIn: boolean;
}

export function MobileNavMenu({ categories, isLoggedIn }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="relative flex items-center sm:hidden">
      <button
        ref={btnRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-surface text-fg hover:bg-surface-2 flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="14" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Navigation"
            className="border-border bg-surface fixed top-14 right-0 z-50 max-h-[calc(100vh-3.5rem)] w-[min(86vw,20rem)] overflow-y-auto border-b border-l p-3 shadow-lg sm:hidden"
          >
            <p className="eyebrow mb-2 px-1">Browse categories</p>
            <div className="grid grid-cols-2 gap-0.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/champions/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="rounded-input text-muted hover:bg-surface-2 hover:text-fg px-2.5 py-2 text-sm transition-colors"
                  role="menuitem"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <Link
              href="/suppliers"
              onClick={() => setOpen(false)}
              className="rounded-input border-border text-accent-ink hover:bg-surface-2 mt-1 block border-t px-2.5 py-2 text-sm font-medium transition-colors"
              role="menuitem"
            >
              All suppliers →
            </Link>

            <div className="bg-border my-3 h-px" />

            <p className="eyebrow mb-2 px-1">Account</p>
            <div className="flex flex-col gap-0.5">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/requests"
                    onClick={() => setOpen(false)}
                    className="rounded-input text-fg hover:bg-surface-2 px-2.5 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Requests
                  </Link>
                  <Link
                    href="/champions"
                    onClick={() => setOpen(false)}
                    className="rounded-input text-fg hover:bg-surface-2 px-2.5 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Champions
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="rounded-input text-fg hover:bg-surface-2 px-2.5 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/requests"
                    onClick={() => setOpen(false)}
                    className="rounded-input text-fg hover:bg-surface-2 px-2.5 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Requests
                  </Link>
                  <Link
                    href="/champions"
                    onClick={() => setOpen(false)}
                    className="rounded-input text-fg hover:bg-surface-2 px-2.5 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Champions
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-input text-fg hover:bg-surface-2 px-2.5 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="btn-primary mt-2 justify-center"
                    role="menuitem"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
