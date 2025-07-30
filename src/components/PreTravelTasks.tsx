'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PreTravelTask, TaskCategory } from '@/types';
import { 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Filter,
  Plane,
  Hotel,
  FileText,
  Package,
  Ticket,
  MoreHorizontal,
  AlertCircle,
  Users
} from 'lucide-react';

interface PreTravelTasksProps {
  travelId: string;
}

// デモ用のカテゴリデータ
const taskCategories: TaskCategory[] = [
  { id: '1', name: '交通手配', color: 'bg-blue-500', icon: 'plane', order: 1 },
  { id: '2', name: '宿泊手配', color: 'bg-green-500', icon: 'hotel', order: 2 },
  { id: '3', name: 'パスポート・ビザ', color: 'bg-purple-500', icon: 'file-text', order: 3 },
  { id: '4', name: '持ち物準備', color: 'bg-orange-500', icon: 'package', order: 4 },
  { id: '5', name: '予約・チケット', color: 'bg-pink-500', icon: 'ticket', order: 5 },
  { id: '6', name: 'その他', color: 'bg-gray-500', icon: 'more-horizontal', order: 6 },
];

// デモ用のタスクデータ
const mockTasks: PreTravelTask[] = [
  {
    id: '1',
    travelId: 'demo',
    title: '航空券の予約',
    category: taskCategories[0],
    assignedTo: ['user1'],
    dueDate: new Date('2024-02-15'),
    priority: 'high',
    status: 'completed',
    memo: '往復チケット、座席指定済み',
    createdBy: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    completedAt: new Date('2024-01-12'),
    completedBy: 'user1'
  },
  {
    id: '2',
    travelId: 'demo',
    title: 'ホテルの予約確認',
    category: taskCategories[1],
    assignedTo: ['user2'],
    dueDate: new Date('2024-02-20'),
    priority: 'high',
    status: 'pending',
    memo: 'キャンセル料無料期間を確認',
    createdBy: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '3',
    travelId: 'demo',
    title: 'パスポート有効期限確認',
    category: taskCategories[2],
    assignedTo: ['user1', 'user2'],
    dueDate: new Date('2024-02-10'),
    priority: 'high',
    status: 'pending',
    memo: '6ヶ月以上の残存期間が必要',
    createdBy: 'user2',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  },
  {
    id: '4',
    travelId: 'demo',
    title: '衣類の準備',
    category: taskCategories[3],
    assignedTo: ['user1'],
    dueDate: new Date('2024-02-28'),
    priority: 'medium',
    status: 'pending',
    memo: '現地の天気予報を確認してから',
    createdBy: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '5',
    travelId: 'demo',
    title: '観光地の事前予約',
    category: taskCategories[4],
    assignedTo: ['user2'],
    dueDate: new Date('2024-02-25'),
    priority: 'medium',
    status: 'pending',
    memo: '人気スポットは早めの予約が必要',
    createdBy: 'user2',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12')
  }
];

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'plane': Plane,
    'hotel': Hotel,
    'file-text': FileText,
    'package': Package,
    'ticket': Ticket,
    'more-horizontal': MoreHorizontal
  };
  return iconMap[iconName] || MoreHorizontal;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '中';
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
};

