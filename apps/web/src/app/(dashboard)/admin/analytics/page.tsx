import { redirect } from 'next/navigation';

// Platform analytics now live on the admin Overview.
export default function AdminAnalyticsPage() {
  redirect('/admin');
}
