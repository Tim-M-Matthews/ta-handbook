/**
 * Replaces `content/pages/` with the handbook tree (run from repo root).
 * Varied Markdown bodies: `variantBody(slug)` in this file (never repeats each page `description` in the body).
 * Kitchen sink: `scripts/handbook-kitchen-sink.md` (loaded for `welcome/markdown-kitchen-sink.md`).
 *
 * Run: `node scripts/seed-handbook-placeholder.mjs`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve("content/pages");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KITCHEN_SINK_BODY = fs
  .readFileSync(path.join(__dirname, "handbook-kitchen-sink.md"), "utf8")
  .trim();

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function write(p, body) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body, "utf8");
}

function metaDoc({ title, order, description }) {
  const lines = ["---", `title: ${JSON.stringify(title)}`, `order: ${order}`];
  if (description) lines.push(`description: ${JSON.stringify(description)}`);
  lines.push("---", "", "_Placeholder — replace with final copy._", "");
  return lines.join("\n");
}

function hashSlug(slug) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Do not paste `description` into the body — it is shown under the title and in category/search cards. */
const DRAFT_BODY_LINE =
  "_Replace with final section copy. The line under the page title is only for listings._";

/** Varied Markdown bodies keyed by slug hash so pages look different across the handbook. */
const VARIANTS = [
  (_t, _d) =>
    `## Overview\n\n${DRAFT_BODY_LINE}\n\n### Checklist\n\n- [ ] Read this section end-to-end\n- [ ] Note questions for your supervisor\n- [ ] File any required acknowledgments\n`,
  (_t, _d) =>
    `${DRAFT_BODY_LINE}\n\n---\n\n> **Policy note:** This applies to all staff unless a written exception is on file with HR.\n\nFollow up in **TheraNest** or your team’s agreed channel.\n`,
  (_t, _d) =>
    `## Summary\n\n${DRAFT_BODY_LINE}\n\n| Step | Who |\n| --- | --- |\n| 1 | You — complete the task |\n| 2 | Supervisor — review if flagged |\n| 3 | HR — archive documentation |\n`,
  (_t, _d) =>
    `${DRAFT_BODY_LINE}\n\n### Quick links\n\n- [Handbook home](/)\n- [Search](/search)\n\n~~~text\nReminder: save drafts before switching devices.\n~~~\n`,
  (_t, _d) =>
    `### Context\n\n${DRAFT_BODY_LINE}\n\n1. **Prepare** materials and accounts.\n2. **Execute** the workflow with a witness if required.\n3. **Document** outcomes the same day when possible.\n`,
  (_t, _d) =>
    `${DRAFT_BODY_LINE}\n\n\`\`\`bash\n# Example: pull latest handbook content\ngit pull origin main\n\`\`\`\n\nThen refresh your browser.\n`,
  (_t, _d) =>
    `## What this covers\n\n${DRAFT_BODY_LINE}\n\n* * *\n\n~~Deprecated step~~ — replaced by the checklist above.\n`,
  (_t, _d) =>
    `${DRAFT_BODY_LINE}\n\n#### Exceptions\n\n- On-call staff: see the **after-hours** addendum.\n- Interns: co-sign with a licensed supervisor.\n\n> Questions? Start with your **pod lead** before escalating.\n`,
  (_t, _d) =>
    `## At a glance\n\n${DRAFT_BODY_LINE}\n\n| If… | Then… |\n| --- | --- |\n| Urgent safety | Call the on-call line |\n| Billing question | Email billing@ (no PHI) |\n| HR paperwork | Open a ticket in the HR portal |\n`,
  (_t, _d) =>
    `${DRAFT_BODY_LINE}\n\n- **Do**\n  - Confirm identity before discussing a case.\n  - Log access in the shared audit sheet.\n- **Don’t**\n  - Share credentials.\n  - Store PHI in personal cloud folders.\n`,
  (_t, _d) =>
    `### Overview\n\n${DRAFT_BODY_LINE}\n\n\`HIPAA\` and \`FERPA\` rules still apply when examples mention schools or minors.\n\n---\n\n_Last reviewed: placeholder — replace with a real date._\n`,
  (_t, _d) =>
    `${DRAFT_BODY_LINE}\n\n#### Code sample (TypeScript)\n\n\`\`\`typescript\ninterface Ack {\n  signedAt: string;\n  employeeId: string;\n}\n\nexport function isComplete(a: Ack): boolean {\n  return Boolean(a.signedAt && a.employeeId);\n}\n\`\`\`\n`,
];

