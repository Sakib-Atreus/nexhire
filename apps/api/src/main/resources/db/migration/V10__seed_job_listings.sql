-- Seed realistic, fully populated job listings so the public job board is never empty.
-- Company names are fictional. Recruiter accounts use the reserved .example domain and a
-- random, undisclosed password, so nobody can sign in as them.

INSERT INTO users (id, email, password, first_name, last_name, role, phone, bio, headline,
                   avatar_url, enabled, email_verified, skills, portfolio_links)
VALUES
    ('a1000000-0000-4000-8000-000000000001', 'nusrat.jahan@corvana.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Nusrat', 'Jahan', 'RECRUITER', '+880 1711-204587',
     'Leads engineering hiring at Corvana Fintech. Previously built tech recruiting teams at two regional payment companies.',
     'Head of Talent, Corvana Fintech', NULL, TRUE, TRUE, '["Technical Recruiting","Employer Branding","Fintech"]', '[]'),
    ('a1000000-0000-4000-8000-000000000002', 'daniel.okafor@halvex.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Daniel', 'Okafor', 'RECRUITER', '+65 8123 4471',
     'Hires product and engineering talent across APAC for Halvex Health.',
     'Senior Talent Partner, Halvex Health', NULL, TRUE, TRUE, '["Remote Hiring","Healthtech","Product Recruiting"]', '[]'),
    ('a1000000-0000-4000-8000-000000000003', 'tahmid.rahman@lumora.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Tahmid', 'Rahman', 'RECRUITER', '+880 1819-552310',
     'Runs hiring for engineering, operations and customer experience at Lumora Commerce.',
     'Talent Acquisition Lead, Lumora Commerce', NULL, TRUE, TRUE, '["Campus Hiring","E-commerce","Operations Hiring"]', '[]'),
    ('a1000000-0000-4000-8000-000000000004', 'lena.fischer@quillstone.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Lena', 'Fischer', 'RECRUITER', '+49 30 2290 4418',
     'Builds Quillstone''s engineering and design teams across Europe.',
     'Engineering Recruiter, Quillstone Software', NULL, TRUE, TRUE, '["Engineering Recruiting","EU Hiring","Developer Relations"]', '[]'),
    ('a1000000-0000-4000-8000-000000000005', 'arjun.mehta@driftmark.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Arjun', 'Mehta', 'RECRUITER', '+65 9012 7735',
     'Hires operations and engineering leaders for Driftmark Logistics in Singapore and the Gulf.',
     'Talent Manager, Driftmark Logistics', NULL, TRUE, TRUE, '["Leadership Hiring","Logistics","Operations"]', '[]'),
    ('a1000000-0000-4000-8000-000000000006', 'sophie.hartley@verdantgrid.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Sophie', 'Hartley', 'RECRUITER', '+44 20 7946 0321',
     'Owns hiring for data and engineering at Verdant Grid Energy.',
     'People & Talent Lead, Verdant Grid Energy', NULL, TRUE, TRUE, '["Data Hiring","Climate Tech","Executive Search"]', '[]'),
    ('a1000000-0000-4000-8000-000000000007', 'maya.chen@orbitra.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Maya', 'Chen', 'RECRUITER', '+1 416 555 0182',
     'Recruits machine learning and quality engineering talent for Orbitra Labs.',
     'Technical Recruiter, Orbitra Labs', NULL, TRUE, TRUE, '["ML Recruiting","Contract Hiring","North America"]', '[]'),
    ('a1000000-0000-4000-8000-000000000008', 'farhana.akter@paxwell.example',
     '$2a$10$BYMacXgR/jmkp6roqBNK0eTqNjSsj6diUO4ZLlH64O8XCM5Csfegy', 'Farhana', 'Akter', 'RECRUITER', '+880 1913-778042',
     'Hires educators and engineers for Paxwell Learning.',
     'HR Business Partner, Paxwell Learning', NULL, TRUE, TRUE, '["Edtech","Part-time Hiring","Engineering Hiring"]', '[]')
ON CONFLICT (email) DO NOTHING;

INSERT INTO jobs (title, description, responsibilities, requirements, company_name, company_logo_url, location,
                  job_type, experience_level, salary_min, salary_max, salary_currency, status, tags, deadline,
                  view_count, screening_questions, recruiter_id, created_at, updated_at)
