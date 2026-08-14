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
  const gradId = `ft-grad-${type}`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      height={px}
      viewBox="0 0 32 32"
      width={px}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <rect fill={meta.fill} height="32" rx="8" width="32" />
      <rect fill={`url(#${gradId})`} height="32" rx="8" width="32" />
      <rect
        fill="none"
        height="30"
        rx="7"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="1"
        width="30"
        x="1"
        y="1"
      />
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
