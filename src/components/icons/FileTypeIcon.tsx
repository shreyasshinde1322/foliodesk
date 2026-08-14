import { FILE_TYPE_META, ICON_PX, type IconSize } from "./fileTypes";
import type { FileFormat } from "@/types/tools";

export function FileTypeIcon({
  type,
  size = "md",
  className = "",
}: {
  type: FileFormat;
  size?: IconSize;
  className?: string;
  offset?: number;
}) {
  const meta = FILE_TYPE_META[type];
  const px = ICON_PX[size];
  const font = meta.label.length > 3 ? 8 : 9;

  return (
    <svg
      aria-hidden="true"
      className={className}
      height={px}
      viewBox="0 0 32 32"
      width={px}
    >
      <rect fill={meta.fill} height="32" rx="7" width="32" />
      <text
        fill="#fff"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize={font}
        fontWeight="700"
        letterSpacing="0.2"
        textAnchor="middle"
        x="16"
        y="21"
      >
        {meta.label}
      </text>
    </svg>
  );
}
