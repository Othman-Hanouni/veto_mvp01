import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Veto Registry MVP',
  description: 'Centralized dog microchip registry for veterinarians in Morocco'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
