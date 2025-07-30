'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Layout from '@/components/Layout';
import ItineraryBoard from '@/components/ItineraryBoard';
import WishlistPanel from '@/components/WishlistPanel';
import ExpenseTracker from '@/components/ExpenseTracker';
import { formatDate, parseDate } from '@/utils/dateUtils';
import { Calendar, Heart, ArrowLeft, Settings, Wallet, Lock } from 'lucide-react';
import EditTravelModal from '@/components/EditTravelModal';

export default function TravelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { isAuthenticated } = useAuthGuard();
  const { isGuest } = useAuthStore();
  const { travels, groups, fetchTravels, fetchGroups, isLoading } =
    useTravelStore();

  const [activeTab, setActiveTab] = useState<'itinerary' | 'wishlist' | 'expenses'>(
    'itinerary'
  );
  const [mounted, setMounted] = useState(false);
  const [isEditTravelModalOpen, setIsEditTravelModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && mounted) {
      fetchTravels();
      fetchGroups();
    }
  }, [isAuthenticated, mounted, fetchTravels, fetchGroups]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [mounted, isAuthenticated]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">ログイン画面に移動中...</p>
        </div>
      </div>
    );
  }

  const travel = travels.find((t) => t.id === params.id);


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
          <p className="text-sm text-gray-400">
            Available travels: {travels.length}
          </p>
          <div className="mt-4 space-y-2">
            {travels.map(t => (
              <div key={t.id} className="text-xs text-gray-400">
                ID: {t.id} - {t.name}
              </div>
            ))}
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

  const group = groups.find((g) => g.id === travel.groupId);

  const tabs = [
    { key: 'itinerary' as const, label: '旅程', icon: Calendar, guestAllowed: true },
    { key: 'wishlist' as const, label: '行きたい', icon: Heart, guestAllowed: false },
    { key: 'expenses' as const, label: '費用', icon: Wallet, guestAllowed: false },
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {travel.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {travel.destination} • {formatDate(travel.startDate)} -{' '}
                    {formatDate(travel.endDate)}
                  </p>
                  {group && (
                    <p className="text-sm text-gray-500">{group.name}</p>
                  )}
                </div>
                {!isGuest && (
                  <button
                    onClick={() => setIsEditTravelModalOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="旅行設定"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isRestricted = isGuest && !tab.guestAllowed;

              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (isRestricted) {
                      setShowUpgradeModal(true);
                    } else {
                      setActiveTab(tab.key);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : isRestricted
                        ? 'text-gray-400 cursor-pointer hover:text-green-500'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  {isRestricted ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  {tab.label}
                  {isRestricted && (
                    <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full ml-1">
                      登録
                    </span>
                  )}
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

          {activeTab === 'wishlist' && <WishlistPanel travelId={travel.id} />}

          {activeTab === 'expenses' && <ExpenseTracker travelId={travel.id} />}
        </div>

        {/* Edit Travel Modal */}
        <EditTravelModal
          isOpen={isEditTravelModalOpen}
          onClose={() => setIsEditTravelModalOpen(false)}
          travel={travel || null}
        />

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <UpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            onUpgrade={() => {
              // TODO: 本登録フローの実装
              setShowUpgradeModal(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

function UpgradeModal({ onClose, onUpgrade }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
            <span className="text-green-600">✓</span>
            完全無料
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            無料登録で全機能を解放
          </h3>

          <p className="text-gray-600 mb-6">
            <span className="font-semibold text-green-600">無料</span>でアカウント登録すると、行きたい場所の管理や費用の共有など、すべての機能をご利用いただけます。
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>行きたい場所のリスト管理</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>費用の記録と分担</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>旅行の編集権限</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>データの永続保存</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            後で
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors font-medium"
          >
            無料で登録する
          </button>
        </div>
      </div>
    </div>
  );
}
