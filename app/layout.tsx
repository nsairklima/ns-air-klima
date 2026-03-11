import "./globals.css";

export const metadata = {
  title: "NS-AIR KLÍMA",
  description: "Klíma ajánlatkészítő és karbantartáskezelő rendszer"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