const getDaysUntilDue = (dueDate: Date) => {
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function PreTravelTasks({ travelId }: PreTravelTasksProps) {
  const { user, guestUser, isGuest } = useAuthStore();
  const [tasks, setTasks] = useState<PreTravelTask[]>(mockTasks);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const currentUser = user || guestUser;
  const canEdit = !isGuest; // ゲストユーザーは閲覧のみ

  // フィルタリング
  const filteredTasks = tasks.filter(task => {
    const categoryMatch = selectedCategory === 'all' || task.category.id === selectedCategory;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  // 統計情報
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.dueDate) return false;
    return getDaysUntilDue(t.dueDate) < 0;
  }).length;
  const urgentTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.dueDate) return false;
    const days = getDaysUntilDue(t.dueDate);
    return days >= 0 && days <= 3;
  }).length;

  const toggleTaskStatus = (taskId: string) => {
    if (!canEdit) return;
    
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const isCompleting = task.status === 'pending';
        return {
          ...task,
          status: isCompleting ? 'completed' : 'pending',
          completedAt: isCompleting ? new Date() : undefined,
          completedBy: isCompleting ? currentUser?.id : undefined,
          updatedAt: new Date()
        };
      }
      return task;
    }));
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー統計 */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">事前準備タスク</h2>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              タスク追加
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
            <div className="text-sm text-gray-600">総タスク数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-sm text-gray-600">完了済み</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
            <div className="text-sm text-gray-600">期限超過</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{urgentTasks}</div>
            <div className="text-sm text-gray-600">緊急（3日以内）</div>
          </div>
        </div>
        
        {/* 進捗バー */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>完了率</span>
            <span>{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">フィルター:</span>
          </div>
          
          {/* カテゴリフィルター */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1"
          >
            <option value="all">全カテゴリ</option>
            {taskCategories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          
          {/* ステータスフィルター */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1"
          >
            <option value="all">全ステータス</option>
            <option value="pending">未完了</option>
            <option value="completed">完了済み</option>
          </select>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600">
              {selectedCategory !== 'all' || selectedStatus !== 'all' 
                ? 'フィルター条件に一致するタスクがありません' 
                : 'まだタスクがありません'}
            </p>
            {canEdit && selectedCategory === 'all' && selectedStatus === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                最初のタスクを追加する
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => {
            const IconComponent = getIconComponent(task.category.icon);
            const isOverdue = task.dueDate && task.status === 'pending' && getDaysUntilDue(task.dueDate) < 0;
            const isUrgent = task.dueDate && task.status === 'pending' && getDaysUntilDue(task.dueDate) <= 3 && getDaysUntilDue(task.dueDate) >= 0;
            
            return (
              <div 
                key={task.id} 
                className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${
                  isOverdue ? 'border-red-500' : 
                  isUrgent ? 'border-orange-500' : 
                  task.status === 'completed' ? 'border-green-500' : 
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* チェックボックス */}
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    disabled={!canEdit}
                    className={`mt-1 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  
                  {/* カテゴリアイコン */}
                  <div className={`p-2 rounded-lg ${task.category.color} bg-opacity-20`}>
                    <IconComponent className={`w-4 h-4 text-white`} />
                  </div>
                  
                  {/* タスク内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          {/* カテゴリ */}
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${task.category.color}`}></span>
                            {task.category.name}
                          </span>
                          
                          {/* 担当者 */}
                          <span className="flex items-center gap-1">
                            {task.assignedTo.length > 1 ? (
                              <Users className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {task.assignedTo.length}人
                          </span>
                          
                          {/* 優先度 */}
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                          
                          {/* 期限 */}
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${
                              isOverdue ? 'text-red-600' : 
                              isUrgent ? 'text-orange-600' : 
                              'text-gray-600'
                            }`}>
                              {isOverdue && <AlertCircle className="w-3 h-3" />}
                              <Clock className="w-3 h-3" />
                              {formatDate(task.dueDate)}
                              {task.dueDate && (
                                <span className="text-xs">
                                  ({getDaysUntilDue(task.dueDate) === 0 ? '今日' : 
                                    getDaysUntilDue(task.dueDate) > 0 ? `${getDaysUntilDue(task.dueDate)}日後` : 
                                    `${Math.abs(getDaysUntilDue(task.dueDate))}日前`})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        
                        {/* メモ */}
                        {task.memo && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
                            {task.memo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ゲストユーザー向けメッセージ */}
      {isGuest && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 rounded-full p-1">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">ゲストユーザーとしてご利用中</h4>
              <p className="text-sm text-blue-700 mt-1">
                タスクの閲覧のみ可能です。タスクの追加や編集を行うには、アカウントを作成してください。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* タスク追加モーダル（簡易版） */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">新しいタスクの追加</h3>
            <p className="text-gray-600 mb-4">
              この機能は開発中です。完全版では詳細なタスク追加フォームが表示されます。
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}