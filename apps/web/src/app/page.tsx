import Link from 'next/link';
import { Briefcase, Users, TrendingUp, Search, Shield, Bell, ChevronRight, CheckCircle2, Building2, Star } from 'lucide-react';

const STATS = [
  { value: '10,000+', label: 'Open Positions' },
  { value: '500+', label: 'Companies Hiring' },
  { value: '25,000+', label: 'Placements Made' },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Job Search',
    description: 'Filter by role, location, salary, and experience level to find the perfect match instantly.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    description: 'Get instant updates when your application status changes. Never miss an opportunity.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Shield,
    title: 'Verified Employers',
    description: 'Every company on our platform is vetted. Apply with confidence to legitimate roles.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: TrendingUp,
    title: 'Career Insights',
    description: 'Track your application pipeline and understand where you stand at every stage.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Building2,
    title: 'Top Companies',
    description: 'Connect directly with hiring managers at leading startups and Fortune 500 companies.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Users,
    title: 'Talent Pipeline',
    description: 'Recruiters get a powerful dashboard to post jobs, review applicants, and manage hiring.',
    color: 'bg-indigo-50 text-indigo-600',
  },
];

const HOW_IT_WORKS_CANDIDATE = [
  { step: '01', title: 'Create your profile', desc: 'Sign up as a job seeker in under 2 minutes.' },
  { step: '02', title: 'Browse & apply', desc: 'Search thousands of jobs and apply with one click.' },
  { step: '03', title: 'Track progress', desc: 'Monitor your applications in real-time on your dashboard.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">NexHire</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 80%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm font-medium mb-6 border border-white/20">
              <Star className="w-3.5 h-3.5 text-yellow-300" />
              Trusted by 25,000+ professionals
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Find Your Next<br />
              <span className="text-primary-200">Career Opportunity</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-10 max-w-xl leading-relaxed">
              Connect with top companies, track your applications in real-time, and land the role you deserve — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register?role=CANDIDATE"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-700 rounded-xl font-bold text-base hover:bg-primary-50 transition-colors shadow-lg shadow-primary-900/30"
              >
                Find Jobs <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register?role=RECRUITER"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-bold text-base hover:bg-white/10 transition-colors"
              >
                Post a Job
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-slate-700">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center px-4 sm:px-8">
                <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm sm:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to hire or get hired
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              NexHire brings candidates and recruiters together with a streamlined, modern platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all bg-white">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Get started in minutes</h2>
            <p className="text-slate-500 text-lg">Three simple steps to your next opportunity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-slate-200" />
            {HOW_IT_WORKS_CANDIDATE.map((item, i) => (
              <div key={item.step} className="relative text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-lg shadow-primary-200">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to take the next step?
          </h2>
          <p className="text-primary-100 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of professionals who found their dream job on NexHire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=CANDIDATE"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-700 rounded-xl font-bold hover:bg-primary-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Start Job Search
            </Link>
            <Link
              href="/register?role=RECRUITER"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Post a Job for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <Briefcase className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white">NexHire</span>
          </div>
          <p className="text-slate-500 text-sm">© 2025 NexHire. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
