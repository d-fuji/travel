'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

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

  const { login, register } = useAuthStore();

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
    </div>
  );
}
