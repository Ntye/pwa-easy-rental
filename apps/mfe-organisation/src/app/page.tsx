'use client';

import { Button, Card } from '@pwa-easy-rental/shared-ui';
import { useOfflineSync } from '@pwa-easy-rental/shared-services';
import { useState, useEffect } from 'react';

interface Agency {
  id: string;
  name: string;
  listings: number;
  totalRevenue: number;
  status: 'active' | 'inactive' | 'pending';
}

interface Analytics {
  totalAgencies: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

const mockAgencies: Agency[] = [
  { id: '1', name: 'City Rentals Co.', listings: 25, totalRevenue: 45000, status: 'active' },
  { id: '2', name: 'Beach Properties Ltd.', listings: 18, totalRevenue: 38000, status: 'active' },
  { id: '3', name: 'Mountain Escapes', listings: 12, totalRevenue: 22000, status: 'active' },
  { id: '4', name: 'Urban Stays', listings: 0, totalRevenue: 0, status: 'pending' },
];

const mockAnalytics: Analytics = {
  totalAgencies: 4,
  totalListings: 55,
  totalBookings: 320,
  totalRevenue: 105000,
  monthlyGrowth: 12.5,
};

export default function OrganisationPage() {
  const { isInitialized, isOnline, queueStats, addToQueue, cacheData, getCachedData } = useOfflineSync();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agencies' | 'settings'>('overview');

  useEffect(() => {
    const loadData = async () => {
      if (isInitialized) {
        const cachedAgencies = await getCachedData<Agency[]>('org-agencies');
        const cachedAnalytics = await getCachedData<Analytics>('org-analytics');

        if (cachedAgencies) {
          setAgencies(cachedAgencies);
        } else {
          setAgencies(mockAgencies);
          await cacheData('org-agencies', 'agency', mockAgencies);
        }

        if (cachedAnalytics) {
          setAnalytics(cachedAnalytics);
        } else {
          setAnalytics(mockAnalytics);
          await cacheData('org-analytics', 'analytics', mockAnalytics);
        }
      }
    };
    loadData();
  }, [isInitialized, getCachedData, cacheData]);

  const handleUpdateAgencyStatus = async (agencyId: string, newStatus: Agency['status']) => {
    const updatedAgencies = agencies.map((a) =>
        a.id === agencyId ? { ...a, status: newStatus } : a
    );
    setAgencies(updatedAgencies);
    await cacheData('org-agencies', 'agency', updatedAgencies);

    await addToQueue({
      type: 'UPDATE',
      entity: 'agency',
      data: { id: agencyId, status: newStatus },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-secondary-800">
            Organisation Hub
          </h2>
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

        <div className="flex space-x-4 mb-6">
          <Button
              variant={activeTab === 'overview' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
              variant={activeTab === 'agencies' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('agencies')}
          >
            Agencies ({agencies.length})
          </Button>
          <Button
              variant={activeTab === 'settings' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('settings')}
          >
            Settings
          </Button>
        </div>

        {activeTab === 'overview' && analytics && (
            <div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="text-center">
                  <p className="text-secondary-600 text-sm">Total Agencies</p>
                  <p className="text-3xl font-bold text-primary-600">{analytics.totalAgencies}</p>
                </Card>
                <Card className="text-center">
                  <p className="text-secondary-600 text-sm">Total Listings</p>
                  <p className="text-3xl font-bold text-primary-600">{analytics.totalListings}</p>
                </Card>
                <Card className="text-center">
                  <p className="text-secondary-600 text-sm">Total Bookings</p>
                  <p className="text-3xl font-bold text-primary-600">{analytics.totalBookings}</p>
                </Card>
                <Card className="text-center">
                  <p className="text-secondary-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-primary-600">${analytics.totalRevenue.toLocaleString()}</p>
                </Card>
              </div>

              <Card>
                <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">↑ {analytics.monthlyGrowth}%</span>
                  <span className="text-secondary-600">Monthly Growth</span>
                </div>
              </Card>
            </div>
        )}

        {activeTab === 'agencies' && (
            <div className="space-y-4">
              {agencies.map((agency) => (
                  <Card key={agency.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-secondary-800">{agency.name}</h3>
                        <p className="text-sm text-secondary-600">
                          {agency.listings} listings • ${agency.totalRevenue.toLocaleString()} revenue
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(agency.status)}`}>
                    {agency.status}
                  </span>
                        {agency.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleUpdateAgencyStatus(agency.id, 'active')}
                              >
                                Approve
                              </Button>
                              <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleUpdateAgencyStatus(agency.id, 'inactive')}
                              >
                                Reject
                              </Button>
                            </div>
                        )}
                        {agency.status === 'active' && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleUpdateAgencyStatus(agency.id, 'inactive')}
                            >
                              Deactivate
                            </Button>
                        )}
                        {agency.status === 'inactive' && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleUpdateAgencyStatus(agency.id, 'active')}
                            >
                              Reactivate
                            </Button>
                        )}
                      </div>
                    </div>
                  </Card>
              ))}
            </div>
        )}

        {activeTab === 'settings' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium text-secondary-800">Offline Mode</p>
                    <p className="text-sm text-secondary-600">Enable offline data synchronization</p>
                  </div>
                  <span className="text-green-600">Enabled</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium text-secondary-800">Auto Sync</p>
                    <p className="text-sm text-secondary-600">Automatically sync data when online</p>
                  </div>
                  <span className="text-green-600">Enabled</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-secondary-800">Sync Interval</p>
                    <p className="text-sm text-secondary-600">Time between sync attempts</p>
                  </div>
                  <span className="text-secondary-800">30 seconds</span>
                </div>
              </div>
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
