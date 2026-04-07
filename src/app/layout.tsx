import type { Metadata } from 'next';
import ThemeRegistry from '@/components/common/ThemeRegistry';

export const metadata: Metadata = {
  title: 'Minecraft Family Feud',
  description: 'A Minecraft-themed Family Feud game for in-person play',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
