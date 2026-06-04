import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <nav className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <span className="text-2xl font-bold text-primary-700">NexHire</span>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-primary-600 hover:text-primary-800 font-medium">
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          Find Your Next<br />
          <span className="text-primary-600">Career Opportunity</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Connect with top companies and land the job you deserve. Browse thousands of openings
          across every industry.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register?role=CANDIDATE"
            className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-lg transition-colors"
          >
            Find Jobs
          </Link>
          <Link
            href="/register?role=RECRUITER"
            className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 font-semibold text-lg transition-colors"
          >
            Post a Job
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { label: 'Open Positions', value: '10,000+' },
            { label: 'Companies Hiring', value: '500+' },
            { label: 'Placements Made', value: '25,000+' },
          ].map((stat) => (
            <div key={stat.label} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <p className="text-4xl font-bold text-primary-600 mb-2">{stat.value}</p>
              <p className="text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
