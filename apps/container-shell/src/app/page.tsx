import { Button, Card } from '@pwa-easy-rental/shared-ui';

export default function Home() {
  return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            Welcome to Easy Rental
          </h1>
          <p className="text-lg text-secondary-600">
            Your one-stop platform for easy rental management
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-xl font-semibold text-secondary-800 mb-2">
              Client Portal
            </h2>
            <p className="text-secondary-600 mb-4">
              Browse rentals, make bookings, and manage your reservations.
            </p>
            <a href="/client">
              <Button variant="primary">Go to Client Portal</Button>
            </a>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <span className="text-4xl">🏢</span>
            </div>
            <h2 className="text-xl font-semibold text-secondary-800 mb-2">
              Agency Dashboard
            </h2>
            <p className="text-secondary-600 mb-4">
              Manage your rental listings, bookings, and customer relationships.
            </p>
            <a href="/agency">
              <Button variant="primary">Go to Agency Dashboard</Button>
            </a>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <span className="text-4xl">🏛️</span>
            </div>
            <h2 className="text-xl font-semibold text-secondary-800 mb-2">
              Organisation Hub
            </h2>
            <p className="text-secondary-600 mb-4">
              Oversee multiple agencies, analytics, and system settings.
            </p>
            <a href="/organisation">
              <Button variant="primary">Go to Organisation Hub</Button>
            </a>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="inline-block">
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">
              ✨ Works Offline
            </h3>
            <p className="text-secondary-600">
              This app supports offline mode. Your data syncs automatically when
              you&apos;re back online.
            </p>
          </Card>
        </div>
      </div>
  );
}
