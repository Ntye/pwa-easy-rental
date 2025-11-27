import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export const metadata: Metadata = {
  title: 'Easy Rental',
  description: 'Easy rental platform for clients, agencies, and organizations',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-secondary-50">
        <Navbar />
        <OfflineIndicator />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
