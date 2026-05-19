export type DashboardStat = {
  label: string;
  value: string;
  delta: string;
  tone: "success" | "warning" | "neutral" | "danger";
};

export type ActivityRow = {
  id: string;
  title: string;
  subtitle: string;
  status: "published" | "draft" | "open" | "critical";
  updatedAt: string;
};

export const dashboardStats: DashboardStat[] = [
  { label: "Products", value: "42", delta: "+4 this week", tone: "success" },
  { label: "Plans", value: "16", delta: "2 drafts pending", tone: "warning" },
  { label: "Open Leads", value: "28", delta: "11 in last 24h", tone: "neutral" },
  { label: "Open Tickets", value: "7", delta: "2 high priority", tone: "danger" }
];

export const recentLeads: ActivityRow[] = [
  {
    id: "LD-9021",
    title: "Arjun Bansal",
    subtitle: "Bulk ASIC enquiry - 20 units",
    status: "open",
    updatedAt: "8m ago"
  },
  {
    id: "LD-9019",
    title: "Shivangi Jain",
    subtitle: "Hosting + maintenance package",
    status: "open",
    updatedAt: "21m ago"
  },
  {
    id: "LD-9014",
    title: "Rishabh Arora",
    subtitle: "Need ROI details for KAS rigs",
    status: "draft",
    updatedAt: "1h ago"
  }
];

export const recentTickets: ActivityRow[] = [
  {
    id: "TKT-4471",
    title: "Miner restart issue",
    subtitle: "Customer: Tejas Mining Works",
    status: "critical",
    updatedAt: "4m ago"
  },
  {
    id: "TKT-4468",
    title: "Firmware update requested",
    subtitle: "Customer: Fortuna Hash Labs",
    status: "open",
    updatedAt: "16m ago"
  },
  {
    id: "TKT-4463",
    title: "Power fluctuation alert",
    subtitle: "Customer: HashNest Mumbai",
    status: "published",
    updatedAt: "45m ago"
  }
];
