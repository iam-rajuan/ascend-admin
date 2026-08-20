import React from "react";

type AscendLogoProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
  showDetails?: boolean;
};

export function AscendLogo({
  width = 100,
  height = 100,
  className = "",
  showDetails = true,
}: AscendLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Heater Shield */}
      <path
        d="M 50 5 Q 72 5 88 15 Q 92 48 50 95 Q 8 48 12 15 Q 28 5 50 5 Z"
        stroke="#e2b13c"
        strokeWidth="6"
        strokeLinejoin="round"
        fill="rgba(15, 23, 42, 0.04)"
      />

      {/* Outer Shield Inner Shadow / Double Border */}
      <path
        d="M 50 10 Q 69 10 83 19 Q 86 46 50 87 Q 14 46 17 19 Q 31 10 50 10 Z"
        stroke="#e2b13c"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* The Stylized "A" */}
      <path
        d="M 32 70 L 48 26 H 54 L 68 70 H 58 L 54.5 58 H 45.5 L 42 70 Z M 50 36 L 46 48 H 54 Z"
        fill="var(--brand-color)"
        fillRule="evenodd"
        clipRule="evenodd"
      />

      {/* Motion Speed Lines under the Arrow */}
      {showDetails && (
        <>
          <path
            d="M 36 78 L 44 70"
            stroke="var(--brand-color)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M 42 81 L 52 71"
            stroke="var(--brand-color)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M 48 84 L 60 72"
            stroke="var(--brand-color)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        </>
      )}

      {/* The Gold Diagonal Arrow */}
      <path
        d="M 28 74 Q 30 71 80 25 L 75 20 L 92 17 L 88 34 L 83 29 Q 32 75 28 74 Z"
        fill="#e2b13c"
        stroke="#e2b13c"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
