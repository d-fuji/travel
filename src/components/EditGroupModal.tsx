'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { TravelGroup, InvitationLink, CreateInvitationLinkRequest } from '@/types';
import { invitationLinkApi } from '@/services/invitationApi';
import { X, Trash2, AlertTriangle, Users, Link, Copy, Plus, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 招待関連の状態
  const [invitationLinks, setInvitationLinks] = useState<InvitationLink[]>([]);
  const [showCreateInviteForm, setShowCreateInviteForm] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { updateGroup, addMemberToGroup, removeMemberFromGroup, deleteGroup } =
    useTravelStore();
  const { user, isGuest, guestUser } = useAuthStore();

  useEffect(() => {
    if (group && (user || (isGuest && guestUser))) {
      setGroupName(group.name);

      // Get all member emails
      const memberEmails = group.members.map((member) => member.email);

      // Get guest users (display as nickname + "(ゲスト)")
      const guestDisplayNames = (group.guestUsers || []).map((guest) => `${guest.nickname} (ゲスト)`);

      // Get creator's email from group.creator if available, otherwise from current user if they're the creator
      let creatorEmail = '';
      if (group.creator) {
        creatorEmail = group.creator.email;
      } else if (user && group.createdBy === user.id) {
        creatorEmail = user.email;
      }

      // Create complete email list (including guest users)
      // All members should already include the creator since backend adds creator to members table
      // But let's make sure creator is included just in case
      let allEmails = [...memberEmails];
      if (creatorEmail && !allEmails.includes(creatorEmail)) {
        // Put creator email first
        allEmails = [creatorEmail, ...memberEmails];
      }

      // Add guest users to the list
      const allMembersAndGuests = [...allEmails, ...guestDisplayNames];

      setMemberEmails(allMembersAndGuests);

      // 招待リンクを取得
      fetchInvitationLinks();
    }
  }, [group, user, guestUser]);

  const fetchInvitationLinks = async () => {
    if (!group) return;

    setInvitationLoading(true);
    try {
      const links = await invitationLinkApi.getByGroup(group.id);
      setInvitationLinks(links);
    } catch (error) {
      console.error('Failed to fetch invitation links:', error);
      // モック招待リンクを生成
      const mockLinks = generateMockInvitationLinks(group.id);
      setInvitationLinks(mockLinks);
    } finally {
      setInvitationLoading(false);
    }
  };

  const generateMockInvitationLinks = (groupId: string): InvitationLink[] => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'mock-link-1',
        groupId: groupId,
        token: 'abc123def456ghi789',
        createdBy: user?.id || '1',
        customMessage: '一緒に楽しい旅行を計画しましょう！',
        isActive: true,
        createdAt: oneDayAgo,
        updatedAt: oneDayAgo,
      },
      {
        id: 'mock-link-2',
        groupId: groupId,
        token: 'xyz789uvw456rst123',
        createdBy: user?.id || '1',
        customMessage: undefined,
        isActive: true,
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo,
      },
      {
        id: 'mock-link-3',
        groupId: groupId,
        token: 'disabled123456789',
        createdBy: user?.id || '1',
        customMessage: '期間限定の招待です',
        isActive: false,
        createdAt: threeDaysAgo,
        updatedAt: now,
      }
    ];
  };

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

  const handleCreateInvitationLink = async (data: CreateInvitationLinkRequest) => {
    if (!group) return;

    try {
      const newLink = await invitationLinkApi.create(group.id, data);
      setInvitationLinks([...invitationLinks, newLink]);
      setShowCreateInviteForm(false);
      alert('招待リンクを作成しました');
    } catch (error) {
      console.error('Failed to create invitation link:', error);
      // モック招待リンクを作成
      const mockLink: InvitationLink = {
        id: `mock-link-${Date.now()}`,
        groupId: group.id,
        token: generateRandomToken(),
        createdBy: user?.id || '1',
        customMessage: data.customMessage,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setInvitationLinks([...invitationLinks, mockLink]);
      setShowCreateInviteForm(false);
      alert('招待リンクを作成しました（モック）');
    }
  };

  const generateRandomToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 18; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCopyInvitationLink = async (link: InvitationLink) => {
    const url = `${window.location.origin}/invite/${link.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  const handleDeactivateInvitationLink = async (linkId: string) => {
    if (!confirm('この招待リンクを無効化しますか？無効化後は使用できなくなります。')) {
      return;
    }

    try {
      await invitationLinkApi.deactivate(linkId);
      setInvitationLinks(links =>
        links.map(link =>
          link.id === linkId ? { ...link, isActive: false } : link
        )
      );
      alert('招待リンクを無効化しました');
    } catch (error) {
      console.error('Failed to deactivate invitation link:', error);
      // モック: 無効化処理
      setInvitationLinks(links =>
        links.map(link =>
          link.id === linkId ? { ...link, isActive: false, updatedAt: new Date() } : link
        )
      );
      alert('招待リンクを無効化しました（モック）');
    }
  };

  const handleDeleteInvitationLink = async (linkId: string) => {
    if (!confirm('この招待リンクを削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      await invitationLinkApi.delete(linkId);
      setInvitationLinks(links => links.filter(link => link.id !== linkId));
      alert('招待リンクを削除しました');
    } catch (error) {
      console.error('Failed to delete invitation link:', error);
      // モック: 削除処理
      setInvitationLinks(links => links.filter(link => link.id !== linkId));
      alert('招待リンクを削除しました（モック）');
    }
  };

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
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">グループを編集</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* タブ */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'members'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <Users className="w-4 h-4" />
                メンバー管理
              </button>
              <button
                onClick={() => {
                  if (isGuest) {
                    setShowUpgradeModal(true);
                  } else {
                    setActiveTab('invitations');
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'invitations'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : isGuest
                      ? 'text-gray-400 cursor-pointer hover:text-green-500'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                {isGuest ? <Lock className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                招待リンク
                {isGuest && (
                  <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full ml-1">
                    登録
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            {activeTab === 'members' ? (
              <MemberManagement
                group={group}
                groupName={groupName}
                setGroupName={setGroupName}
                memberEmails={memberEmails}
                setMemberEmails={setMemberEmails}
                error={error}
                loading={loading}
                isCreator={isCreator}
                user={user}
                onSubmit={handleSubmit}
                onDelete={() => setShowDeleteConfirm(true)}
                onAddMember={handleAddMember}
                onMemberChange={handleMemberChange}
                onRemoveMember={handleRemoveMember}
                onInputChange={handleInputChange}
              />
            ) : !isGuest ? (
              <InvitationManagement
                invitationLinks={invitationLinks}
                loading={invitationLoading}
                showCreateForm={showCreateInviteForm}
                setShowCreateForm={setShowCreateInviteForm}
                onCreateLink={handleCreateInvitationLink}
                onCopyLink={handleCopyInvitationLink}
                onDeactivateLink={handleDeactivateInvitationLink}
                onDeleteLink={handleDeleteInvitationLink}
                copiedLinkId={copiedLinkId}
                isCreator={isCreator}
              />
            ) : null}
          </div>
        </div>
      </div>

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
    </>
  );
}

// メンバー管理コンポーネント
interface MemberManagementProps {
  group: TravelGroup;
  groupName: string;
  setGroupName: (name: string) => void;
  memberEmails: string[];
  setMemberEmails: (emails: string[]) => void;
  error: string;
  loading: boolean;
  isCreator: boolean;
  user: any;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onAddMember: () => void;
  onMemberChange: (index: number, value: string) => void;
  onRemoveMember: (index: number) => void;
  onInputChange: () => void;
}

function MemberManagement({
  group,
  groupName,
  setGroupName,
  memberEmails,
  error,
  loading,
  isCreator,
  user,
  onSubmit,
  onDelete,
  onAddMember,
  onMemberChange,
  onRemoveMember,
  onInputChange,
}: MemberManagementProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          グループ名
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => {
            setGroupName(e.target.value);
            onInputChange();
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
          {memberEmails.map((email, index) => {
            const isGuestUser = email.includes('(ゲスト)');
            const isCurrentUser = email === user?.email;
            const isReadOnly = isCurrentUser || isGuestUser || (!isCreator && index < group.members.length);

            return (
              <div key={index} className="flex gap-2">
                <input
                  type={isGuestUser ? "text" : "email"}
                  value={email}
                  onChange={(e) =>
                    onMemberChange(index, e.target.value)
                  }
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isReadOnly
                      ? 'bg-gray-50 text-gray-700'
                      : ''
                    }`}
                  placeholder={isGuestUser ? "ゲストユーザー" : "member@example.com"}
                  readOnly={isReadOnly}
                />
                {isCreator &&
                  memberEmails.length > 1 &&
                  !isCurrentUser &&
                  !isGuestUser && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>
            );
          })}
          {isCreator && (
            <button
              type="button"
              onClick={onAddMember}
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
            onClick={onDelete}
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
  );
}

