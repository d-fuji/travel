'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTravelStore } from '@/stores/travelStore';
import Layout from '@/components/Layout';
import ItineraryBoard from '@/components/ItineraryBoard';
import WishlistPanel from '@/components/WishlistPanel';
import { formatDate, parseDate } from '@/utils/dateUtils';
import { Calendar, Heart, ArrowLeft } from 'lucide-react';

export default function TravelDetailPage({ params }: { params: { id: string } }) {
  const { user, isAuthenticated, setUser, initializeAuth } = useAuthStore();
  const { travels, groups, fetchTravels, fetchGroups, isLoading } = useTravelStore();
  
  const [activeTab, setActiveTab] = useState<'itinerary' | 'wishlist'>('itinerary');
  const [mounted, setMounted] = useState(false);

  // Initialize auth and data
  useEffect(() => {
    initializeAuth();
    setMounted(true);
  }, [initializeAuth]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && mounted) {
      fetchTravels();
      fetchGroups();
    }
  }, [isAuthenticated, mounted, fetchTravels, fetchGroups]);

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  const travel = travels.find(t => t.id === params.id);

  if (!mounted || isLoading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  if (!travel) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-gray-500">旅行が見つかりません</p>
          <p className="text-sm text-gray-400 mt-2">Travel ID: {params.id}</p>
          <p className="text-sm text-gray-400">Available travels: {travels.length}</p>
          <div className="mt-4">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              戻る
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const group = groups.find(g => g.id === travel.groupId);

  const tabs = [
    { key: 'itinerary' as const, label: '旅程表', icon: Calendar },
    { key: 'wishlist' as const, label: '行きたい場所', icon: Heart },
  ];

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{travel.name}</h1>
              <p className="text-sm text-gray-500">
                {travel.destination} • {formatDate(travel.startDate)} - {formatDate(travel.endDate)}
              </p>
              {group && (
                <p className="text-sm text-gray-500">{group.name}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[calc(100vh-200px)]">
          {activeTab === 'itinerary' && (
            <ItineraryBoard
              travelId={travel.id}
              startDate={parseDate(travel.startDate) || new Date()}
              endDate={parseDate(travel.endDate) || new Date()}
            />
          )}
          
          {activeTab === 'wishlist' && (
            <WishlistPanel travelId={travel.id} />
          )}
        </div>
      </div>
    </Layout>
  );
}