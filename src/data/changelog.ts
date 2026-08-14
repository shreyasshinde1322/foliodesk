export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  href: string;
  slug?: string;
  badge?: "New";
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-08-13",
    badge: "New",
    slug: "kdp-cover-calculator",
    title: "KDP Cover Calculator",
    description:
      "Calculate paperback cover dimensions and generate a printable wrap template from trim size, paper, and page count.",
    href: "/kdp-cover-calculator",
  },
];
