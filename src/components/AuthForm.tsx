'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { UserCheck } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuestLogin, setShowGuestLogin] = useState(false);

  const { login, register, quickGuestLogin, getStoredGuestInfo } = useAuthStore();

  const handleInputChange = () => {
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }

      // Force page reload to ensure proper state update
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      // Extract error message from API response
      let errorMessage =
        mode === 'login'
          ? 'ログインに失敗しました'
          : 'アカウント作成に失敗しました';
      if (error.response?.data?.message) {
        const apiMessage = error.response.data.message;
        if (
          apiMessage.includes('Invalid credentials') ||
          apiMessage.includes('Unauthorized')
        ) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません';
        } else if (apiMessage.includes('User not found')) {
          errorMessage = 'このメールアドレスのアカウントが見つかりません';
        } else if (apiMessage.includes('Password')) {
          errorMessage = 'パスワードが正しくありません';
        } else if (
          apiMessage.includes('Email') &&
          apiMessage.includes('already')
        ) {
          errorMessage = 'このメールアドレスは既に登録されています';
        } else if (
          apiMessage.includes('validation') ||
          apiMessage.includes('invalid')
        ) {
          errorMessage = '入力内容に誤りがあります';
        } else if (
          apiMessage.includes('network') ||
          apiMessage.includes('connection')
        ) {
          errorMessage = 'ネットワークエラーが発生しました';
        } else {
          errorMessage =
            mode === 'login'
              ? 'ログインに失敗しました'
              : 'アカウント作成に失敗しました';
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'ネットワークに接続できません';
      } else if (error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'ネットワークエラーが発生しました';
        } else {
          errorMessage =
            mode === 'login'
              ? 'ログインに失敗しました'
              : 'アカウント作成に失敗しました';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Travel Planner
            </h1>
            <p className="text-gray-600">
              {mode === 'login'
                ? 'ログインして旅行プランを始めよう'
                : '新しいアカウントを作成'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    handleInputChange();
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="山田太郎"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleInputChange();
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
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
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? '処理中...'
                : mode === 'login'
                  ? 'ログイン'
                  : 'アカウント作成'}
            </button>
          </form>

          {/* ゲストログインボタン（招待経由でのログイン履歴がある場合のみ表示） */}
          {getStoredGuestInfo() && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>
              
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const result = await quickGuestLogin();
                    if (result.success) {
                      if (typeof window !== 'undefined') {
                        window.location.reload();
                      }
                    } else {
                      setError(result.message || 'ゲストログインに失敗しました');
                    }
                  } catch (error) {
                    console.error('Quick guest login error:', error);
                    setError('ゲストログインに失敗しました');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full mt-4 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                {loading ? '処理中...' : `${getStoredGuestInfo()?.nickname}でログイン`}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={onToggleMode}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {mode === 'login' ? 'アカウントを作成' : 'ログインに戻る'}
            </button>
          </div>
        </div>
      </div>

      {/* ゲストログインモーダル */}
      {showGuestLogin && (
        <GuestLoginModal
          onClose={() => setShowGuestLogin(false)}
          onSuccess={() => {
            setShowGuestLogin(false);
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}

interface GuestLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function GuestLoginModal({ onClose, onSuccess }: GuestLoginModalProps) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { guestLogin } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    setError('');

    try {
      // デモ用のダミーグループIDを使用
      const result = await guestLogin(nickname.trim(), 'demo-group-id');
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'ゲストログインに失敗しました');
      }
    } catch (error: any) {
      console.error('Guest login error:', error);
      setError('ゲストログインに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">ゲストログイン</h3>
        
        <p className="text-sm text-gray-600 mb-4">
          ニックネームを入力してゲストとして体験できます。一部機能は制限されますが、旅程の閲覧が可能です。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
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
              disabled={loading || !nickname.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '処理中...' : 'ゲストログイン'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