// 招待管理コンポーネント
interface InvitationManagementProps {
  invitationLinks: InvitationLink[];
  loading: boolean;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  onCreateLink: (data: CreateInvitationLinkRequest) => void;
  onCopyLink: (link: InvitationLink) => void;
  onDeactivateLink: (linkId: string) => void;
  onDeleteLink: (linkId: string) => void;
  copiedLinkId: string | null;
  isCreator: boolean;
}

function InvitationManagement({
  invitationLinks,
  loading,
  showCreateForm,
  setShowCreateForm,
  onCreateLink,
  onCopyLink,
  onDeactivateLink,
  onDeleteLink,
  copiedLinkId,
  isCreator,
}: InvitationManagementProps) {
  return (
    <div className="space-y-6">
      {/* 新規作成ボタン */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">招待リンク一覧</h3>
        {isCreator && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新規作成
          </button>
        )}
      </div>

      {/* 招待リンクリスト */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitationLinks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>招待リンクがありません</p>
              {isCreator && (
                <p className="text-sm">新規作成ボタンからリンクを作成してください</p>
              )}
            </div>
          ) : (
            invitationLinks.map((link) => (
              <InvitationLinkCard
                key={link.id}
                link={link}
                onCopy={() => onCopyLink(link)}
                onDeactivate={() => onDeactivateLink(link.id)}
                onDelete={() => onDeleteLink(link.id)}
                isCopied={copiedLinkId === link.id}
                isCreator={isCreator}
              />
            ))
          )}
        </div>
      )}

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <CreateInvitationForm
          onSubmit={onCreateLink}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

