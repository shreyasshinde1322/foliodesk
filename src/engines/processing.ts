import type { ProcessingType } from "@/types/tools";

export interface ProcessingEngineDescriptor {
  id: string;
  type: ProcessingType;
  description: string;
  lazyModule?: string;
}

export const PROCESSING_ENGINES: ProcessingEngineDescriptor[] = [
  {
    id: "kdp-cover",
    type: "local",
    description: "Browser-side KDP cover calculation and template export.",
  },
];
