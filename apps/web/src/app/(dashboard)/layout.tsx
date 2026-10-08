import { AppShell } from '@/components/layout/AppShell';

// The shell (sidebar, top bar, mobile tab bar, auth guard) lives in a client component;
// <main> keeps `pb-24 lg:pb-10` there so content clears the mobile bottom nav.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
