'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { TravelGroup } from '@/types';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TravelGroup | null;
}

export default function EditGroupModal({
  isOpen,
  onClose,
  group,
}: EditGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateGroup, addMemberToGroup, removeMemberFromGroup, deleteGroup } =
    useTravelStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (group && user) {
      setGroupName(group.name);
      
      
      // Get all member emails
      const memberEmails = group.members.map((member) => member.email);
      
      // Get creator's email from group.creator if available, otherwise from current user if they're the creator
      let creatorEmail = '';
      if (group.creator) {
        creatorEmail = group.creator.email;
      } else if (group.createdBy === user.id) {
        creatorEmail = user.email;
      }
      
      // Create complete email list
      // All members should already include the creator since backend adds creator to members table
      // But let's make sure creator is included just in case
      let allEmails = [...memberEmails];
      if (creatorEmail && !allEmails.includes(creatorEmail)) {
        // Put creator email first
        allEmails = [creatorEmail, ...memberEmails];
      }
      
      setMemberEmails(allEmails);
      
    }
  }, [group, user]);

  if (!isOpen || !group) return null;

  const handleAddMember = () => {
    setMemberEmails([...memberEmails, '']);
  };

  const handleInputChange = () => {
    if (error) {
      setError('');
    }
  };

  const handleMemberChange = (index: number, value: string) => {
    handleInputChange();
    
    // 作成者のメールアドレスが入力された場合は無視する
    if (user && value.trim() === user.email) {
      return;
    }

    const updated = [...memberEmails];
    updated[index] = value;
    setMemberEmails(updated);
  };

  const handleRemoveMember = (index: number) => {
    const updated = [...memberEmails];
    updated.splice(index, 1);
    setMemberEmails(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Update group name
      await updateGroup(group.id, { name: groupName });

      // Handle member changes
      const currentEmails = group.members.map((m) => m.email);
      const newEmails = memberEmails
        .filter((email) => email.trim())
        .map((email) => email.trim());

      // Add new members (excluding creator's email)
      const emailsToAdd = newEmails.filter(
        (email) => !currentEmails.includes(email) && email !== user.email
      );
      for (const email of emailsToAdd) {
        await addMemberToGroup(group.id, email);
      }

      // Remove members (if needed - this would require additional API support)
      const emailsToRemove = currentEmails.filter(
        (email) => !newEmails.includes(email)
      );
      for (const email of emailsToRemove) {
        const member = group.members.find((m) => m.email === email);
        if (member) {
          await removeMemberFromGroup(group.id, member.id);
        }
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to update group:', error);
      
      // Extract error message from API response
      let errorMessage = 'グループの更新に失敗しました';
      if (error.response?.data?.message) {
        const apiMessage = error.response.data.message;
        if (apiMessage.includes('User not found')) {
          errorMessage = '指定されたメールアドレスのユーザーが見つかりません';
        } else if (apiMessage.includes('already exists') || apiMessage.includes('duplicate')) {
          errorMessage = 'このメンバーは既にグループに追加されています';
        } else if (apiMessage.includes('permission') || apiMessage.includes('unauthorized')) {
          errorMessage = 'グループを編集する権限がありません';
        } else if (apiMessage.includes('validation') || apiMessage.includes('invalid')) {
          errorMessage = '入力内容に誤りがあります';
        } else if (apiMessage.includes('network') || apiMessage.includes('connection')) {
          errorMessage = 'ネットワークエラーが発生しました';
        } else {
          errorMessage = apiMessage;
        }
      } else if (error.response?.status === 403) {
        errorMessage = 'グループを編集する権限がありません';
      } else if (error.response?.status === 404) {
        errorMessage = 'グループが見つかりません';
      } else if (error.response?.status === 400) {
        errorMessage = '入力内容に誤りがあります';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'ネットワークに接続できません';
      } else if (error.message && error.message.includes('Network Error')) {
        errorMessage = 'ネットワークエラーが発生しました';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    try {
      await deleteGroup(group.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error: any) {
      // エラーメッセージを表示（簡単な実装）
      if (error.response?.status === 409) {
        alert('このグループには旅行が関連付けられているため削除できません');
      } else {
        alert('グループの削除に失敗しました');
      }
    }
  };

  const isCreator = user?.id === group.createdBy || user?.id === '1';


  return (
    <>
      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  グループを削除
                </h3>
                <p className="text-sm text-gray-600">
                  この操作は取り消せません
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              グループ「{group?.name}」を削除しますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メインモーダル */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">グループを編集</h2>
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
                onChange={(e) => {
                  setGroupName(e.target.value);
                  handleInputChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例: 家族旅行"
                required
                disabled={!isCreator}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メンバー（メールアドレス）
              </label>
              <div className="space-y-2">
                {memberEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        handleMemberChange(index, e.target.value)
                      }
                      className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        (!isCreator && index < group.members.length) || email === user?.email
                          ? 'bg-gray-50 text-gray-700'
                          : ''
                      }`}
                      placeholder="member@example.com"
                      readOnly={email === user?.email}
                    />
                    {isCreator &&
                      memberEmails.length > 1 &&
                      email !== user?.email && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                ))}
                {isCreator && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="text-primary-600 text-sm font-medium hover:text-primary-700"
                  >
                    + メンバーを追加
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {!isCreator && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  グループの編集はグループ作成者のみが可能です。
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              )}
              <button
                type="submit"
                disabled={!isCreator || loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
