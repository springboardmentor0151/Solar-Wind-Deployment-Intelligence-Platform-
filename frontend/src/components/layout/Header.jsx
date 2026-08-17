import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, LogOut, User, UserCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { getMyNotifications } from "../../api/notificationApi.js";
import Badge from "../ui/Badge.jsx";

export default function Header({ title, onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => getMyNotifications(true),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const unreadCount = notifications?.length ?? 0;

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-1.5 text-ink-subtle hover:bg-surface-muted lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="/notifications"
          className="relative rounded-md p-2 text-ink-subtle hover:bg-surface-muted"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </a>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-surface-muted"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-[11px] font-semibold text-white">
              {user?.full_name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
            </div>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-none text-ink">
                {user?.full_name}
              </span>
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-md border border-border bg-white p-1 shadow-popover">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium text-ink">
                  {user?.full_name}
                </p>
                <p className="truncate text-xs text-ink-faint">{user?.email}</p>
                {user?.role?.name && (
                  <Badge tone="navy" className="mt-1.5">
                    {user.role.name}
                  </Badge>
                )}
              </div>
              <div className="my-1 h-px bg-border" />
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink hover:bg-surface-muted"
              >
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-danger-700 hover:bg-danger-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
