'use client';

import { Button, Card, Input } from '@pwa-easy-rental/shared-ui';
import { useOfflineSync } from '@pwa-easy-rental/shared-services';
import { useState, useEffect } from 'react';

interface Rental {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
}

const mockRentals: Rental[] = [
  {
    id: '1',
    title: 'Modern City Apartment',
    description: 'A beautiful apartment in the heart of the city',
    price: 150,
    location: 'Downtown',
  },
  {
    id: '2',
    title: 'Cozy Beach House',
    description: 'Relax by the ocean in this charming beach house',
    price: 200,
    location: 'Seaside',
  },
  {
    id: '3',
    title: 'Mountain Cabin',
    description: 'Escape to nature in this peaceful mountain retreat',
    price: 175,
    location: 'Highland',
  },
];

export default function ClientPage() {
  const { isInitialized, isOnline, queueStats, addToQueue, cacheData, getCachedData } = useOfflineSync();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load rentals from cache or use mock data
    const loadRentals = async () => {
      if (isInitialized) {
        const cached = await getCachedData<Rental[]>('rentals');
        if (cached) {
          setRentals(cached);
        } else {
          setRentals(mockRentals);
          await cacheData('rentals', 'rental', mockRentals);
        }
      }
    };
    loadRentals();
  }, [isInitialized, getCachedData, cacheData]);

  const handleBooking = async (rental: Rental) => {
    await addToQueue({
      type: 'CREATE',
      entity: 'booking',
      data: {
        rentalId: rental.id,
        rentalTitle: rental.title,
        bookedAt: new Date().toISOString(),
      },
    });
    alert(`Booking added for ${rental.title}!${!isOnline ? ' (Will sync when online)' : ''}`);
  };

  const filteredRentals = rentals.filter(
      (rental) =>
          rental.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rental.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">
            Browse Available Rentals
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                  placeholder="Search by title or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-secondary-600">
              {isOnline ? (
                  <span className="text-green-600">● Online</span>
              ) : (
                  <span className="text-yellow-600">● Offline</span>
              )}
            </div>
          </div>

          {queueStats.pending > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md mb-4">
                {queueStats.pending} pending sync item(s)
              </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredRentals.map((rental) => (
              <Card key={rental.id} className="hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                  {rental.title}
                </h3>
                <p className="text-secondary-600 mb-2">{rental.description}</p>
                <div className="flex items-center justify-between mb-4">
              <span className="text-primary-600 font-bold">
                ${rental.price}/night
              </span>
                  <span className="text-secondary-500 text-sm">{rental.location}</span>
                </div>
                <Button
                    variant="primary"
                    onClick={() => handleBooking(rental)}
                    className="w-full"
                >
                  Book Now
                </Button>
              </Card>
          ))}
        </div>

        {filteredRentals.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-secondary-600">
                No rentals found matching your search.
              </p>
            </Card>
        )}

        {!isInitialized && (
            <Card className="text-center py-8">
              <p className="text-secondary-600">Initializing offline sync...</p>
            </Card>
        )}
      </div>
  );
}
