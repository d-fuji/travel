'use client';

import { useState } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { X } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState([''])
  const { createGroup, addMemberToGroup } = useTravelStore();
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const handleAddMember = () => {
    setMemberEmails([...memberEmails, '']);
  };

  const handleMemberChange = (index: number, value: string) => {
    const updated = [...memberEmails];
    updated[index] = value;
    setMemberEmails(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;

    const groupId = await createGroup(groupName);

    // Add members
    await Promise.all(
      memberEmails
        .filter(email => email.trim())
        .map(email => addMemberToGroup(groupId, email.trim()))
    );

    setGroupName('');
    setMemberEmails(['']);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">新しいグループを作成</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              グループ名
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例: 家族旅行"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メンバーを招待（メールアドレス）
            </label>
            <div className="space-y-2">
              {memberEmails.map((email, index) => (
                <input
                  key={index}
                  type="email"
                  value={email}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="member@example.com"
                />
              ))}
              <button
                type="button"
                onClick={handleAddMember}
                className="text-primary-600 text-sm font-medium hover:text-primary-700"
              >
                + メンバーを追加
              </button>
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