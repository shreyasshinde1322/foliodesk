export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: "Is FolioDesk affiliated with Amazon?",
    answer:
      "No. FolioDesk is an independent toolkit. Amazon, Kindle, and KDP are trademarks of their respective owners. Always verify print files in KDP before publishing.",
  },
  {
    question: "Which tools are available today?",
    answer:
      "The KDP Cover Calculator is live and runs in your browser. Other listed tools are registered for the catalog and are not processing files yet.",
  },
  {
    question: "Are my files uploaded to a server?",
    answer:
      "It depends on the tool. The cover calculator processes your inputs locally in the browser and does not upload a manuscript. Future conversion tools may use temporary server processing; each tool page will say which model it uses.",
  },
  {
    question: "Can I use the cover calculator for hardcover?",
    answer:
      "Hardcover is listed in the same calculator. Paperback calculations are implemented; hardcover measurements are marked coming soon until published KDP hardcover specs are added.",
  },
  {
    question: "Do you guarantee KDP will accept my cover?",
    answer:
      "No. The calculator follows published KDP paperback formulas, but print files can still be rejected. Confirm the official KDP cover calculator and a proof copy.",
  },
];
