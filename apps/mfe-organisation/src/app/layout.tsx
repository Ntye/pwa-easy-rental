import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Organisation Hub - PWA Easy Rental',
  description: 'Oversee agencies, analytics, and system settings',
  manifest: '/organisation/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-secondary-50">
        <header className="bg-primary-800 text-white py-4">
          <div className="container mx-auto px-4">
            <h1 className="text-xl font-bold">Organisation Hub</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