function variantBody(slug, title, description) {
  void description;
  const idx = hashSlug(slug) % VARIANTS.length;
  return VARIANTS[idx](title, description);
}

function pageDoc(pg) {
  const md =
    typeof pg.body === "string" && pg.body.trim() !== ""
      ? pg.body.trim()
      : variantBody(pg.slug, pg.title, pg.description);
  return [
    "---",
    `title: ${JSON.stringify(pg.title)}`,
    `order: ${pg.order}`,
    `description: ${JSON.stringify(pg.description)}`,
    "---",
    "",
    md.endsWith("\n") ? md : `${md}\n`,
  ].join("\n");
}

/** @typedef {{ slug: string, title: string, description: string, body?: string }} PageDef */
/** @typedef {{ id: string, title: string, order: number, description?: string, pages: PageDef[] }} SubDef */
/** @typedef {{ id: string, title: string, order: number, description?: string, subs?: SubDef[], pages?: PageDef[] }} Cat */

/** @type {Cat[]} */
const categories = [
  {
    id: "welcome",
    title: "Welcome",
    order: 10,
    description:
      "Brief orientation to Triangle ACT, the purpose of the handbook, and the practice’s overall values.",
    pages: [
      {
        slug: "markdown-kitchen-sink",
        title: "Markdown kitchen sink",
        description: "Minimal samples of supported handbook blocks.",
        body: KITCHEN_SINK_BODY,
      },
      {
        slug: "welcome-to-triangle-act",
        title: "Welcome to Triangle ACT",
        description: "Intro to the practice and how to use the handbook.",
      },
      {
        slug: "mission-values-approach",
        title: "Mission, Values & Approach",
        description:
          "Overview of Triangle ACT’s work, culture, and approach to assessment, coaching, and therapy.",
      },
      {
        slug: "professional-expectations",
        title: "Professional Expectations",
        description:
          "General expectations for communication, reliability, respect, confidentiality, and professionalism.",
      },
    ],
  },
  {
    id: "employment",
    title: "Employment",
    order: 20,
    description:
      "Covers the employee experience from hiring through offboarding, including core employment policies, training, and professional development.",
    subs: [
      {
        id: "employment-basics",
        title: "Employment Basics",
        order: 10,
        pages: [
          {
            slug: "roles-responsibilities",
            title: "Roles & Responsibilities",
            description:
              "Overview of staff roles, scope of work, and role-specific expectations.",
          },
          {
            slug: "work-hours-attendance",
            title: "Work Hours, Attendance & Availability",
            description:
              "Scheduling expectations, absences, availability, and communication about changes.",
          },
          {
            slug: "pay-payroll-reimbursements",
            title: "Pay, Payroll & Reimbursements",
            description: "Pay timing, timesheets, payroll questions, and expense reimbursements.",
          },
          {
            slug: "time-off-leave",
            title: "Time Off & Leave",
            description: "PTO, sick time, holidays, office closures, and leave requests.",
          },
        ],
      },
      {
        id: "onboarding-offboarding",
        title: "Onboarding & Offboarding",
        order: 20,
        pages: [
          {
            slug: "new-employee-checklist",
            title: "New Employee Checklist",
            description:
              "Paperwork, account setup, training, introductions, and first-week tasks.",
          },
          {
            slug: "required-training",
            title: "Required Training",
            description:
              "HIPAA, privacy, mandated reporting, systems training, and role-specific training.",
          },
          {
            slug: "account-system-setup",
            title: "Account & System Setup",
            description:
              "Email, calendar, TheraNest, shared files, password manager, and related tools.",
          },
          {
            slug: "offboarding-procedures",
            title: "Offboarding Procedures",
            description:
              "Resignation, client transitions, return of property, and removal of system access.",
          },
        ],
      },
      {
        id: "supervision-development",
        title: "Supervision & Development",
        order: 30,
        pages: [
          {
            slug: "supervision-consultation",
            title: "Supervision & Consultation",
            description:
              "Supervision expectations, case consultation, and when to seek guidance.",
          },
          {
            slug: "scope-practice-licensure",
            title: "Scope of Practice & Licensure",
            description:
              "Working within competence, maintaining credentials, and reporting license or credential changes.",
          },
          {
            slug: "continuing-education-training",
            title: "Continuing Education & Training Requests",
            description:
              "CE expectations, training requests, conferences, and professional development support.",
          },
        ],
      },
      {
        id: "employee-support-accommodations",
        title: "Employee Support & Accommodations",
        order: 40,
        pages: [
          {
            slug: "employee-accommodations",
            title: "Employee Accommodations",
            description:
              "Explains how employees may request reasonable workplace accommodations.",
          },
          {
            slug: "employee-concerns-support",
            title: "Employee Concerns & Support",
            description:
              "Provides guidance for raising workplace concerns, requesting support, or asking employment-related questions.",
          },
        ],
      },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    order: 30,
    description:
      "Covers how staff communicate internally, coordinate care, attend meetings, and maintain continuity when responsibilities overlap.",
    pages: [
      {
        slug: "communication-channels",
        title: "Communication Channels",
        description:
          "Explains what belongs in email, phone, TheraNest, shared documents, meetings, or other internal tools.",
      },
      {
        slug: "response-time-expectations",
        title: "Response Time Expectations",
        description:
          "Sets expectations for internal messages, client-related questions, urgent issues, and non-urgent administrative matters.",
      },
      {
        slug: "meetings-case-consultation",
        title: "Meetings & Case Consultation",
        description:
          "Covers staff meetings, consultation meetings, supervision meetings, attendance, preparation, and follow-up.",
      },
      {
        slug: "coverage-backup-procedures",
        title: "Coverage & Backup Procedures",
        description:
          "Explains who covers what when someone is out, unavailable, or dealing with an urgent matter.",
      },
      {
        slug: "internal-referrals-case-coordination",
        title: "Internal Referrals & Case Coordination",
        description:
          "Explains how staff coordinate care, refer clients internally, and communicate across service lines.",
      },
    ],
  },
  {
    id: "client-care",
    title: "Client Care",
    order: 40,
    description:
      "Covers the standards, workflows, and clinical expectations related to client-facing care.",
    subs: [
      {
        id: "services",
        title: "Services",
        order: 10,
        pages: [
          {
            slug: "assessment-services",
            title: "Assessment Services",
            description:
              "Assessment workflow, reports, documentation expectations, and family/referral communication.",
          },
          {
            slug: "therapy-services",
            title: "Therapy Services",
            description:
              "Therapy expectations, treatment documentation, communication boundaries, and continuity of care.",
          },
          {
            slug: "coaching-services",
            title: "Coaching Services",
            description: "Coaching scope, documentation expectations, and how coaching differs from therapy.",
          },
        ],
      },
      {
        id: "client-care-standards",
        title: "Client Care Standards",
        order: 20,
        pages: [
          {
            slug: "client-communication",
            title: "Client Communication",
            description:
              "Communication with clients, parents, guardians, schools, and outside providers.",
          },
          {
            slug: "consent-confidentiality-client-rights",
            title: "Consent, Confidentiality & Client Rights",
            description:
              "Informed consent, client rights, releases of information, and privacy expectations.",
          },
          {
            slug: "clinical-documentation",
            title: "Clinical Documentation",
            description: "Notes, reports, treatment plans, assessment records, and timely documentation.",
          },
          {
            slug: "continuity-care-client-transitions",
            title: "Continuity of Care & Client Transitions",
            description: "Coverage, referrals, case transfer, discharge, and clinician transitions.",
          },
        ],
      },
      {
        id: "working-with-minors-families-schools",
        title: "Working with Minors, Families & Schools",
        order: 30,
        pages: [
          {
            slug: "working-with-parents-guardians",
            title: "Working with Parents and Guardians",
            description:
              "Covers consent, communication expectations, parent involvement, and documentation.",
          },
          {
            slug: "separated-divorced-parents",
            title: "Separated or Divorced Parents",
            description:
              "Provides guidance for custody questions, consent, access to records, and communication boundaries.",
          },
          {
            slug: "school-communication",
            title: "School Communication",
            description:
              "Explains communication with teachers, school counselors, administrators, IEP/504 teams, and testing accommodation contacts.",
          },
          {
            slug: "coordination-outside-providers",
            title: "Coordination with Outside Providers",
            description:
              "Covers communication with pediatricians, psychiatrists, therapists, tutors, occupational therapists, speech therapists, and other providers.",
          },
        ],
      },
      {
        id: "clinical-risk",
        title: "Clinical Risk",
        order: 40,
        pages: [
          {
            slug: "clinical-crisis-procedures",
            title: "Clinical Crisis Procedures",
            description:
              "Suicidal ideation, self-harm, threats of harm, urgent concerns, consultation, and documentation.",
          },
          {
            slug: "after-hours-boundaries",
            title: "After-Hours Boundaries",
            description: "Expectations for after-hours communication and urgent messages.",
          },
          {
            slug: "threats-harm-safety-concerns",
            title: "Threats of Harm or Safety Concerns",
            description:
              "Procedures for responding to threats of harm, serious safety concerns, and situations requiring escalation.",
          },
        ],
      },
      {
        id: "ethics-boundaries",
        title: "Ethics & Boundaries",
        order: 50,
        pages: [
          {
            slug: "professional-boundaries",
            title: "Professional Boundaries",
            description:
              "Covers dual relationships, gifts, online contact, social media, and personal relationships with clients or families.",
          },
          {
            slug: "ethical-decision-making",
            title: "Ethical Decision-Making",
            description: "Gives staff a simple framework for raising ethical questions and seeking consultation.",
          },
          {
            slug: "conflicts-of-interest",
            title: "Conflicts of Interest",
            description: "Explains when staff should disclose possible conflicts.",
          },
          {
            slug: "gifts-from-clients-families",
            title: "Gifts from Clients or Families",
            description: "Provides practical guidance on accepting, declining, or documenting gifts.",
          },
        ],
      },
    ],
  },
  {
    id: "client-workflow",
    title: "Client Workflow",
    order: 50,
    description:
      "Covers the main administrative workflows that move clients from inquiry to active care and ongoing billing.",
    pages: [
      {
        slug: "new-client-inquiry-intake",
        title: "New Client Inquiry & Intake Workflow",
        description: "How inquiries are received, screened, routed, and documented.",
      },
      {
        slug: "forms-client-portal-setup",
        title: "Forms & Client Portal Setup",
        description: "Intake paperwork, portal invitations, required forms, and troubleshooting.",
      },
      {
        slug: "scheduling-calendar-management",
        title: "Scheduling & Calendar Management",
        description:
          "Appointments, cancellations, no-shows, clinician availability, and calendar updates.",
      },
      {
        slug: "payments-insurance-billing",
        title: "Payments, Insurance & Billing",
        description: "Payment collection, insurance verification, claims, balances, and billing communication.",
      },
      {
        slug: "good-faith-estimates-cost-transparency",
        title: "Good Faith Estimates & Cost Transparency",
        description:
          "Procedures for communicating expected costs, financial responsibility, and required notices when applicable.",
      },
    ],
  },
  {
    id: "privacy-compliance",
    title: "Privacy & Compliance",
    order: 60,
    description:
      "Covers legal, ethical, privacy, and security responsibilities across the practice.",
    pages: [
      {
        slug: "hipaa-confidentiality",
        title: "HIPAA & Confidentiality",
        description: "Plain-language overview of privacy responsibilities and confidentiality expectations.",
      },
      {
        slug: "digital-security",
        title: "Digital Security",
        description:
          "Passwords, two-factor authentication, devices, email, file sharing, and secure communication.",
      },
      {
        slug: "release-of-information-procedures",
        title: "Release of Information Procedures",
        description: "Covers how authorizations are obtained, documented, reviewed, and used.",
      },
      {
        slug: "records-requests",
        title: "Records Requests",
        description:
          "Explains how clients, guardians, attorneys, schools, or outside providers may request records.",
      },
      {
        slug: "incident-reporting",
        title: "Incident Reporting",
        description:
          "Privacy concerns, documentation errors, security issues, suspected breaches, and escalation.",
      },
      {
        slug: "mandated-reporting-legal-requests",
        title: "Mandated Reporting & Legal Requests",
        description: "Mandated reporting, subpoenas, records requests, and when staff should escalate.",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    order: 70,
    description:
      "Covers the tools, systems, office procedures, and physical resources staff use in day-to-day work.",
    subs: [
      {
        id: "systems-tools",
        title: "Systems & Tools",
        order: 10,
        pages: [
          {
            slug: "theranest-client-portal",
            title: "TheraNest & Client Portal",
            description: "Scheduling, documentation, billing, forms, and portal use.",
          },
          {
            slug: "email-calendar-shared-files",
            title: "Email, Calendar & Shared Files",
            description:
              "Internal communication, file organization, shared documents, and calendar expectations.",
          },
          {
            slug: "password-manager-account-access",
            title: "Password Manager & Account Access",
            description: "Credential storage, shared logins, permission levels, and access requests.",
          },
          {
            slug: "technology-troubleshooting-support",
            title: "Technology Troubleshooting & Support",
            description: "Basic troubleshooting steps and guidance on requesting technical support.",
          },
        ],
      },
      {
        id: "public-presence-website",
        title: "Public Presence & Website Updates",
        order: 20,
        pages: [
          {
            slug: "provider-bios-public-profiles",
            title: "Provider Bios & Public Profiles",
            description:
              "Covers how bios, headshots, credentials, specialties, and directory listings are created and updated.",
          },
          {
            slug: "website-content-requests",
            title: "Website and Content Requests",
            description:
              "Explains how staff request updates to services, staff profiles, forms, FAQs, or other public-facing content.",
          },
          {
            slug: "brand-voice-public-messaging",
            title: "Brand Voice and Public Messaging",
            description:
              "Keeps language consistent, professional, warm, and aligned with Triangle ACT’s tone.",
          },
        ],
      },
      {
        id: "office-operations",
        title: "Office Operations",
        order: 30,
        pages: [
          {
            slug: "office-use-supplies-equipment",
            title: "Office Use, Supplies & Equipment",
            description:
              "Room use, keys/access, shared spaces, supplies, printers, testing materials, and equipment.",
          },
          {
            slug: "office-safety-emergency-procedures",
            title: "Office Safety & Emergency Procedures",
            description:
              "Medical emergencies, weather closures, workplace safety concerns, and emergency contacts.",
          },
          {
            slug: "testing-materials-clinical-tools",
            title: "Testing Materials & Clinical Tools",
            description:
              "Covers secure storage, checkout procedures, scoring materials, and test integrity.",
          },
        ],
      },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    order: 80,
    description:
      "A centralized resource area for commonly used forms, records procedures, and required employee sign-offs.",
    pages: [
      {
        slug: "forms-library",
        title: "Forms Library",
        description: "Internal forms, client forms, consent forms, billing forms, and administrative templates.",
      },
      {
        slug: "records-management",
        title: "Records Management",
        description:
          "Client record organization, retention, records requests, and case closure documentation.",
      },
      {
        slug: "employee-acknowledgments",
        title: "Employee Acknowledgments",
        description:
          "Handbook acknowledgment, confidentiality agreement, HIPAA acknowledgment, technology agreement, and conflict of interest disclosure.",
      },
      {
        slug: "policy-updates-version-history",
        title: "Policy Updates & Version History",
        description: "Tracks major handbook updates, policy changes, and the date of the latest revision.",
      },
    ],
  },
];

rmrf(root);
fs.mkdirSync(root, { recursive: true });

write(
  path.join(root, "general", "_category-meta.md"),
  metaDoc({
    title: "General",
    order: 9990,
    description:
      "Fallback category for single-segment slugs. Prefer placing content under a named handbook section folder.",
  }),
);

for (const cat of categories) {
  const base = path.join(root, cat.id);
  write(path.join(base, "_category-meta.md"), metaDoc(cat));

  let o = 10;
  for (const pg of cat.pages ?? []) {
    write(path.join(base, `${pg.slug}.md`), pageDoc({ ...pg, slug: pg.slug, order: o }));
    o += 10;
  }

  for (const sub of cat.subs ?? []) {
    const subBase = path.join(base, sub.id);
    write(path.join(subBase, "_category-meta.md"), metaDoc(sub));
    let so = 10;
    for (const pg of sub.pages) {
      write(path.join(subBase, `${pg.slug}.md`), pageDoc({ ...pg, slug: pg.slug, order: so }));
      so += 10;
    }
  }
}

console.log("Wrote placeholder handbook under", root);
