import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <AppShell
      brandHref="/admin"
      userLabel={profile.full_name || profile.email || "Admin"}
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/courses", label: "Courses" },
        { href: "/admin/students", label: "Students" },
        { href: "/settings", label: "Settings" },
      ]}
    >
      {children}
    </AppShell>
  );
}
