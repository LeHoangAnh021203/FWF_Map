export const metadata = {
  title: "Face Wash Fox Map",
  description: "All location of Face Wash Fox",
  icons: { icon: "/favicon.ico" },
};

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
