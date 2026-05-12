'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const trackerLinks = [
  { href: '/', label: '📅 Week View' },
  { href: '/history', label: '📚 Food History' },
];

const plannerLinks = [
  { href: '/planner', label: '🗓️ Meal Planner' },
  { href: '/meal-library', label: '🍽️ Meal Library' },
  { href: '/ideas', label: '💡 Meal Ideas' },
];

export default function Nav() {
  const pathname = usePathname();

  function navLink(href: string, label: string) {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-rose-700 text-white'
            : 'text-rose-100 hover:text-white hover:bg-rose-600'
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav className="bg-rose-500 text-white px-6 py-3 flex items-center gap-6 shadow-md flex-wrap">
      <span className="font-bold text-lg tracking-tight flex items-center gap-2">
        🍼 Wally Food
      </span>
      <div className="flex gap-1 items-center">
        {trackerLinks.map(({ href, label }) => navLink(href, label))}
        <span className="mx-1 text-rose-300 text-sm">|</span>
        {plannerLinks.map(({ href, label }) => navLink(href, label))}
      </div>
    </nav>
  );
}
