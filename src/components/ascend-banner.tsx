import React from "react";
import { AscendLogo } from "./ascend-logo";

type AscendBannerProps = {
  className?: string;
  logoSize?: number;
  textColor?: string;
};

export function AscendBanner({
  className = "",
  logoSize = 56,
  textColor = "text-white",
}: AscendBannerProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Brand Logo */}
      <AscendLogo width={logoSize} height={logoSize} showDetails={true} />

      {/* Brand Text */}
      <div className="flex flex-col justify-center">
        <h2
          className={`text-3xl font-extrabold tracking-[0.1em] ${textColor} font-sans leading-none`}
          style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
        >
          ASCEND
        </h2>
        <p
          className="mt-1 text-[9px] font-bold tracking-[0.16em] text-[#e2b13c]"
          style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
        >
          Assess. Adapt. Ascend.
        </p>
      </div>
    </div>
  );
}
