import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Video Room",
  description:
    "Shifts, hours, task board and how-tos for the Duke men's basketball practice video crew.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Video Room",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#012169",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#dcdcd9]">
        <ServiceWorkerRegister />
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col bg-(--color-bg)">
          {children}
        </div>
      </body>
    </html>
  );
}