VALUES
-- ─── Corvana Fintech ────────────────────────────────────────────────────────
(
 'Senior Backend Engineer (Java / Spring Boot)',
 $$Corvana Fintech runs a merchant payments and wallet platform used by more than 40,000 small businesses across Bangladesh. Our backend processes over two million transactions a day, and reliability is the product.

You will join the Payments Core team, which owns transaction processing, ledgering and settlement. You will design services that move real money, so correctness, observability and clean failure handling matter more here than anywhere else.

What we offer: festival bonuses twice a year, health insurance for you and your family, a yearly learning budget, and a hybrid schedule with three office days in Gulshan.$$,
 $$Design, build and operate Spring Boot services for payment authorization, ledger posting and settlement
Lead technical design reviews and break large features into well-scoped milestones
Improve reliability with idempotency, retries, outbox patterns and clear alerting
Profile and tune PostgreSQL queries on high-volume transactional tables
Mentor two to three mid-level engineers through code review and pairing
Take part in a fair, well-documented on-call rotation (one week in six)$$,
 $$5+ years of professional backend development with Java 17+ and Spring Boot
Strong understanding of relational databases, transactions and isolation levels
Experience with message brokers such as RabbitMQ or Kafka
Experience running services in production with Docker and a major cloud provider
Clear written communication in English; Bangla is a plus
Experience with payments, banking or ledger systems is a strong advantage$$,
 'Corvana Fintech', 'https://ui-avatars.com/api/?name=Corvana+Fintech&background=0f766e&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh (Hybrid)', 'FULL_TIME', 'SENIOR', 2400000, 3600000, 'BDT', 'OPEN',
 'Java,Spring Boot,PostgreSQL,RabbitMQ,Microservices,Payments', CURRENT_DATE + 90, 412,
 '["Describe a production incident you owned end to end. What was the root cause and what did you change afterwards?","How would you guarantee a payment is never charged twice when the client retries?","What is your notice period?"]',
 'a1000000-0000-4000-8000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
),
(
 'Mobile Engineer (Flutter)',
 $$Our merchant app is how shop owners accept payments, track sales and request settlements. It is used daily on a wide range of Android devices, many of them entry-level phones on patchy mobile networks.

You will work in a cross-functional squad with a product manager, a designer and two backend engineers to ship features merchants rely on to run their business.

What we offer: festival bonuses, health insurance, a device allowance, and a hybrid schedule.$$,
 $$Build and maintain features in our Flutter merchant app for Android and iOS
Optimize app start time, memory use and offline behaviour on low-end devices
Integrate REST APIs and handle authentication, error states and retries gracefully
Write widget and integration tests and keep the CI pipeline green
Work with design to keep the app accessible and consistent with our design system$$,
 $$2–4 years of mobile development, with at least 1 year of Flutter in production
Solid knowledge of Dart, state management (Bloc or Riverpod) and asynchronous programming
Experience publishing and maintaining apps on Google Play
Understanding of mobile security basics such as secure storage and certificate pinning
A portfolio or published app you can walk us through$$,
 'Corvana Fintech', 'https://ui-avatars.com/api/?name=Corvana+Fintech&background=0f766e&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh (Hybrid)', 'FULL_TIME', 'MID', 1440000, 2160000, 'BDT', 'OPEN',
 'Flutter,Dart,Android,iOS,Bloc,REST APIs', CURRENT_DATE + 84, 287,
 '["Share a link to an app you have shipped and describe your contribution.","How do you handle state management in a large Flutter codebase?"]',
 'a1000000-0000-4000-8000-000000000001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
 'Risk & Fraud Data Analyst',
 $$As transaction volume grows, so do attempts to abuse the platform. The Risk team protects merchants and Corvana by detecting fraud patterns early and turning them into rules and models.

You will analyse transaction data, investigate suspicious activity and work with engineering to put new controls into production.

What we offer: festival bonuses, health insurance, and a yearly learning budget that covers certifications.$$,
 $$Monitor transaction patterns and investigate alerts for fraud, chargebacks and policy abuse
Write SQL and Python analyses to size risks and measure the impact of controls
Design and tune rule-based fraud checks together with the Payments Core team
Build dashboards that track loss rates, false positives and review queue health
Prepare clear weekly risk reports for leadership$$,
 $$2+ years in data analysis, ideally in fintech, banking or e-commerce
Advanced SQL and working knowledge of Python (pandas)
Experience with a BI tool such as Metabase, Looker or Power BI
Strong attention to detail and comfort explaining findings to non-technical colleagues
Bachelor's degree in Statistics, Economics, Computer Science or a related field$$,
 'Corvana Fintech', 'https://ui-avatars.com/api/?name=Corvana+Fintech&background=0f766e&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh', 'FULL_TIME', 'MID', 1200000, 1800000, 'BDT', 'OPEN',
 'SQL,Python,Fraud Detection,Data Analysis,Metabase', CURRENT_DATE + 81, 198,
 '["Describe an analysis that led to a measurable business decision.","How would you reduce false positives in a rule-based fraud system?"]',
 'a1000000-0000-4000-8000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'
),
-- ─── Halvex Health ──────────────────────────────────────────────────────────
(
 'Full Stack Engineer (React / Node.js)',
 $$Halvex Health connects patients with licensed doctors through video consultations, e-prescriptions and follow-up care across Southeast Asia. Our clinician dashboard is used by more than 1,500 doctors every day.

You will join the Clinician Experience team and own features end to end, from the database schema to the React interface doctors use during consultations.

What we offer: fully remote work within APAC time zones, a home-office stipend, a yearly team offsite, and paid medical cover.$$,
 $$Build features across our React (TypeScript) frontend and Node.js services
Design APIs and data models with privacy and auditability in mind
Improve performance and accessibility of the clinician dashboard
Write automated tests and take part in code review
Work directly with doctors during user research sessions$$,
 $$3+ years building production web applications with React and TypeScript
Experience with Node.js (NestJS or Express) and PostgreSQL
Good understanding of web security, authentication and role-based access control
Comfortable working asynchronously across time zones
Experience in healthcare or other regulated domains is a plus$$,
 'Halvex Health', 'https://ui-avatars.com/api/?name=Halvex+Health&background=2563eb&color=ffffff&size=128&bold=true',
 'Remote (APAC)', 'REMOTE', 'MID', 48000, 66000, 'USD', 'OPEN',
 'React,TypeScript,Node.js,NestJS,PostgreSQL,Healthtech', CURRENT_DATE + 88, 534,
 '["Which time zone will you work from?","Tell us about a feature you built end to end. What trade-offs did you make?"]',
 'a1000000-0000-4000-8000-000000000002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
),
(
 'Clinical Product Manager',
 $$We are looking for a product manager who understands how care is actually delivered. You will own the roadmap for prescriptions, lab orders and follow-up care, the part of Halvex that matters most to patient outcomes.

You will work with a medical advisory board, two engineering squads and our compliance team.

What we offer: a hybrid office in Singapore, medical and dental cover, and an annual performance bonus.$$,
 $$Own the product roadmap for prescriptions, lab orders and care plans
Turn clinical workflows into clear product requirements and success metrics
Work with compliance to meet regulatory requirements in each market
Run discovery with doctors, pharmacists and patients
Report on outcomes to the leadership team every quarter$$,
 $$5+ years of product management experience, with at least 2 in healthcare or healthtech
Proven record of shipping products in a regulated environment
Strong analytical skills and comfort with SQL or product analytics tools
Excellent stakeholder management and written communication
A clinical background (pharmacy, nursing or medicine) is highly valued$$,
 'Halvex Health', 'https://ui-avatars.com/api/?name=Halvex+Health&background=2563eb&color=ffffff&size=128&bold=true',
 'Singapore (Hybrid)', 'FULL_TIME', 'SENIOR', 120000, 150000, 'SGD', 'OPEN',
 'Product Management,Healthtech,Roadmapping,Compliance,Analytics', CURRENT_DATE + 95, 241,
 '["Do you have the right to work in Singapore?","Describe a product decision where clinical safety and user convenience were in tension."]',
 'a1000000-0000-4000-8000-000000000002', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'
),
-- ─── Lumora Commerce ────────────────────────────────────────────────────────
(
 'Frontend Engineer (Next.js)',
 $$Lumora Commerce is an online marketplace with more than 3,000 independent sellers and a million monthly shoppers. Page speed directly affects our revenue, and our storefront is built with Next.js.

You will join the Storefront team and work on product discovery, checkout and the seller dashboard.

What we offer: two festival bonuses, lunch at the office, health insurance, and a clear promotion framework.$$,
 $$Build fast, accessible pages in Next.js and TypeScript
Improve Core Web Vitals on product listing and checkout pages
Build and maintain shared components in our design system
Work with backend engineers on API contracts and caching
Instrument features and use data to guide improvements$$,
 $$2+ years of professional experience with React; Next.js experience strongly preferred
Strong HTML, CSS and accessibility fundamentals
Experience with Tailwind CSS or a similar utility-first approach
Understanding of server-side rendering, caching and performance budgets
Good communication skills in Bangla and English$$,
 'Lumora Commerce', 'https://ui-avatars.com/api/?name=Lumora+Commerce&background=c2410c&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh', 'FULL_TIME', 'MID', 1320000, 1920000, 'BDT', 'OPEN',
 'Next.js,React,TypeScript,Tailwind CSS,Web Performance', CURRENT_DATE + 80, 463,
 '["Share a link to a site or project you built with React or Next.js.","How would you improve the Largest Contentful Paint of a product listing page?"]',
 'a1000000-0000-4000-8000-000000000003', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
 'Customer Support Specialist (Bangla & English)',
 $$Our support team is the voice of Lumora for shoppers and sellers. You will help customers with orders, returns and payments over chat, email and phone, and turn what you hear into improvements across the company.

Rotating shifts are scheduled two weeks in advance, with transport provided for late shifts.

What we offer: shift allowance, festival bonuses, health insurance, and a clear path into team lead and operations roles.$$,
 $$Resolve customer and seller questions over chat, email and phone
Handle order issues, refunds and delivery problems within agreed response times
Write clear internal notes and escalate complex cases to the right team
Spot recurring problems and suggest improvements to our help centre
Meet quality and customer satisfaction targets$$,
 $$Excellent written and spoken Bangla and English
Comfortable using computers, ticketing tools and chat software
Calm, patient and empathetic with customers
Willing to work rotating shifts, including some weekends
HSC or above; previous customer service experience is a plus but not required$$,
 'Lumora Commerce', 'https://ui-avatars.com/api/?name=Lumora+Commerce&background=c2410c&color=ffffff&size=128&bold=true',
 'Chattogram, Bangladesh', 'FULL_TIME', 'ENTRY', 360000, 480000, 'BDT', 'OPEN',
 'Customer Support,Communication,Bangla,English,Zendesk', CURRENT_DATE + 74, 352,
 '["Are you comfortable working rotating shifts, including weekends?","Describe a time you calmed down an upset customer."]',
 'a1000000-0000-4000-8000-000000000003', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
),
(
 'Software Engineering Intern (6 months)',
 $$Our six-month internship is designed for final-year students and recent graduates who want real production experience. You will be paired with a mentor and ship code that customers use.

Most of our interns join full time after the programme.

What we offer: a monthly stipend, lunch at the office, a dedicated mentor, and a full-time offer for strong performers.$$,
 $$Ship small features and bug fixes in our web or backend codebase
Write tests and take part in code review
Join sprint planning, stand-ups and retrospectives
Present a project to the engineering team at the end of the internship$$,
 $$Final-year student or graduate in Computer Science, Software Engineering or a related field
Good grasp of data structures, algorithms and at least one programming language
Basic knowledge of Git and web development
Curiosity, reliability and willingness to ask questions
Available full time for six months starting next intake$$,
 'Lumora Commerce', 'https://ui-avatars.com/api/?name=Lumora+Commerce&background=c2410c&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh', 'INTERNSHIP', 'ENTRY', 240000, 300000, 'BDT', 'OPEN',
 'Internship,JavaScript,Java,Git,Graduate', CURRENT_DATE + 78, 689,
 '["What is your expected graduation date?","Share a GitHub link or a project you are proud of."]',
 'a1000000-0000-4000-8000-000000000003', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
),
(
 'Talent Acquisition Specialist',
 $$Lumora is growing its engineering, operations and customer experience teams. We are looking for a recruiter who can run hiring end to end and give every candidate a respectful, well-organised experience.

What we offer: festival bonuses, health insurance, and a hybrid schedule.$$,
 $$Run full-cycle hiring for engineering and operations roles
Write clear job descriptions together with hiring managers
Source candidates through referrals, job boards and LinkedIn
Coordinate interviews and keep candidates informed at every stage
Track hiring metrics and suggest improvements to the process$$,
 $$2+ years of recruiting experience, ideally in tech or e-commerce
Experience using an applicant tracking system
Strong organisational and communication skills
Comfortable negotiating offers and handling sensitive information
Bachelor's degree in any discipline$$,
 'Lumora Commerce', 'https://ui-avatars.com/api/?name=Lumora+Commerce&background=c2410c&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh (Hybrid)', 'FULL_TIME', 'MID', 900000, 1200000, 'BDT', 'OPEN',
 'Recruiting,Sourcing,HR,Interviewing,ATS', CURRENT_DATE + 85, 176,
 '["How many roles have you typically handled at the same time?","Which sourcing channels have worked best for you for technical roles?"]',
 'a1000000-0000-4000-8000-000000000003', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'
),
-- ─── Quillstone Software ────────────────────────────────────────────────────
(
 'Staff Platform Engineer (Kubernetes)',
 $$Quillstone builds developer tooling used by more than 9,000 engineering teams to review, test and release code. Our platform team runs the infrastructure behind it: multi-region Kubernetes clusters, CI runners and internal developer tooling.

As a Staff Engineer you will set technical direction for the platform and help other teams ship safely and quickly.

What we offer: 30 days of paid leave, a company pension scheme, an annual learning budget, and visa and relocation support.$$,
 $$Set the technical direction for compute, networking and deployment infrastructure
Lead the migration to a multi-region active-active setup
Improve developer experience through better tooling, templates and documentation
Define SLOs and drive reliability improvements across teams
Mentor senior engineers and contribute to engineering-wide architecture decisions$$,
 $$8+ years of software or infrastructure engineering experience
Deep hands-on experience with Kubernetes, Terraform and a major cloud (AWS or GCP)
Strong programming skills in Go, Python or a similar language
Track record of leading cross-team technical initiatives
Excellent written communication; most of our design work happens in documents$$,
 'Quillstone Software', 'https://ui-avatars.com/api/?name=Quillstone+Software&background=4338ca&color=ffffff&size=128&bold=true',
 'Berlin, Germany', 'FULL_TIME', 'LEAD', 95000, 120000, 'EUR', 'OPEN',
 'Kubernetes,Terraform,AWS,Go,Platform Engineering,SRE', CURRENT_DATE + 100, 318,
 '["Do you require visa sponsorship to work in Germany?","Describe the largest infrastructure migration you have led."]',
 'a1000000-0000-4000-8000-000000000004', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'
),
(
 'Developer Advocate',
 $$Developers are our customers. As a Developer Advocate you will help them succeed with Quillstone through tutorials, talks and sample projects, and bring their feedback back to our product team.

What we offer: fully remote work within Europe, a conference and travel budget, 30 days of paid leave, and a home-office stipend.$$,
 $$Write technical tutorials, guides and sample projects
Speak at meetups and conferences and run live workshops
Engage with our developer community on GitHub, Discord and forums
Gather product feedback and share it with product and engineering
Measure the reach and impact of developer content$$,
 $$3+ years as a software engineer, developer advocate or technical writer
Strong coding skills in JavaScript/TypeScript or Python
A portfolio of public technical content (blog posts, talks or open source)
Confident presenting to technical audiences
Able to travel up to 20% of the time$$,
 'Quillstone Software', 'https://ui-avatars.com/api/?name=Quillstone+Software&background=4338ca&color=ffffff&size=128&bold=true',
 'Remote (Europe)', 'REMOTE', 'MID', 65000, 80000, 'EUR', 'OPEN',
 'Developer Relations,TypeScript,Technical Writing,Public Speaking,Open Source', CURRENT_DATE + 90, 224,
 '["Share links to two pieces of technical content you created.","Which European country will you work from?"]',
 'a1000000-0000-4000-8000-000000000004', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'
),
(
 'Senior Product Designer',
 $$Our product is used by engineers every day, so the details matter. You will own the design of code review and release workflows, from early research to polished interfaces.

What we offer: a hybrid office in Berlin-Kreuzberg, 30 days of paid leave, a learning budget, and relocation support.$$,
 $$Lead design for code review and release management features
Run user research with engineering teams and turn insights into designs
Create flows, prototypes and high-fidelity designs in Figma
Contribute to and maintain our design system
Work closely with engineers through implementation and launch$$,
 $$5+ years of product design experience, ideally on complex B2B or developer tools
A strong portfolio showing end-to-end product work
Excellent interaction design and information architecture skills
Experience running usability tests and research interviews
Comfortable presenting and defending design decisions$$,
 'Quillstone Software', 'https://ui-avatars.com/api/?name=Quillstone+Software&background=4338ca&color=ffffff&size=128&bold=true',
 'Berlin, Germany (Hybrid)', 'FULL_TIME', 'SENIOR', 75000, 92000, 'EUR', 'OPEN',
 'Product Design,Figma,UX Research,Design Systems,B2B SaaS', CURRENT_DATE + 93, 297,
 '["Please share a link to your portfolio.","Walk us through a design decision you changed after user research."]',
 'a1000000-0000-4000-8000-000000000004', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'
),
-- ─── Driftmark Logistics ────────────────────────────────────────────────────
(
 'Operations Analyst',
 $$Driftmark Logistics moves freight for retailers and manufacturers across the Gulf and South Asia. Our Dubai hub coordinates warehousing, last-mile delivery and customs for more than 200 business customers.

You will help the operations team make faster, data-driven decisions.

What we offer: tax-free salary, annual flight allowance, medical insurance and 30 days of annual leave.$$,
 $$Track delivery performance, warehouse throughput and cost per shipment
Build and maintain operational dashboards and weekly reports
Investigate delays and recommend process improvements
Support capacity planning for peak seasons
Work with carriers and warehouse managers to resolve recurring issues$$,
 $$2+ years in operations, supply chain or business analysis
Advanced Excel and working knowledge of SQL
Experience with a BI tool such as Power BI or Tableau
Strong problem-solving skills and attention to detail
Experience in logistics or e-commerce is a plus$$,
 'Driftmark Logistics', 'https://ui-avatars.com/api/?name=Driftmark+Logistics&background=0369a1&color=ffffff&size=128&bold=true',
 'Dubai, UAE', 'FULL_TIME', 'MID', 180000, 240000, 'AED', 'OPEN',
 'Operations,Supply Chain,SQL,Power BI,Excel', CURRENT_DATE + 82, 205,
 '["Are you currently based in the UAE?","Describe a process improvement you led and its measurable result."]',
 'a1000000-0000-4000-8000-000000000005', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'
),
(
 'Engineering Manager, Routing',
 $$Our routing engine plans more than 60,000 deliveries a day. You will lead the team that builds it, a group of six engineers working on optimisation algorithms, real-time tracking and driver tools.

What we offer: a competitive salary with an annual bonus, medical and dental cover, and a hybrid office in Singapore.$$,
 $$Lead, hire and grow a team of six backend and optimisation engineers
Own delivery of the routing roadmap with product and operations
Ensure reliability of route planning during daily peak windows
Run regular one-to-ones, performance reviews and career conversations
Contribute to technical design and architectural decisions$$,
 $$7+ years in software engineering, including 2+ years managing engineers
Experience with distributed backend systems (Java, Kotlin or Go)
Familiarity with optimisation, routing or geospatial problems is a strong plus
Proven ability to deliver projects with cross-functional teams
Empathetic leadership style and clear communication$$,
 'Driftmark Logistics', 'https://ui-avatars.com/api/?name=Driftmark+Logistics&background=0369a1&color=ffffff&size=128&bold=true',
 'Singapore (Hybrid)', 'FULL_TIME', 'LEAD', 170000, 210000, 'SGD', 'OPEN',
 'Engineering Management,Kotlin,Go,Optimisation,Distributed Systems', CURRENT_DATE + 98, 264,
 '["How many engineers have you managed directly?","Do you have the right to work in Singapore?"]',
 'a1000000-0000-4000-8000-000000000005', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'
),
-- ─── Verdant Grid Energy ────────────────────────────────────────────────────
(
 'Data Engineer',
 $$Verdant Grid Energy helps solar and wind farm operators forecast output and trade energy more profitably. Our platform ingests readings from more than 4,000 sites every minute.

You will build the pipelines that turn raw sensor data into reliable datasets for our forecasting models and customer dashboards.

What we offer: a hybrid office in London, 28 days of leave plus bank holidays, a pension with 6% employer contribution, and private health insurance.$$,
 $$Build and maintain batch and streaming data pipelines
Model data in our warehouse for analytics and machine learning
Improve data quality checks, monitoring and documentation
Work with data scientists to bring forecasting models to production
Optimise pipeline cost and performance$$,
 $$3+ years of data engineering experience
Strong Python and SQL skills
Experience with Airflow or Dagster, and with dbt
Experience with a cloud data warehouse such as BigQuery or Snowflake
Interest in climate and energy is a plus$$,
 'Verdant Grid Energy', 'https://ui-avatars.com/api/?name=Verdant+Grid+Energy&background=15803d&color=ffffff&size=128&bold=true',
 'London, UK (Hybrid)', 'FULL_TIME', 'MID', 60000, 75000, 'GBP', 'OPEN',
 'Python,SQL,Airflow,dbt,BigQuery,Data Engineering', CURRENT_DATE + 87, 331,
 '["Do you have the right to work in the UK?","Describe a data pipeline you built, including its scale and how you monitored it."]',
 'a1000000-0000-4000-8000-000000000006', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
 'Head of Engineering',
 $$We are a Series B company with 35 engineers across data, platform and product teams. As Head of Engineering you will report to the CTO and lead the engineering organisation through its next stage of growth.

What we offer: a competitive salary plus meaningful equity, a hybrid office in London, private health insurance, and a pension with 6% employer contribution.$$,
 $$Lead and grow the engineering organisation, including four engineering managers
Own engineering processes, delivery practices and technical quality
Partner with product and data leadership on strategy and planning
Build a strong, inclusive hiring and career development framework
Manage the engineering budget and vendor relationships$$,
 $$12+ years in software engineering, including 5+ years leading managers
Experience scaling an engineering organisation at a growing product company
Strong technical background in distributed systems or data platforms
Excellent communication with both technical and executive audiences
Experience in energy, climate or industrial technology is a plus$$,
 'Verdant Grid Energy', 'https://ui-avatars.com/api/?name=Verdant+Grid+Energy&background=15803d&color=ffffff&size=128&bold=true',
 'London, UK (Hybrid)', 'FULL_TIME', 'EXECUTIVE', 140000, 165000, 'GBP', 'OPEN',
 'Engineering Leadership,Strategy,Hiring,Data Platforms,Climate Tech', CURRENT_DATE + 105, 189,
 '["What is the largest engineering organisation you have led?","Describe how you have changed delivery practices in a growing team."]',
 'a1000000-0000-4000-8000-000000000006', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'
),
-- ─── Orbitra Labs ───────────────────────────────────────────────────────────
(
 'Machine Learning Engineer (NLP)',
 $$Orbitra Labs builds document intelligence software that legal and insurance teams use to review contracts and claims. Our models extract and classify information from millions of pages each month.

You will join the Applied ML team and take models from experiment to production.

What we offer: a hybrid office in downtown Toronto, health and dental benefits, an RRSP match, and a dedicated GPU budget for experiments.$$,
 $$Train, evaluate and fine-tune NLP models for extraction and classification
Build evaluation datasets and track model quality over time
Deploy models as scalable, monitored services
Work with product teams to define problems and success metrics
Stay up to date with research and bring useful techniques into production$$,
 $$4+ years of machine learning experience, with a focus on NLP
Strong Python skills and experience with PyTorch
Experience with transformer models and fine-tuning
Experience deploying models to production (Docker, cloud ML services)
MSc or PhD in a related field is a plus, not a requirement$$,
 'Orbitra Labs', 'https://ui-avatars.com/api/?name=Orbitra+Labs&background=7c3aed&color=ffffff&size=128&bold=true',
 'Toronto, Canada (Hybrid)', 'FULL_TIME', 'SENIOR', 140000, 175000, 'CAD', 'OPEN',
 'Machine Learning,NLP,PyTorch,Python,MLOps,Transformers', CURRENT_DATE + 92, 476,
 '["Are you legally authorized to work in Canada?","Describe an NLP model you took to production and how you measured its quality."]',
 'a1000000-0000-4000-8000-000000000007', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
),
(
 'QA Automation Engineer (6-month contract)',
 $$We are expanding test coverage ahead of a major platform release. This six-month contract, with a possible extension, focuses on building a reliable end-to-end test suite for our web application and APIs.

What we offer: fully remote work within the Americas, flexible hours with a four-hour overlap with Eastern Time, and a possible extension or full-time conversion.$$,
 $$Design and build end-to-end tests with Playwright
Automate API tests and integrate them into CI pipelines
Identify flaky tests and improve test reliability
Work with engineers to define test strategies for new features
Report and track defects clearly$$,
 $$3+ years in QA automation
Strong experience with Playwright or Cypress and TypeScript
Experience testing REST APIs
Familiarity with GitHub Actions or another CI system
Able to work as an independent contractor$$,
 'Orbitra Labs', 'https://ui-avatars.com/api/?name=Orbitra+Labs&background=7c3aed&color=ffffff&size=128&bold=true',
 'Remote (Americas)', 'CONTRACT', 'MID', 70000, 90000, 'USD', 'OPEN',
 'QA Automation,Playwright,TypeScript,API Testing,CI/CD', CURRENT_DATE + 76, 258,
 '["Which country will you work from, and can you invoice as a contractor?","How do you approach fixing a flaky end-to-end test?"]',
 'a1000000-0000-4000-8000-000000000007', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
-- ─── Paxwell Learning ───────────────────────────────────────────────────────
(
 'Content Developer – Mathematics (Part-time)',
 $$Paxwell Learning helps more than 200,000 secondary school students prepare for SSC and HSC exams through video lessons and practice tests.

We are looking for a mathematics educator to create clear, engaging learning material. The role is part time (about 20 hours a week) with flexible hours.

What we offer: flexible hours, remote work with occasional studio sessions in Dhaka, and recognition as a featured instructor.$$,
 $$Write lesson scripts and practice questions aligned with the national curriculum
Record short video explanations in our Dhaka studio or from home
Review and improve existing content based on student feedback
Work with the product team to design interactive exercises$$,
 $$Bachelor's degree in Mathematics, Physics or Engineering
Strong command of SSC and HSC level mathematics
Clear communication in Bangla; good written English
Teaching or tutoring experience is preferred
Comfortable presenting on camera$$,
 'Paxwell Learning', 'https://ui-avatars.com/api/?name=Paxwell+Learning&background=b45309&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh / Remote', 'PART_TIME', 'ENTRY', 300000, 420000, 'BDT', 'OPEN',
 'Education,Mathematics,Content Writing,Teaching,Bangla', CURRENT_DATE + 79, 143,
 '["How many hours per week are you available?","Please share a sample lesson or explanation you have created."]',
 'a1000000-0000-4000-8000-000000000008', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'
),
(
 'DevOps Engineer',
 $$Exam season brings traffic spikes of more than ten times our normal load. Our DevOps engineer keeps the platform fast and available when students need it most.

What we offer: festival bonuses, health insurance, and a yearly learning budget for cloud certifications.$$,
 $$Manage our AWS infrastructure using Terraform
Maintain CI/CD pipelines for web, mobile and backend services
Set up monitoring, alerting and on-call runbooks
Plan capacity and run load tests ahead of exam seasons
Improve security, backups and cost efficiency$$,
 $$3+ years in DevOps, SRE or infrastructure roles
Hands-on experience with AWS (EC2, ECS or EKS, RDS, S3, CloudFront)
Experience with Terraform, Docker and GitHub Actions
Experience with Prometheus, Grafana or similar monitoring tools
AWS certification is a plus$$,
 'Paxwell Learning', 'https://ui-avatars.com/api/?name=Paxwell+Learning&background=b45309&color=ffffff&size=128&bold=true',
 'Dhaka, Bangladesh', 'FULL_TIME', 'MID', 1560000, 2280000, 'BDT', 'OPEN',
 'AWS,Terraform,Docker,CI/CD,Monitoring,DevOps', CURRENT_DATE + 86, 221,
 '["Describe how you prepared infrastructure for a large traffic spike.","Which AWS services have you run in production?"]',
 'a1000000-0000-4000-8000-000000000008', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
);
