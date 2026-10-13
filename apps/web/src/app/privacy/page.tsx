import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_EMAIL, LegalPage, type LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy · NexHire',
  description: 'What personal data NexHire collects, why, who can see it, and the choices you have.',
};

const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <p>
        NexHire is an online job portal and hiring workspace operated from Bangladesh. In this policy, “NexHire”, “we” and
        “us” mean the operator of the service. You can contact us about privacy at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <p>We collect only what we need to run the service:</p>
        <ul>
          <li><strong>Account details:</strong> your name, email address, password (stored only as a secure hash) and account type (job seeker or recruiter).</li>
          <li><strong>Profile details you add:</strong> headline, bio, location, phone number, skills, work experience, education, portfolio links, profile photo and resume.</li>
          <li><strong>Applications:</strong> the jobs you apply to, your cover letter, answers to screening questions and the status of each application.</li>
          <li><strong>Hiring activity:</strong> messages with hiring teams, interview invitations and your responses, and, for recruiters, the jobs you post and your company profile.</li>
          <li><strong>Preferences:</strong> saved jobs, job alerts, notification settings and your light/dark theme.</li>
          <li><strong>Technical data:</strong> basic logs such as IP address, browser type and error details, used to keep the service secure and working.</li>
        </ul>
        <p>We do not collect payment card details, and we do not use advertising or tracking cookies.</p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use your information',
    body: (
      <ul>
        <li>To create and secure your account and let you sign in.</li>
        <li>To show jobs, recommend roles that match your skills and send the job alerts you set up.</li>
        <li>To send your applications to the hiring team of the job you applied for.</li>
        <li>To let candidates and hiring teams message each other, schedule interviews and join video calls.</li>
        <li>To send service emails, such as email verification, password resets, application updates and job alerts.</li>
        <li>To prevent abuse (for example rate limiting and moderation of reported jobs) and to fix problems.</li>
      </ul>
    ),
  },
  {
    id: 'who-can-see',
    title: 'Who can see your information',
    body: (
      <>
        <ul>
          <li>
            <strong>When you apply to a job,</strong> the hiring team for that job (the recruiter and their company teammates)
            can see your application, profile, contact details and resume.
          </li>
          <li>
            <strong>Your public profile</strong> is off by default. If you turn it on, anyone with the link can see your name,
            headline, location, about, skills, experience, education and links, but never your email, phone number or resume.
          </li>
          <li>
            <strong>Job posts and company profiles</strong> are public, including the recruiter name shown on a job.
          </li>
          <li>
            <strong>Private hiring notes and ratings</strong> are visible only to the hiring team, never to candidates.
          </li>
          <li>
            <strong>Administrators</strong> of NexHire can access accounts and content when needed to run, secure and moderate
            the service.
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </>
    ),
  },
  {
    id: 'service-providers',
    title: 'Service providers',
    body: (
      <>
        <p>We use trusted providers to host and operate NexHire. They process data only to provide their service to us:</p>
        <ul>
          <li><strong>Hosting:</strong> Vercel (website) and Render (application server).</li>
          <li><strong>Database:</strong> Neon (PostgreSQL).</li>
          <li><strong>File storage:</strong> Backblaze B2 for resumes, profile photos and company logos.</li>
          <li><strong>Messaging:</strong> CloudAMQP, for delivering notifications inside the service.</li>
          <li><strong>Email:</strong> our email delivery provider, for the service emails described above.</li>
          <li><strong>Video calls:</strong> LiveKit, which carries the audio and video of interviews held in NexHire. Calls are not recorded.</li>
        </ul>
        <p>
          These providers may store data outside Bangladesh. If you subscribe to your NexHire calendar link in Google, Outlook
          or Apple Calendar, that calendar service receives your interview details under its own privacy policy.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: (
      <>
        <p>We use only what is needed for the site to work:</p>
        <ul>
          <li><strong>Sign-in cookies</strong> that keep you signed in (an access token for up to 1 day and a refresh token for up to 7 days).</li>
          <li><strong>Browser storage</strong> for preferences such as your theme, pipeline view and chosen camera and microphone.</li>
        </ul>
        <p>We do not use analytics, advertising or third-party tracking cookies.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep data',
    body: (
      <ul>
        <li>Your account, profile and applications are kept while your account is active.</li>
        <li>Read notifications are deleted automatically after 90 days.</li>
        <li>When your account is deleted, your profile and personal data are removed, except where we must keep limited records for legal, security or audit reasons.</li>
      </ul>
    ),
  },
  {
    id: 'your-choices',
    title: 'Your choices and rights',
    body: (
      <>
        <ul>
          <li>You can view and update most of your information on your <Link href="/profile">Profile</Link> page at any time.</li>
          <li>You can turn your public profile on or off, and change your notification settings and job alerts.</li>
          <li>Every job-alert email includes a one-click unsubscribe link.</li>
          <li>You can withdraw an application at any time.</li>
          <li>
            To get a copy of your data, correct something you can’t edit yourself, or delete your account, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond within 30 days.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        We protect your data with encrypted connections (HTTPS), hashed passwords, access controls that limit who can see
        each application, and rate limits against abuse. No online service can be completely secure, so please use a
        strong, unique password and keep it private.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Age requirement',
    body: (
      <p>
        NexHire is intended for people who are at least 16 years old, or the minimum working age where they live if that is
        higher. We do not knowingly collect information from younger children.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy as the service changes. We will update the date at the top, and for important changes we
        will let you know in the app or by email.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <p>
        Questions or requests about your privacy: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 13, 2026"
      intro={
        <p>
          This policy explains what personal information NexHire collects when you look for jobs or hire on our platform,
          why we collect it, who can see it, and the choices you have.
        </p>
      }
      sections={sections}
      related={{ href: '/terms', label: 'Read the Terms of Service' }}
    />
  );
}
