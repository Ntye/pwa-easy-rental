'use client';

import { Button, Card, Input } from '@pwa-easy-rental/shared-ui';
import { useOfflineSync } from '@pwa-easy-rental/shared-services';
import { useState, useEffect } from 'react';

interface Listing {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'inactive';
  bookings: number;
  revenue: number;
}

interface Booking {
  id: string;
  customerName: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const mockListings: Listing[] = [
  { id: '1', title: 'Modern City Apartment', status: 'active', bookings: 12, revenue: 1800 },
  { id: '2', title: 'Cozy Beach House', status: 'active', bookings: 8, revenue: 1600 },
  { id: '3', title: 'Mountain Cabin', status: 'pending', bookings: 0, revenue: 0 },
];

const mockBookings: Booking[] = [
  { id: '1', customerName: 'John Doe', listingTitle: 'Modern City Apartment', checkIn: '2024-01-15', checkOut: '2024-01-18', status: 'confirmed' },
  { id: '2', customerName: 'Jane Smith', listingTitle: 'Cozy Beach House', checkIn: '2024-01-20', checkOut: '2024-01-25', status: 'pending' },
];

export default function AgencyPage() {
  const { isOnline, queueStats, addToQueue, cacheData, getCachedData } = useOfflineSync();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings'>('listings');
  const [newListingTitle, setNewListingTitle] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const cachedListings = await getCachedData<Listing[]>('agency-listings');
      const cachedBookings = await getCachedData<Booking[]>('agency-bookings');
      
      if (cachedListings) {
        setListings(cachedListings);
      } else {
        setListings(mockListings);
        await cacheData('agency-listings', 'listing', mockListings);
      }
      
      if (cachedBookings) {
        setBookings(cachedBookings);
      } else {
        setBookings(mockBookings);
        await cacheData('agency-bookings', 'booking', mockBookings);
      }
    };
    loadData();
  }, [getCachedData, cacheData]);

  const handleAddListing = async () => {
    if (!newListingTitle.trim()) return;
    
    const newListing: Listing = {
      id: crypto.randomUUID(),
      title: newListingTitle,
      status: 'pending',
      bookings: 0,
      revenue: 0,
    };

    setListings([...listings, newListing]);
    await cacheData('agency-listings', 'listing', [...listings, newListing]);
    
    await addToQueue({
      type: 'CREATE',
      entity: 'listing',
      data: newListing,
    });
    
    setNewListingTitle('');
    alert(`Listing "${newListingTitle}" created!${!isOnline ? ' (Will sync when online)' : ''}`);
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    );
    setBookings(updatedBookings);
    await cacheData('agency-bookings', 'booking', updatedBookings);
    
    await addToQueue({
      type: 'UPDATE',
      entity: 'booking',
      data: { id: bookingId, status: newStatus },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">
          🏢 Agency Dashboard
        </h1>
        <p className="text-secondary-600 mb-6">
          Manage your rental listings, handle bookings, and track your business performance.
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <Button
            variant={activeTab === 'listings' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('listings')}
          >
            Listings ({listings.length})
          </Button>
          <Button
            variant={activeTab === 'bookings' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings ({bookings.length})
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {queueStats.pending > 0 && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              {queueStats.pending} pending sync
            </span>
          )}
          <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
            {isOnline ? '● Online' : '● Offline'}
          </span>
        </div>
      </div>

      {activeTab === 'listings' && (
        <div>
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Listing</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter listing title..."
                  value={newListingTitle}
                  onChange={(e) => setNewListingTitle(e.target.value)}
                />
              </div>
              <Button variant="primary" onClick={handleAddListing}>
                Add Listing
              </Button>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-secondary-800">{listing.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(listing.status)}`}>
                    {listing.status}
                  </span>
                </div>
                <div className="text-sm text-secondary-600">
                  <p>Bookings: {listing.bookings}</p>
                  <p>Revenue: ${listing.revenue}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-secondary-800">{booking.listingTitle}</h3>
                  <p className="text-sm text-secondary-600">
                    {booking.customerName} • {booking.checkIn} to {booking.checkOut}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">
            Agency Management Features
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <span className="text-3xl mb-2 block">📊</span>
              <h4 className="font-medium text-secondary-800">Track Revenue</h4>
              <p className="text-sm text-secondary-600">Monitor your earnings per listing</p>
            </div>
            <div className="text-center p-4">
              <span className="text-3xl mb-2 block">📋</span>
              <h4 className="font-medium text-secondary-800">Manage Bookings</h4>
              <p className="text-sm text-secondary-600">Confirm or cancel reservations</p>
            </div>
            <div className="text-center p-4">
              <span className="text-3xl mb-2 block">🏠</span>
              <h4 className="font-medium text-secondary-800">List Properties</h4>
              <p className="text-sm text-secondary-600">Add and manage your rentals</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
