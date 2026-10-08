import { redirect } from 'next/navigation';

// The admin overview (users, open jobs, platform pipeline) lives on /dashboard for admins;
// /admin itself goes straight to user management.
export default function AdminPage() {
  redirect('/admin/users');
}
