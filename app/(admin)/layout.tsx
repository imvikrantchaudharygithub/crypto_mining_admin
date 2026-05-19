import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--admin-bg)" }}>
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-hidden">
        <Topbar />
        <main className="px-5 py-6 md:px-8 md:py-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
