"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileTabBarProps {
  isLoggedIn: boolean;
}

export function MobileTabBar({ isLoggedIn }: MobileTabBarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const tabs = isLoggedIn
    ? [
        { href: "/", label: "Home", icon: "home" },
        { href: "/suppliers", label: "Suppliers", icon: "store" },
        { href: "/requests", label: "Requests", icon: "list" },
        { href: "/champions", label: "Champions", icon: "trophy" },
        { href: "/profile", label: "Profile", icon: "user" },
      ]
    : [
        { href: "/", label: "Home", icon: "home" },
        { href: "/suppliers", label: "Suppliers", icon: "store" },
        { href: "/requests", label: "Requests", icon: "list" },
        { href: "/champions", label: "Champions", icon: "trophy" },
        { href: "/login", label: "Log in", icon: "login" },
      ];

  return (
    <nav
      className="mobile-tab-bar flex sm:hidden"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`mobile-tab${isActive(tab.href) ? "active" : ""}`}
          aria-current={isActive(tab.href) ? "page" : undefined}
        >
          <TabIcon name={tab.icon} />
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function TabIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      </svg>
    ),
    store: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7l1.5-3h15L21 7" />
        <path d="M4 7v13h16V7" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
    list: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    ),
    user: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
    trophy: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4h12v4a6 6 0 0 1-12 0V4z" />
        <path d="M6 6H3v2a3 3 0 0 0 3 3" />
        <path d="M18 6h3v2a3 3 0 0 1-3 3" />
        <path d="M9 20h6M12 14v6" />
      </svg>
    ),
    login: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    ),
  };
  return <span className="mobile-tab-icon">{icons[name]}</span>;
}
