'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTravelStore } from '@/stores/travelStore';
import AuthForm from '@/components/AuthForm';
import Layout from '@/components/Layout';
import CreateGroupModal from '@/components/CreateGroupModal';
import { formatDate } from '@/utils/dateUtils';
import { Plus, Users, Calendar, MapPin } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const { groups, travels, createTravel, fetchTravels, fetchGroups, isLoading } = useTravelStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateTravel, setShowCreateTravel] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [mounted, setMounted] = useState(false);

  // Initialize auth
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
    return (
      <AuthForm
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
      />
    );
  }

  if (!mounted || isLoading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </Layout>
    );
  }


  const userGroups = groups.filter(group =>
    group.createdBy === user?.id || group.members.some(member => member.id === user?.id)
  );

  const userTravels = travels.filter(travel =>
    userGroups.some(group => group.id === travel.groupId)
  );

  return (
    <Layout>
      <div className="p-4">
        {/* Groups Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">グループ</h2>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {userGroups.length > 0 ? (
            <div className="space-y-3">
              {userGroups.map(group => (
                <div key={group.id} className="bg-white p-4 rounded-2xl shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{group.members.length + 1}人</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setShowCreateTravel(true);
                      }}
                      className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100"
                    >
                      旅行作成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">まだグループがありません</p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                最初のグループを作成
              </button>
            </div>
          )}
        </div>

        {/* Travels Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">旅行</h2>

          {userTravels.length > 0 ? (
            <div className="space-y-3">
              {userTravels.map(travel => {
                const group = groups.find(g => g.id === travel.groupId);
                return (
                  <div key={travel.id} className="bg-white p-4 rounded-2xl shadow-sm border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{travel.name}</h3>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{travel.destination}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(travel.startDate)} - {formatDate(travel.endDate)}
                          </span>
                        </div>
                        {group && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{group.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.href = `/travel/${travel.id}`;
                          }
                        }}
                        className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100"
                      >
                        開く
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">まだ旅行がありません</p>
              <p className="text-sm text-gray-400">グループを作成してから旅行を計画しましょう</p>
            </div>
          )}
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {showCreateTravel && (
        <CreateTravelModal
          groupId={selectedGroupId}
          onClose={() => {
            setShowCreateTravel(false);
            setSelectedGroupId('');
          }}
        />
      )}
    </Layout>
  );
}

interface CreateTravelModalProps {
  groupId: string;
  onClose: () => void;
}

function CreateTravelModal({ groupId, onClose }: CreateTravelModalProps) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { createTravel } = useTravelStore();
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !destination.trim() || !startDate || !endDate) return;

    try {
      await createTravel(
        name,
        destination,
        new Date(startDate),
        new Date(endDate),
        groupId
      );

      setName('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      onClose();
    } catch (error) {
      console.error('Failed to create travel:', error);
      alert('旅行の作成に失敗しました。');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">新しい旅行を作成</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              旅行名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例: 沖縄旅行"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目的地
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例: 沖縄県"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出発日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                帰着日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={startDate}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}