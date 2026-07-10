import type { Permission } from "./rbac";

// Primary navigation (App Flow §2 — Information Architecture).
// `icon` maps to a lucide icon key resolved in the Sidebar component.
export type NavItem = {
  label: string;
  href: string;
  icon: string;
  permission?: Permission;
  section: "operate" | "commerce" | "intelligence" | "admin";
  badgeKey?: "inbox" | "actions" | "approvals" | "overdue";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", section: "operate" },
  { label: "Inbox", href: "/inbox", icon: "Inbox", section: "operate", permission: "inbox.view", badgeKey: "inbox" },
  { label: "Actions", href: "/actions", icon: "Zap", section: "operate", permission: "action.review", badgeKey: "actions" },
  { label: "Tasks", href: "/tasks", icon: "CircleCheckBig", section: "operate", permission: "task.manage" },

  { label: "Quotes", href: "/quotes", icon: "FileText", section: "commerce", permission: "quote.manage" },
  { label: "Invoices", href: "/invoices", icon: "ReceiptText", section: "commerce", permission: "invoice.manage", badgeKey: "overdue" },
  { label: "Customers", href: "/customers", icon: "Users", section: "commerce", permission: "customer.manage" },
  { label: "Catalog", href: "/catalog", icon: "Package", section: "commerce", permission: "catalog.manage" },
  { label: "Documents", href: "/documents", icon: "FolderOpen", section: "commerce", permission: "document.manage" },

  { label: "Workflows", href: "/workflows", icon: "Workflow", section: "intelligence", permission: "workflow.manage" },
  { label: "Analytics", href: "/analytics", icon: "ChartColumn", section: "intelligence", permission: "analytics.view" },

  { label: "Settings", href: "/settings", icon: "Settings", section: "admin", permission: "settings.manage" },
  { label: "Billing", href: "/settings/billing", icon: "CreditCard", section: "admin", permission: "billing.manage" },
];

export const NAV_SECTIONS: { key: NavItem["section"]; label: string }[] = [
  { key: "operate", label: "Operate" },
  { key: "commerce", label: "Commerce" },
  { key: "intelligence", label: "Intelligence" },
  { key: "admin", label: "Administration" },
];
