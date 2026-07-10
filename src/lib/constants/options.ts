// Form option sets used across onboarding and settings.

export const INDUSTRIES = [
  "Wholesale & Distribution",
  "Retail",
  "Construction & Materials",
  "Healthcare & Clinics",
  "Professional Services",
  "Agency & Creative",
  "Travel & Tourism",
  "Home Services",
  "Manufacturing",
  "E-commerce",
  "Other",
];

export const COUNTRIES = [
  { code: "PK", name: "Pakistan", currency: "PKR", tz: "Asia/Karachi" },
  { code: "IN", name: "India", currency: "INR", tz: "Asia/Kolkata" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", tz: "Asia/Dubai" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", tz: "Asia/Riyadh" },
  { code: "BD", name: "Bangladesh", currency: "BDT", tz: "Asia/Dhaka" },
  { code: "US", name: "United States", currency: "USD", tz: "America/New_York" },
  { code: "GB", name: "United Kingdom", currency: "GBP", tz: "Europe/London" },
  { code: "NG", name: "Nigeria", currency: "NGN", tz: "Africa/Lagos" },
];

export const CURRENCIES = ["PKR", "INR", "AED", "SAR", "BDT", "USD", "GBP", "EUR", "NGN"];

export const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Dhaka",
  "America/New_York",
  "Europe/London",
  "Africa/Lagos",
  "UTC",
];

export const TEAM_SIZES = ["Just me", "2-10", "11-50", "51-200", "200+"];

export const ONBOARDING_GOALS = [
  { id: "faster_quotes", label: "Faster quotes", desc: "Turn inquiries into quotes in minutes.", icon: "Zap" },
  { id: "payment_followups", label: "Payment follow-ups", desc: "Recover cash with timely reminders.", icon: "Receipt" },
  { id: "doc_reminders", label: "Document reminders", desc: "Never miss a deadline or renewal.", icon: "FileText" },
  { id: "customer_inbox", label: "Customer inbox", desc: "One tidy queue for every channel.", icon: "Inbox" },
  { id: "general", label: "General operations", desc: "A bit of everything, organized.", icon: "LayoutDashboard" },
];
