export interface GuideEntry {
  slug: string;
  title: string;
  description: string;
  href: string;
}

export const GUIDES: GuideEntry[] = [
  {
    slug: "kdp-paperback-cover",
    title: "How to prepare a KDP paperback cover",
    description:
      "Trim size, spine width, bleed, and how this calculator builds a wrap template.",
    href: "/guides/kdp-paperback-cover",
  },
  {
    slug: "kdp-spine-width",
    title: "How KDP spine width is calculated",
    description:
      "The published page-count coefficients this tool uses, and why paper type changes the spine.",
    href: "/guides/kdp-paperback-cover#spine",
  },
];