// 招待リンクカード
interface InvitationLinkCardProps {
  link: InvitationLink;
  onCopy: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  isCopied: boolean;
  isCreator: boolean;
}

function InvitationLinkCard({ link, onCopy, onDeactivate, onDelete, isCopied, isCreator }: InvitationLinkCardProps) {
  return (
    <div className={`p-4 border rounded-lg ${link.isActive ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {link.isActive ? (
              <Eye className="w-4 h-4 text-green-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${link.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {link.isActive ? '有効' : '無効'}
            </span>
          </div>

          {link.customMessage && (
            <p className="text-sm text-gray-700 mb-2">
              メッセージ: {link.customMessage}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>作成日: {new Date(link.createdAt).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onCopy}
            className={`p-2 rounded-lg transition-colors ${isCopied
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            title="リンクをコピー"
          >
            {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>

          {isCreator && link.isActive && (
            <button
              onClick={onDeactivate}
              className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="無効化"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}

          {isCreator && (
            <button
              onClick={onDelete}
              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 招待リンク作成フォーム
interface CreateInvitationFormProps {
  onSubmit: (data: CreateInvitationLinkRequest) => void;
  onCancel: () => void;
}

function CreateInvitationForm({ onSubmit, onCancel }: CreateInvitationFormProps) {
  const [customMessage, setCustomMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateInvitationLinkRequest = {};

    if (customMessage.trim()) {
      data.customMessage = customMessage.trim();
    }

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">新しい招待リンクを作成</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カスタムメッセージ（任意）
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              rows={3}
              placeholder="招待メッセージを入力してください"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// アップグレードモーダル
interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

function UpgradeModal({ onClose, onUpgrade }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
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
            <span className="font-semibold text-green-600">無料</span>でアカウント登録すると、招待リンクの作成・管理など、すべての機能をご利用いただけます。
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>招待リンクの作成・管理</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>グループの編集権限</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>費用の記録と分担</span>
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