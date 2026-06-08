import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Number(searchParams.get("size") ?? "192");
  const clampedSize = [192, 512].includes(size) ? size : 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          borderRadius: "20%",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="58%"
          height="58%"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <rect x="7" y="14" width="3" height="3" rx="0.5" fill="white" stroke="none" />
          <rect x="10.5" y="14" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.6)" stroke="none" />
          <rect x="14" y="14" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.4)" stroke="none" />
        </svg>
      </div>
    ),
    { width: clampedSize, height: clampedSize }
  );
}
