import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Circle,
  FileText,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { fetchCoreBootstrap, logout } from "../api/client";
import type { NavigationItem } from "../api/types";


const icons: Record<string, LucideIcon> = {
  "building-2": Building2,
  "file-text": FileText,
  files: Files,
  "layout-dashboard": LayoutDashboard,
  settings: Settings,
};

type NavigationNode = NavigationItem & {
  children: NavigationNode[];
};

function buildNavigationTree(items: NavigationItem[]): NavigationNode[] {
  const nodes = new Map<string, NavigationNode>();

  for (const item of items) {
    nodes.set(item.key, { ...item, children: [] });
  }

  const roots: NavigationNode[] = [];

  for (const node of nodes.values()) {
    if (node.parent_key) {
      const parent = nodes.get(node.parent_key);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  const sortNodes = (nodeList: NavigationNode[]) => {
    nodeList.sort((left, right) => left.position - right.position);
    nodeList.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
}

function NavigationLink({
  item,
  onNavigate,
}: {
  item: NavigationNode;
  onNavigate: () => void;
}) {
  const Icon = icons[item.icon] ?? Circle;

  return (
    <li>
      <NavLink
        className={({ isActive }) =>
          `sidebar-link${isActive ? " sidebar-link--active" : ""}`
        }
        end={item.path === "/"}
        onClick={onNavigate}
        to={item.path}
      >
        <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
        <span>{item.label}</span>
      </NavLink>

      {item.children.length > 0 ? (
        <ul className="sidebar-submenu">
          {item.children.map((child) => (
            <NavigationLink item={child} key={child.key} onNavigate={onNavigate} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();

  const bootstrapQuery = useQuery({
    queryKey: ["core-bootstrap"],
    queryFn: fetchCoreBootstrap,
    staleTime: 60_000,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["core-bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["auth-session"] });
    },
  });

  const navigation = useMemo(
    () => buildNavigationTree(bootstrapQuery.data?.navigation ?? []),
    [bootstrapQuery.data?.navigation],
  );

  if (bootstrapQuery.isPending) {
    return (
      <div className="auth-state" role="status">
        <div className="auth-state__spinner" />
        <span>Loading the application…</span>
      </div>
    );
  }

  if (bootstrapQuery.isError) {
    return (
      <div className="auth-state auth-state--error" role="alert">
        <strong>The application shell could not be loaded.</strong>
        <button onClick={() => void bootstrapQuery.refetch()} type="button">
          Try again
        </button>
      </div>
    );
  }

  const bootstrap = bootstrapQuery.data;
  const currentItem = bootstrap.navigation.find((item) => item.path === location.pathname);
  const pageTitle = currentItem?.label ?? "Workspace";
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className={`app-shell${sidebarCollapsed ? " app-shell--collapsed" : ""}`}>
      <aside className={`sidebar${mobileSidebarOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            T
          </div>
          <div className="brand-copy">
            <strong>{bootstrap.configuration.site_name}</strong>
            <span>{bootstrap.configuration.sidebar_title}</span>
          </div>
          <button
            aria-label="Close navigation"
            className="icon-button sidebar-mobile-close"
            onClick={closeMobileSidebar}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="sidebar-navigation">
          <ul>
            {navigation.map((item) => (
              <NavigationLink item={item} key={item.key} onNavigate={closeMobileSidebar} />
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <span>Application shell</span>
          <small>Connected</small>
        </div>
      </aside>

      {mobileSidebarOpen ? (
        <button
          aria-label="Close navigation overlay"
          className="sidebar-overlay"
          onClick={closeMobileSidebar}
          type="button"
        />
      ) : null}

      <div className="app-frame">
        <header className="app-header">
          <div className="header-left">
            <button
              aria-label="Open navigation"
              className="icon-button mobile-menu-button"
              onClick={() => setMobileSidebarOpen(true)}
              type="button"
            >
              <Menu size={21} />
            </button>
            <button
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="icon-button desktop-collapse-button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              type="button"
            >
              <PanelLeftClose size={20} />
            </button>
            <div>
              <span className="header-eyebrow">
                {bootstrap.configuration.organization_name}
              </span>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="header-user">
            <div className="user-avatar" aria-hidden="true">
              {bootstrap.user.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="user-copy">
              <strong>{bootstrap.user.display_name}</strong>
              <span>{bootstrap.user.email || bootstrap.user.username}</span>
            </div>
            <button
              aria-label="Sign out"
              className="icon-button"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              title="Sign out"
              type="button"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="app-content">
          {logoutMutation.isError ? (
            <div className="notice notice--warning" role="alert">
              Sign out failed. Please try again.
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
