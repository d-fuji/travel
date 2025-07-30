'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import { InvitationDetails, JoinInvitationRequest } from '@/types';
import { invitationLinkApi } from '@/services/invitationApi';
import { useAuthStore } from '@/stores/authStore';
import { useTravelStore } from '@/stores/travelStore';

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningMode, setJoiningMode] = useState<'register' | 'guest' | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const { user } = useAuthStore();
  const { fetchGroups, fetchTravels } = useTravelStore();
  const router = useRouter();

  useEffect(() => {
    if (params.token) {
      fetchInvitationDetails();
    }
  }, [params.token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      const details = await invitationLinkApi.getDetails(params.token);
      setInvitation(details);

      if (!details.isValid) {
        setError('この招待リンクは無効です。');
      }
    } catch (error) {
      console.error('Failed to fetch invitation details:', error);
      setError('招待リンクの情報を取得できませんでした。');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAsExistingUser = async () => {
    if (!user || !invitation) return;

    setIsJoining(true);
    try {
      const joinRequest: JoinInvitationRequest = {
        userId: user.id,
      };

      const result = await invitationLinkApi.join(params.token, joinRequest);

      if (result.success) {
        // 参加成功後にデータを再取得
        try {
          await Promise.all([fetchGroups(), fetchTravels()]);
        } catch (error) {
          console.error('Failed to refresh data after joining:', error);
        }

        setJoinSuccess(true);
        setTimeout(() => {
          router.push('/'); // ホームページに遷移してグループ一覧を表示
        }, 2000);
      } else {
        alert(result.message || 'グループ参加に失敗しました。');
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('グループ参加に失敗しました。');
    } finally {
      setIsJoining(false);
    }
  };

  const formatGroupTravels = (travels: any[]) => {
    if (!travels || travels.length === 0) return '予定なし';
    if (travels.length === 1) return travels[0]?.name || '旅行';
    return `${travels[0]?.name || '旅行'} 他${travels.length - 1}件`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">招待情報を確認中...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">招待リンクエラー</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">参加完了</h1>
          <p className="text-gray-600 mb-6">
            「{invitation.group.name}」に参加しました！<br />
            ホームページに移動します...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 招待情報カード */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="text-center mb-6">
            <UserPlus className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 mb-1">旅行グループへの招待</h1>
            <p className="text-sm text-gray-600">
              {invitation.inviter.name}さんから招待されています
            </p>
          </div>

          {/* グループ情報 */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{invitation.group.name}</h2>
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatGroupTravels(invitation.travels)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{invitation.memberCount}人のメンバー</span>
                </div>
              </div>
            </div>

            {invitation.customMessage && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">メッセージ:</span><br />
                  {invitation.customMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 参加方法選択 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">参加方法を選択</h3>

          {user ? (
            /* ログイン済みユーザー */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleJoinAsExistingUser}
                  disabled={isJoining}
                  className={`w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors ${isJoining
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {isJoining ? '参加中...' : 'このアカウントで参加する'}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    // ログアウト処理は実装されていないため、ページリロードで代用
                    localStorage.removeItem('access_token');
                    window.location.reload();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  別のアカウントで参加する
                </button>
              </div>
            </div>
          ) : (
            /* 未ログインユーザー */
            <div className="space-y-3">
              <button
                onClick={() => setJoiningMode('register')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">新規アカウント作成</div>
                <div className="text-sm text-gray-600">新しくアカウントを作成して参加</div>
              </button>

              <button
                onClick={() => setJoiningMode('guest')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">ゲストとして参加</div>
                <div className="text-sm text-gray-600">アカウント作成なしで一時的に参加</div>
              </button>
            </div>
          )}
        </div>

        {/* 戻るボタン */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            ホームに戻る
          </button>
        </div>
      </div>

      {/* ログイン・登録・ゲストモーダル */}
      {joiningMode && (
        <JoinModal
          mode={joiningMode}
          invitation={invitation}
          token={params.token}
          onClose={() => setJoiningMode(null)}
          onJoinSuccess={() => {
            setJoinSuccess(true);
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }}
        />
      )}
    </div>
  );
}

interface JoinModalProps {
  mode: 'register' | 'guest';
  invitation: InvitationDetails;
  token: string;
  onClose: () => void;
  onJoinSuccess: () => void;
}

function JoinModal({ mode, invitation, token, onClose, onJoinSuccess }: JoinModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { guestLogin } = useAuthStore();
  const { fetchGroups, fetchTravels } = useTravelStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        // 新規登録と同時参加
        const joinRequest: JoinInvitationRequest = {
          userData: {
            email,
            password,
            name,
          },
        };

        const result = await invitationLinkApi.join(token, joinRequest);

        if (result.success) {
          // 新規登録の場合はユーザー情報とトークンを設定
          if (result.user && result.access_token) {
            localStorage.setItem('access_token', result.access_token);
            // 通常のユーザーとして登録完了（authStoreで自動処理される）
          }

          // 参加成功後にグループとトラベルデータを再取得
          try {
            await Promise.all([fetchGroups(), fetchTravels()]);
          } catch (error) {
            console.warn('Failed to refresh data after join:', error);
          }

          onJoinSuccess();
        } else {
          alert(result.message || '参加に失敗しました');
        }
      } else {
        // ゲスト参加 - 新しいguestLoginメソッドを使用
        const result = await guestLogin(nickname, invitation.group.id);

        if (result.success) {
          // 参加成功後にグループとトラベルデータを再取得
          try {
            await Promise.all([fetchGroups(), fetchTravels()]);
          } catch (error) {
            console.warn('Failed to refresh data after guest login:', error);
          }

          onJoinSuccess();
        } else {
          alert(result.message || 'ゲストログインに失敗しました');
        }
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('グループ参加に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    if (mode === 'guest') return 'ゲストとして参加';
    if (mode === 'register') return '新規アカウント作成';
    return '参加';
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{getModalTitle()}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'guest' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ニックネーム *
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="表示名を入力してください"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                ゲストモードでは一部機能が制限されます
              </p>
            </div>
          ) : (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前 *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    placeholder="山田太郎"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  placeholder={mode === 'register' ? '8文字以上' : 'パスワード'}
                  minLength={mode === 'register' ? 8 : undefined}
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
            >
              {isSubmitting ? '処理中...' : mode === 'guest' ? 'ゲスト参加' : '参加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}