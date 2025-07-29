'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { ItineraryItem } from '@/types';
import { Plus, Edit2, Trash2, Clock, MapPin } from 'lucide-react';

interface ItineraryBoardProps {
  travelId: string;
  startDate: Date;
  endDate: Date;
}

export default function ItineraryBoard({
  travelId,
  startDate,
  endDate,
}: ItineraryBoardProps) {
  const {
    itineraryItems,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    fetchItineraryItems,
  } = useTravelStore();
  const { user } = useAuthStore();

  // Fetch itinerary items for this travel
  useEffect(() => {
    fetchItineraryItems(travelId);
  }, [travelId, fetchItineraryItems]);

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{
    date: string;
    period: 'morning' | 'afternoon' | 'evening';
  } | null>(null);

  // Generate date range
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const periods = [
    { key: 'morning' as const, label: '午前', icon: '🌅' },
    { key: 'afternoon' as const, label: '午後', icon: '☀️' },
    { key: 'evening' as const, label: '夜', icon: '🌙' },
  ];

  const getItemsForDatePeriod = (
    date: Date,
    period: 'morning' | 'afternoon' | 'evening'
  ) => {
    const dateStr = date.toISOString().split('T')[0];
    return itineraryItems.filter(
      (item) =>
        item.travelId === travelId &&
        item.date === dateStr &&
        item.period === period
    );
  };

  const handleAddItem = (
    date: Date,
    period: 'morning' | 'afternoon' | 'evening'
  ) => {
    setNewItem({
      date: date.toISOString().split('T')[0],
      period,
    });
  };

  const handleSaveNewItem = (formData: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!user || !newItem) return;

    addItineraryItem({
      ...formData,
      date: newItem.date,
      period: newItem.period,
      travelId,
    });

    setNewItem(null);
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">旅程表</h2>

      <div className="space-y-6">
        {dates.map((date, dateIndex) => (
          <div
            key={dateIndex}
            className="bg-white rounded-2xl shadow-sm border"
          >
            <div className="p-4 border-b bg-gray-50 rounded-t-2xl">
              <h3 className="font-semibold text-gray-900">
                {formatDateHeader(date)}
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {periods.map((period) => {
                const items = getItemsForDatePeriod(date, period.key);

                return (
                  <div
                    key={period.key}
                    className="border-l-4 border-gray-200 pl-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <span>{period.icon}</span>
                        {period.label}
                      </h4>
                      <button
                        onClick={() => handleAddItem(date, period.key)}
                        className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => (
                        <ItineraryItemCard
                          key={item.id}
                          item={item}
                          isEditing={editingItem === item.id}
                          onEdit={() => setEditingItem(item.id)}
                          onSave={(_updates) => {
                            updateItineraryItem(item.id, _updates);
                            setEditingItem(null);
                          }}
                          onCancel={() => setEditingItem(null)}
                          onDelete={() => deleteItineraryItem(item.id)}
                        />
                      ))}

                      {items.length === 0 && (
                        <p className="text-sm text-gray-500 italic">予定なし</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {newItem && (
        <AddItemModal
          onSave={handleSaveNewItem}
          onCancel={() => setNewItem(null)}
        />
      )}
    </div>
  );
}

interface ItineraryItemCardProps {
  item: ItineraryItem;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (_updates: Partial<ItineraryItem>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function ItineraryItemCard({
  item,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: ItineraryItemCardProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [location, setLocation] = useState(item.location || '');
  const [startTime, setStartTime] = useState(item.startTime || '');
  const [endTime, setEndTime] = useState(item.endTime || '');

  if (isEditing) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg border">
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="タイトル"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded resize-none"
            rows={2}
            placeholder="説明"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="場所"
          />
          <div className="flex gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded"
            />
            <span className="text-sm text-gray-500 self-center">〜</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() =>
              onSave({ title, description, location, startTime, endTime })
            }
            className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-3 rounded-lg border group hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900">{item.title}</h5>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {(item.startTime || item.endTime) && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {item.startTime && item.endTime
                    ? `${item.startTime} - ${item.endTime}`
                    : item.startTime || item.endTime}
                </span>
              </div>
            )}
            {item.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{item.location}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-primary-600"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddItemModalProps {
  onSave: (_data: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
  }) => void;
  onCancel: () => void;
}

function AddItemModal({ onSave, onCancel }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({ title, description, location, startTime, endTime });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">予定を追加</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="タイトル"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="説明（任意）"
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="場所（任意）"
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始時間
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了時間
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
