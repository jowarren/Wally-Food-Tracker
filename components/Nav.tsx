'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',        label: '📅 Week View' },
  { href: '/history', label: '📚 Food History' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-rose-500 text-white px-6 py-3 flex items-center gap-6 shadow-md">
      <span className="font-bold text-lg tracking-tight flex items-center gap-2">
        🍼 Wally Food Tracker
      </span>
      <div className="flex gap-1">
        {links.map(({ href, label }) => {
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
        })}
      </div>
    </nav>
  );
}
