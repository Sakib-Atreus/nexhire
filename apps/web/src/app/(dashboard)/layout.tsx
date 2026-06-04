import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
