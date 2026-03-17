import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudSignal Notifications Demo",
  description: "Real-time notification demo powered by CloudSignal MQTT + Supabase Auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
