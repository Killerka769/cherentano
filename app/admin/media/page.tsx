'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Upload, Copy, Trash2, Image, FileImage, X, Check, Loader2,
  Folder, FolderPlus, ArrowLeft, Home, File, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface MediaItem {
  name: string;
  type: 'folder' | 'file';
  path?: string;
  url?: string;
  size?: number;
  createdAt: string;
  mimeType?: string;
}

interface Breadcrumb {
  name: string;
  path: string;
}

export default function AdminMediaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchFiles(currentFolder);
    }
  }, [user, currentFolder]);

  const fetchFiles = async (folder: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (folder) params.set('folder', folder);
      
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setItems(data.items || []);
        setBreadcrumbs(data.breadcrumbs || []);
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set('folder', currentFolder);
      
      const res = await fetch(`/api/admin/media?${params}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Файл загружен!');
        fetchFiles(currentFolder);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Введите имя папки');
      return;
    }

    setIsCreatingFolder(true);
    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set('folder', currentFolder);
      params.set('action', 'create-folder');

      const res = await fetch(`/api/admin/media?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: newFolderName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Папка создана');
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        fetchFiles(currentFolder);
      } else {
        toast.error(data.error || 'Ошибка создания');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    const typeLabel = item.type === 'folder' ? 'папку' : 'файл';
    if (!confirm(`Удалить ${typeLabel} "${item.name}"?`)) return;

    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set('folder', currentFolder);
      params.set('name', item.name);

      const res = await fetch(`/api/admin/media?${params}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`${item.type === 'folder' ? 'Папка' : 'Файл'} удален`);
        fetchFiles(currentFolder);
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    toast.success('Ссылка скопирована!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const navigateToFolder = (folderPath: string) => {
    setCurrentFolder(folderPath);
  };

  const navigateToBreadcrumb = (path: string) => {
    setCurrentFolder(path);
  };

  const goHome = () => {
    setCurrentFolder('');
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🖼️ Медиатека</h1>
        <div className={styles.headerActions}>
          <button 
            onClick={() => setIsCreateFolderOpen(true)} 
            className={styles.folderBtn}
          >
            <FolderPlus size={18} />
            Папка
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className={styles.uploadBtn}
            disabled={isUploading}
          >
            <Upload size={18} />
            {isUploading ? 'Загрузка...' : 'Загрузить фото'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleUpload}
            className={styles.fileInput}
            disabled={isUploading}
          />
        </div>
      </div>

      {/* Хлебные крошки */}
      <div className={styles.breadcrumbs}>
        <button onClick={goHome} className={styles.breadcrumbHome} title="Корень">
          <Home size={16} />
        </button>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.path} className={styles.breadcrumbItem}>
            <ChevronRight size={14} className={styles.breadcrumbSeparator} />
            <button 
              onClick={() => navigateToBreadcrumb(crumb.path)}
              className={styles.breadcrumbLink}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Поиск */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className={styles.clearSearchBtn}>
            ✕
          </button>
        )}
      </div>

      {/* Модалка создания папки */}
      {isCreateFolderOpen && (
        <div className={styles.modal} onClick={() => setIsCreateFolderOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>📁 Создать папку</h3>
            <p className={styles.modalSubtitle}>
              {currentFolder ? `В папке: ${currentFolder}` : 'В корневой папке'}
            </p>
            <input
              type="text"
              placeholder="Название папки"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className={styles.folderInput}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setIsCreateFolderOpen(false);
              }}
            />
            <div className={styles.modalActions}>
              <button 
                onClick={handleCreateFolder} 
                className={styles.createFolderBtn}
                disabled={isCreatingFolder}
              >
                {isCreatingFolder ? 'Создание...' : 'Создать'}
              </button>
              <button 
                onClick={() => setIsCreateFolderOpen(false)} 
                className={styles.cancelBtn}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список файлов и папок */}
      {filteredItems.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery ? (
            <>
              <Image size={48} strokeWidth={1} />
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить поисковый запрос</p>
            </>
          ) : (
            <>
              <Image size={48} strokeWidth={1} />
              <h3>Пусто</h3>
              <p>Создайте папку или загрузите фото</p>
            </>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => (
            <div key={item.name} className={`${styles.card} ${item.type === 'folder' ? styles.folderCard : ''}`}>
              {item.type === 'folder' ? (
                <div className={styles.folderPreview} onClick={() => navigateToFolder(item.path!)}>
                  <Folder size={48} className={styles.folderIcon} />
                </div>
              ) : (
                <div className={styles.preview}>
                  <img src={item.url} alt={item.name} />
                </div>
              )}
              <div className={styles.info}>
                <div className={styles.fileName} title={item.name}>
                  {item.type === 'folder' ? '📁 ' : ''}{item.name}
                </div>
                <div className={styles.fileMeta}>
                  {item.type === 'folder' ? (
                    <span>Папка</span>
                  ) : (
                    <>
                      <span>{formatSize(item.size!)}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.actions}>
                {item.type === 'file' && (
                  <button 
                    onClick={() => handleCopyUrl(item.url!)} 
                    className={`${styles.copyBtn} ${copiedUrl === item.url ? styles.copied : ''}`}
                    title="Копировать ссылку"
                  >
                    {copiedUrl === item.url ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(item)} 
                  className={styles.deleteBtn}
                  title={item.type === 'folder' ? 'Удалить папку' : 'Удалить файл'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}