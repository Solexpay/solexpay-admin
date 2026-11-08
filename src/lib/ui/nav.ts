import {
  ArrowLeftRight,
  BadgePercent,
  BarChart3,
  Bell,
  CreditCard,
  Gift,
  HandCoins,
  LayoutDashboard,
  LifeBuoy,
  School,
  ScrollText,
  Send,
  ShieldCheck,
  User,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavIconProps {
  size?: number | string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export interface NavItem {
  route: string;
  label: string;
  icon: ComponentType<NavIconProps>;
  group: string;
  section?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    route: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "",
  },
  {
    route: "/users",
    label: "Users",
    icon: Users,
    group: "Customers",
    section: "users",
  },
  {
    route: "/kyc",
    label: "KYC queue",
    icon: ShieldCheck,
    group: "Customers",
    section: "kyc",
  },
  {
    route: "/schools",
    label: "Schools",
    icon: School,
    group: "Customers",
    section: "schools",
  },
  {
    route: "/support",
    label: "Support",
    icon: LifeBuoy,
    group: "Customers",
    section: "support",
  },
  {
    route: "/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    group: "Money",
    section: "transactions",
  },
  {
    route: "/loans",
    label: "Loans",
    icon: HandCoins,
    group: "Money",
    section: "loans",
  },
  {
    route: "/nip-transfers",
    label: "NIP transfers",
    icon: Send,
    group: "Money",
    section: "nip-transfers",
  },
  {
    route: "/gift-cards",
    label: "Gift cards",
    icon: Gift,
    group: "Money",
    section: "gift-cards",
  },
  {
    route: "/cards",
    label: "Card movements",
    icon: CreditCard,
    group: "Money",
    section: "cards",
  },
  {
    route: "/offers",
    label: "Offers",
    icon: BadgePercent,
    group: "Money",
    section: "offers",
  },
  {
    route: "/ops",
    label: "Operations",
    icon: Workflow,
    group: "Control",
    section: "ops",
  },
  {
    route: "/audit",
    label: "Audit ledger",
    icon: ScrollText,
    group: "Control",
    section: "audit",
  },
  {
    route: "/admins",
    label: "Admins",
    icon: UserCog,
    group: "Control",
    section: "admins",
  },
  {
    route: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    group: "Control",
    section: "analytics",
  },
  {
    route: "/settings/profile",
    label: "Profile",
    icon: User,
    group: "Account",
  },
  {
    route: "/settings/notifications",
    label: "Notifications",
    icon: Bell,
    group: "Account",
  },
] as const;
