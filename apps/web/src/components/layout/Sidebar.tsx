'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 h-screen bg-slate-900 text-white flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♟</span>
          <div>
            <p className="font-bold text-sm">Chess School</p>
            <p className="text-slate-400 text-xs">{title}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {(item.badge ?? 0) > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span>→</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export function AdminSidebar() {
  const items: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/classes', label: 'Classes', icon: '🏫' },
    { href: '/admin/announcements', label: 'Announcements', icon: '📢' },
  ];
  return <Sidebar items={items} title="Admin" />;
}

export function TeacherSidebar() {
  const { unreadDms } = useNotificationStore();
  const items: NavItem[] = [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/teacher/classes', label: 'My Classes', icon: '🏫' },
    { href: '/teacher/messages', label: 'Messages', icon: '💬', badge: unreadDms },
    { href: '/teacher/content', label: 'Content', icon: '📄' },
  ];
  return <Sidebar items={items} title="Teacher" />;
}

export function StudentSidebar() {
  const { unreadDms, pendingChallenges } = useNotificationStore();
  const items: NavItem[] = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/student/classes', label: 'My Classes', icon: '🏫' },
    { href: '/student/games', label: 'Games', icon: '♟', badge: pendingChallenges },
    { href: '/student/messages', label: 'Messages', icon: '💬', badge: unreadDms },
    { href: '/student/content', label: 'My Content', icon: '📄' },
  ];
  return <Sidebar items={items} title="Student" />;
}
