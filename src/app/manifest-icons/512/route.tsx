import { ImageResponse } from "next/og";

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
          color: "#fff",
          fontSize: 246,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: -10,
        }}
      >
        VR
      </div>
    ),
    { width: 512, height: 512 },
  );
}
