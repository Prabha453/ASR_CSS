export const REPORT_SECTIONS = [
  {
    key: 'company',
    label: 'Company',
    icon: 'ri-building-line',
    reports: [
      { key: 'company-hierarchy', label: 'Company Hierarchy' },
      { key: 'company-information-client', label: 'Company Information / Client' },
      { key: 'registered-office', label: 'Registered Office' },
      { key: 'change-of-company-name', label: 'Change of Company Name' },
      { key: 'company-fees', label: 'Company Fees' },
      { key: 'company-events', label: 'Company Events' },
    ],
  },
  {
    key: 'officials-roles',
    label: 'Officials & Roles',
    icon: 'ri-user-star-line',
    reports: [
      { key: 'directors', label: 'Directors' },
      { key: 'secretaries', label: 'Secretaries' },
      { key: 'auditors', label: 'Auditors' },
      { key: 'ceo', label: 'CEO' },
      { key: 'chairman', label: 'Chairman' },
      { key: 'managers', label: 'Managers' },
      { key: 'president', label: 'President' },
      { key: 'treasurer', label: 'Treasurer' },
      { key: 'commissioner', label: 'Commissioner' },
      { key: 'legal-representative', label: 'Legal Representative' },
      { key: 'supervisor', label: 'Supervisor' },
      { key: 'general-manager', label: 'General Manager' },
      { key: 'agent', label: 'Agent' },
      { key: 'data-protection-officer', label: 'Data Protection Officer' },
      { key: 'fund-manager', label: 'Fund Manager' },
      { key: 'representative', label: 'Representative' },
      { key: 'resident-representative', label: 'Resident Representative' },
      { key: 'partner', label: 'Partner' },
      { key: 'owner', label: 'Owner' },
      { key: 'contact-person', label: 'Contact Person' },
    ],
  },
  {
    key: 'members-controllers',
    label: 'Members & Controllers',
    icon: 'ri-group-line',
    reports: [
      { key: 'members', label: 'Members' },
      { key: 'controllers', label: 'Controllers' },
      { key: 'registrable-controllers', label: 'Registrable Controllers' },
      { key: 'nominee-directors-nominators', label: 'Nominee Directors & Nominators' },
      { key: 'nominee-shareholders-nominators', label: 'Nominee Shareholders & Nominators' },
      { key: 'nominees-trustees', label: 'Nominees & Trustees' },
    ],
  },
  {
    key: 'shares-registers',
    label: 'Shares & Registers',
    icon: 'ri-stock-line',
    reports: [
      { key: 'share-certificate', label: 'Share Certificate Report' },
      { key: 'all-registers', label: 'All Register Reports' },
    ],
  },
  {
    key: 'individuals',
    label: 'Individuals',
    icon: 'ri-user-3-line',
    reports: [
      { key: 'individual-details', label: 'Individual Details' },
      { key: 'individual-contact-address', label: 'Individual Contact Address' },
      { key: 'individual-address', label: 'Individual Address' },
      { key: 'identification-expiry-dates', label: 'Identification Expiry Dates' },
    ],
  },
  {
    key: 'compliance-statutory',
    label: 'Compliance & Statutory',
    icon: 'ri-shield-check-line',
    reports: [
      { key: 'agm-ar-due', label: 'AGM & AR Due Report' },
      { key: 'key-dates', label: 'Key Dates' },
      { key: 'event-specific', label: 'Event Specific Report' },
    ],
  },
  {
    key: 'reminders-communications',
    label: 'Reminders & Communications',
    icon: 'ri-notification-3-line',
    reports: [
      { key: 'upcoming-event-reminders', label: 'Upcoming Event Reminders' },
      { key: 'reminder-sent-history', label: 'Reminder Sent History' },
      { key: 'email-sent-history', label: 'Email Sent History' },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: 'ri-settings-3-line',
    reports: [
      { key: 'all-documents', label: 'All Documents' },
      { key: 'user-management', label: 'User Management' },
      { key: 'user-log', label: 'User Log Report' },
    ],
  },
];

export const findReport = (sectionKey, reportKey) => {
  const section = REPORT_SECTIONS.find((item) => item.key === sectionKey);
  const report = section?.reports.find((item) => item.key === reportKey);
  return section && report ? { section, report } : null;
};
