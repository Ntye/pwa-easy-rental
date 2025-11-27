import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agency Dashboard - Easy Rental',
  description: 'Manage your rental listings and bookings',
  manifest: '/agency/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-secondary-50">
        <header className="bg-primary-700 text-white py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Agency Dashboard</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}


