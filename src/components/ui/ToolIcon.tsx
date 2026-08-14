import { ToolIcon as DynamicToolIcon } from "@/components/icons/ToolVisual";
import type { ToolDefinition } from "@/types/tools";
import type { IconSize } from "@/components/icons/fileTypes";

export function ToolIcon({
  tool,
  size = "md",
  className,
}: {
  tool: ToolDefinition;
  size?: IconSize;
  className?: string;
}) {
  return <DynamicToolIcon className={className} size={size} tool={tool} />;
}

export { FileTypeIcon } from "@/components/icons/FileTypeIcon";
export { ToolVisual } from "@/components/icons/ToolVisual";
