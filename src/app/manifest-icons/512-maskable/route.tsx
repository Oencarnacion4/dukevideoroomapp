import { ImageResponse } from "next/og";

// Android adaptive icons crop to varying shapes (circle, squircle, square),
// so content has to sit inside the ~66% safe zone while the background
// fills the full canvas — the background then reads correctly under any
// mask.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#012169",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 164,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: -7,
          }}
        >
          VR
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
