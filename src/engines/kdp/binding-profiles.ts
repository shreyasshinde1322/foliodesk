import type { BindingType, InteriorType, PaperType } from "@/types/kdp";

export interface BindingProfile {
  id: BindingType;
  label: string;
  implemented: boolean;
  comingSoon?: boolean;
  interiors: InteriorType[];
  papersByInterior: Record<InteriorType, PaperType[]>;
}

export const BINDING_PROFILES: Record<BindingType, BindingProfile> = {
  paperback: {
    id: "paperback",
    label: "Paperback",
    implemented: true,
    interiors: ["black_and_white", "standard_color", "premium_color"],
    papersByInterior: {
      black_and_white: ["white", "cream", "groundwood"],
      standard_color: ["white"],
      premium_color: ["white"],
    },
  },
  hardcover: {
    id: "hardcover",
    label: "Hardcover",
    implemented: false,
    comingSoon: true,
    interiors: ["black_and_white", "standard_color", "premium_color"],
    papersByInterior: {
      black_and_white: ["white", "cream", "groundwood"],
      standard_color: ["white"],
      premium_color: ["white"],
    },
  },
};

export function getBindingProfile(binding: BindingType): BindingProfile {
  return BINDING_PROFILES[binding];
}

export function isBindingImplemented(binding: BindingType): boolean {
  return BINDING_PROFILES[binding].implemented;
}

export function papersFor(
  binding: BindingType,
  interior: InteriorType,
): PaperType[] {
  return BINDING_PROFILES[binding].papersByInterior[interior] ?? [];
}
