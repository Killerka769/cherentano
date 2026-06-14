'use client';

interface RoleBadgeProps {
  role?: 'USER' | 'MANAGER' | 'ADMIN' | string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  if (!role || role === 'USER') return null;
  
  const roles: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    MANAGER: { 
      label: 'Менеджер', 
      icon: '🛡️',
      color: '#ff9800',
      bg: '#fff3e0'
    },
    ADMIN: { 
      label: 'Администратор', 
      icon: '👑',
      color: '#f44336',
      bg: '#ffebee'
    }
  };
  
  const info = roles[role];
  
  return (
    <span 
      className="role-badge" 
      style={{ 
        background: info.bg, 
        color: info.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: '500'
      }}
    >
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
}