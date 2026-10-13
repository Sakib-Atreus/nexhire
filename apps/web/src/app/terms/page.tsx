import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_EMAIL, LegalPage, type LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service · NexHire',
  description: 'The rules for using NexHire as a job seeker or employer.',
};

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Accepting these terms',
    body: (
      <p>
        By creating an account or using NexHire, you agree to these Terms of Service and to our{' '}
        <Link href="/privacy">Privacy Policy</Link>. If you don’t agree, please don’t use the service.
      </p>
    ),
  },
  {
    id: 'the-service',
    title: 'What NexHire provides',
    body: (
      <p>
        NexHire is a platform that connects job seekers with employers. Job seekers can search and apply for jobs and track
        their applications. Employers can post jobs, review applicants, message candidates and schedule interviews. NexHire
        is not an employer or recruitment agency, is not a party to any hiring decision or employment relationship, and does
        not guarantee that any job will be filled or that any candidate will be hired.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: (
      <ul>
        <li>You must be at least 16 years old, or the minimum working age where you live if that is higher.</li>
        <li>Give accurate information and keep it up to date.</li>
        <li>Keep your password private. You are responsible for activity under your account.</li>
        <li>One person per account; don’t share accounts or create them for someone else without permission.</li>
      </ul>
    ),
  },
  {
    id: 'job-seekers',
    title: 'Rules for job seekers',
    body: (
      <ul>
        <li>Your profile, resume and applications must be truthful and must be your own.</li>
        <li>When you apply, you allow the hiring team of that job to view and use your application to consider you for the role.</li>
        <li>Treat recruiters and interviewers with respect, including in messages and video calls.</li>
      </ul>
    ),
  },
  {
    id: 'employers',
    title: 'Rules for employers and recruiters',
    body: (
      <>
        <ul>
          <li>Post only real, currently open positions that you are authorized to recruit for.</li>
          <li>Describe jobs, pay and requirements accurately. Don’t post misleading, discriminatory or illegal job ads.</li>
          <li>Never ask candidates for money, bank details or payment to apply, interview or be hired.</li>
          <li>Use candidate information only to evaluate them for your open roles, keep it confidential, and follow applicable employment and data protection laws.</li>
          <li>Treat candidates fairly and respectfully, including in messages, interviews and stage updates.</li>
        </ul>
        <p>Company profiles may be verified by NexHire; verification is not an endorsement of the company or its jobs.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Post spam, scams, fake jobs or content that is unlawful, hateful, harassing or sexually explicit.</li>
          <li>Impersonate another person or company.</li>
          <li>Collect other users’ data by scraping, bots or any automated means, or use it for unrelated marketing.</li>
          <li>Try to break, overload or get around the security of the service, or access accounts that aren’t yours.</li>
          <li>Upload viruses or malicious files.</li>
        </ul>
        <p>
          You can report a job that breaks these rules with the “Report” link on the job page. We review reports and may hide
          content that breaks these terms.
        </p>
      </>
    ),
  },
  {
    id: 'your-content',
    title: 'Your content',
    body: (
      <p>
        You keep ownership of the content you add, such as your profile, resume, job posts and messages. You give NexHire
        permission to store, display and share it as needed to run the service, for example showing your job post to
        candidates or your application to the hiring team. You are responsible for having the right to share what you upload.
      </p>
    ),
  },
  {
    id: 'video-calls',
    title: 'Interviews and video calls',
    body: (
      <p>
        Video interviews run in private rooms that only invited participants can join. Calls are not recorded by NexHire.
        Don’t record a call without the consent of everyone in it. Interview scheduling depends on the information each side
        provides; NexHire is not responsible for missed or rescheduled interviews.
      </p>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension and termination',
    body: (
      <p>
        We may remove content, hide jobs, or suspend or close accounts that break these terms or put other users at risk. You
        can stop using NexHire at any time and ask us to delete your account by emailing{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <p>
        NexHire is provided “as is” and “as available”. We work to keep it reliable and secure, but we don’t guarantee it
        will always be available or error-free. We don’t verify every job post, profile or message, and we are not
        responsible for the content users post or for decisions made by employers or candidates. Always use your own judgment,
        and never share financial details or pay anyone to get a job.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <p>
        To the extent permitted by law, NexHire is not liable for indirect or consequential losses, lost opportunities, or
        losses caused by other users, arising from your use of the service.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as the service changes. We will update the date at the top, and for important changes we
        will let you know in the app or by email. Continuing to use NexHire after a change means you accept the updated terms.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    body: <p>These terms are governed by the laws of Bangladesh.</p>,
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <p>
        Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 13, 2026"
      intro={
        <p>
          These terms set the rules for using NexHire, whether you are looking for a job or hiring. Please read them together
          with our <Link href="/privacy" className="font-medium text-primary-600 hover:text-primary-700">Privacy Policy</Link>.
        </p>
      }
      sections={sections}
      related={{ href: '/privacy', label: 'Read the Privacy Policy' }}
    />
  );
}
