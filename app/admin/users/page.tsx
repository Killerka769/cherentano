'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, User, Shield, Crown, Trash2, Edit2, X, 
  Lock, Unlock, AlertCircle, Eye, Calendar, Mail, Phone 
} from 'lucide-react';
import styles from './page.module.scss';

interface User {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  isBlocked: boolean;
  blockedUntil: string | null;
  blockReason: string | null;
  blockedAt: string | null;
  createdAt: string;
  _count: { orders: number };
}

const roleLabels: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  USER: { 
    label: 'Пользователь', 
    color: '#2196f3', 
    bg: '#e3f2fd',
    icon: <User size={14} /> 
  },
  MANAGER: { 
    label: 'Менеджер', 
    color: '#ff9800', 
    bg: '#fff3e0',
    icon: <Shield size={14} /> 
  },
  ADMIN: { 
    label: 'Администратор', 
    color: '#f44336', 
    bg: '#ffebee',
    icon: <Crown size={14} /> 
  }
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [blockedFilter, setBlockedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [blockModal, setBlockModal] = useState<User | null>(null);
  const [blockType, setBlockType] = useState<'temporary' | 'permanent'>('temporary');
  const [blockDuration, setBlockDuration] = useState('7');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user, search, roleFilter, blockedFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${search}&role=${roleFilter}&blocked=${blockedFilter}`);
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || []);
      setBlockedCount(data.blockedCount || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      
      if (res.ok) {
        fetchUsers();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const updateBlockStatus = async (userId: string, isBlocked: boolean, blockedUntil?: string | null, blockReason?: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          isBlocked, 
          blockedUntil: blockedUntil || null,
          blockReason: blockReason || null
        })
      });
      
      if (res.ok) {
        fetchUsers();
        setBlockModal(null);
        setBlockReason('');
        setBlockDuration('7');
      }
    } catch (error) {
      console.error('Failed to update block status:', error);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (confirm(`Удалить пользователя ${userName || userId}?`)) {
      try {
        const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
        if (res.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const getRoleCount = (role: string) => {
    const stat = stats.find(s => s.role === role);
    return stat?._count || 0;
  };

  const getBlockStatusText = (user: User) => {
    if (!user.isBlocked) return null;
    if (user.blockedUntil) {
      const until = new Date(user.blockedUntil);
      return `⛔ Заблокирован до ${until.toLocaleDateString('ru-RU')}`;
    }
    return '⛔ Заблокирован навсегда';
  };

  if (loading || isLoading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Загрузка пользователей...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление пользователями</h1>
          <p className={styles.subtitle}>Всего пользователей: {users.length}</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{users.length}</span>
          <span className={styles.statLabel}>Всего</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getRoleCount('USER')}</span>
          <span className={styles.statLabel}>👤 Пользователей</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getRoleCount('MANAGER')}</span>
          <span className={styles.statLabel}>🛡️ Менеджеров</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getRoleCount('ADMIN')}</span>
          <span className={styles.statLabel}>👑 Админов</span>
        </div>
        <div className={`${styles.statCard} ${styles.blockedStat}`}>
          <span className={styles.statValue}>{blockedCount}</span>
          <span className={styles.statLabel}>🔒 Заблокировано</span>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Поиск по имени, email или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={styles.filterSelect}>
          <option value="all">Все роли</option>
          <option value="USER">👤 Пользователи</option>
          <option value="MANAGER">🛡️ Менеджеры</option>
          <option value="ADMIN">👑 Администраторы</option>
        </select>

        <select value={blockedFilter} onChange={(e) => setBlockedFilter(e.target.value)} className={styles.filterSelect}>
          <option value="all">Все статусы</option>
          <option value="false">✅ Активные</option>
          <option value="true">🔒 Заблокированные</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Контакты</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Заказов</th>
              <th>Регистрация</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => (
              <tr key={userItem.id} className={userItem.isBlocked ? styles.blockedRow : ''}>
                <td className={styles.userCell}>
                  <div className={`${styles.userAvatar} ${userItem.isBlocked ? styles.blockedAvatar : ''}`}>
                    {userItem.name ? userItem.name[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <Link href={`/profile/${userItem.id}`} className={styles.userNameLink}>
                      {userItem.name || 'Без имени'}
                    </Link>
                    <div className={styles.userId}>ID: {userItem.id.slice(0, 8)}...</div>
                  </div>
                </td>
                <td className={styles.contactCell}>
                  <div className={styles.contactItem}>
                    <Mail size={14} />
                    <span>{userItem.email}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <Phone size={14} />
                    <span>{userItem.phone}</span>
                  </div>
                </td>
                <td>
                  <span 
                    className={`${styles.roleBadge} ${styles[userItem.role.toLowerCase()]}`}
                    style={{ background: roleLabels[userItem.role]?.bg, color: roleLabels[userItem.role]?.color }}
                  >
                    {roleLabels[userItem.role]?.icon}
                    {roleLabels[userItem.role]?.label}
                  </span>
                </td>
                <td>
                  {userItem.isBlocked ? (
                    <span className={styles.blockedBadge} title={userItem.blockReason || ''}>
                      <Lock size={12} /> Заблокирован
                    </span>
                  ) : (
                    <span className={styles.activeBadge}>
                      <Unlock size={12} /> Активен
                    </span>
                  )}
                </td>
                <td className={styles.ordersCount}>
                  <Link href={`/admin/orders?userId=${userItem.id}`} className={styles.ordersLink}>
                    {userItem._count.orders} заказов
                  </Link>
                </td>
                <td>
                  <div className={styles.dateCell}>
                    <Calendar size={14} />
                    {new Date(userItem.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </td>
                <td className={styles.actions}>
                  <button
                    onClick={() => {
                      setEditingUser(userItem);
                      setSelectedRole(userItem.role);
                    }}
                    className={styles.editBtn}
                    title="Изменить роль"
                  >
                    <Edit2 size={16} />
                  </button>
                  <Link href={`/profile/${userItem.id}`} className={styles.viewBtn} title="Просмотр профиля">
                    <Eye size={16} />
                  </Link>
                  {!userItem.isBlocked ? (
                    <button
                      onClick={() => setBlockModal(userItem)}
                      className={styles.blockBtn}
                      title="Заблокировать"
                    >
                      <Lock size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateBlockStatus(userItem.id, false)}
                      className={styles.unblockBtn}
                      title="Разблокировать"
                    >
                      <Unlock size={16} />
                    </button>
                  )}
                  {userItem.id !== user?.id && (
                    <button
                      onClick={() => deleteUser(userItem.id, userItem.name || userItem.email)}
                      className={styles.deleteBtn}
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className={styles.empty}>
          <User size={48} />
          <p>Пользователи не найдены</p>
        </div>
      )}

      {/* Модальное окно смены роли */}
      {editingUser && (
        <div className={styles.modal} onClick={() => setEditingUser(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Смена роли</h3>
              <button onClick={() => setEditingUser(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatarSmall}>
                  {editingUser.name ? editingUser.name[0].toUpperCase() : '?'}
                </div>
                <div>
                  <div className={styles.userName}>{editingUser.name || 'Без имени'}</div>
                  <div className={styles.userEmail}>{editingUser.email}</div>
                </div>
              </div>
              <div className={styles.roleSelect}>
                <label>Новая роль:</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="USER">👤 Пользователь</option>
                  <option value="MANAGER">🛡️ Менеджер</option>
                  <option value="ADMIN">👑 Администратор</option>
                </select>
              </div>
              <div className={styles.modalButtons}>
                <button onClick={() => updateRole(editingUser.id, selectedRole)} className={styles.saveBtn}>
                  Сохранить
                </button>
                <button onClick={() => setEditingUser(null)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно блокировки */}
      {blockModal && (
        <div className={styles.modal} onClick={() => setBlockModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🔒 Блокировка пользователя</h3>
              <button onClick={() => setBlockModal(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatarSmall}>
                  {blockModal.name ? blockModal.name[0].toUpperCase() : '?'}
                </div>
                <div>
                  <div className={styles.userName}>{blockModal.name || 'Без имени'}</div>
                  <div className={styles.userEmail}>{blockModal.email}</div>
                </div>
              </div>
              
              <div className={styles.blockTypeSelect}>
                <label>Тип блокировки:</label>
                <div className={styles.blockTypeButtons}>
                  <button
                    type="button"
                    onClick={() => setBlockType('temporary')}
                    className={`${styles.blockTypeBtn} ${blockType === 'temporary' ? styles.active : ''}`}
                  >
                    ⏰ Временная
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockType('permanent')}
                    className={`${styles.blockTypeBtn} ${blockType === 'permanent' ? styles.active : ''}`}
                  >
                    🔒 Навсегда
                  </button>
                </div>
              </div>

              {blockType === 'temporary' && (
                <div className={styles.durationSelect}>
                  <label>Длительность блокировки:</label>
                  <select value={blockDuration} onChange={(e) => setBlockDuration(e.target.value)}>
                    <option value="1">1 день</option>
                    <option value="3">3 дня</option>
                    <option value="7">7 дней</option>
                    <option value="14">14 дней</option>
                    <option value="30">30 дней</option>
                  </select>
                </div>
              )}

              <div className={styles.reasonInput}>
                <label>Причина блокировки (необязательно):</label>
                <textarea
                  placeholder="Нарушение правил, спам, мошенничество..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.modalButtons}>
                <button 
                  onClick={() => {
                    const blockedUntil = blockType === 'temporary' 
                      ? new Date(Date.now() + parseInt(blockDuration) * 24 * 60 * 60 * 1000).toISOString()
                      : null;
                    updateBlockStatus(blockModal.id, true, blockedUntil, blockReason);
                  }}
                  className={styles.blockSubmitBtn}
                >
                  Заблокировать
                </button>
                <button onClick={() => setBlockModal(null)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}