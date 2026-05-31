import React from "react";
import Image from "next/image";

/**
 * Logo mark — transparent PNG, no chip background.
 *
 * The PNG is cropped tight to the artwork (aspect 2.17:1) and has a fully
 * transparent background. Two variants:
 *   - /cmmlogo.png        — navy ink, for light surfaces (default)
 *   - /cmmlogo-light.png  — mint ink, for dark surfaces (tone="light")
 *
 * `size` is treated as HEIGHT; width auto-scales by aspect ratio.
 */
const LOGO_ASPECT = 892 / 412; // 2.17:1

export function LogoMark({
  size = 28,
  tone,
  className,
  style,
}: {
  size?: number;
  tone?: "light" | "dark";
  className?: string;
  style?: React.CSSProperties;
}) {
  const src = tone === "light" ? "/cmmlogo-light.png" : "/cmmlogo.png";
  const w = Math.round(size * LOGO_ASPECT);

  return (
    <Image
      src={src}
      alt="Crypto Mining Miles"
      width={w}
      height={size}
      priority
      sizes={`${w}px`}
      className={className}
      style={{
        display: "block",
        height: size,
        width: w,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
