import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MEDIA_ROOT = path.join(process.cwd(), 'public/uploads/media');

// Вспомогательная функция: безопасный путь
function getSafePath(subPath: string = ''): string {
  const fullPath = path.join(MEDIA_ROOT, subPath);
  // Проверяем, что путь внутри MEDIA_ROOT (безопасность)
  if (!fullPath.startsWith(MEDIA_ROOT)) {
    throw new Error('Access denied');
  }
  return fullPath;
}

// GET — список файлов и папок
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';

    const currentPath = getSafePath(folder);
    
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath, { recursive: true });
      return NextResponse.json({ items: [], currentFolder: folder });
    }

    const items = fs.readdirSync(currentPath).map(name => {
      const itemPath = path.join(currentPath, name);
      const stats = fs.statSync(itemPath);
      const isDirectory = stats.isDirectory();

      if (isDirectory) {
        return {
          name,
          type: 'folder',
          path: folder ? `${folder}/${name}` : name,
          createdAt: stats.birthtime || stats.ctime,
        };
      }

      const ext = path.extname(name).toLowerCase();
      const typeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };

      return {
        name,
        type: 'file',
        url: `/uploads/media/${folder ? `${folder}/` : ''}${name}`,
        size: stats.size,
        createdAt: stats.birthtime || stats.ctime,
        mimeType: typeMap[ext] || 'image/webp',
      };
    });

    // Сортировка: папки сверху, затем файлы по дате
    items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Навигация (хлебные крошки)
    const breadcrumbs = folder ? folder.split('/').map((name, index, arr) => ({
      name,
      path: arr.slice(0, index + 1).join('/'),
    })) : [];

    return NextResponse.json({ 
      items, 
      currentFolder: folder,
      breadcrumbs,
      root: MEDIA_ROOT,
    });
  } catch (error) {
    console.error('Error reading media:', error);
    return NextResponse.json({ error: 'Ошибка чтения файлов' }, { status: 500 });
  }
}

// POST — загрузка файла или создание папки
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';
    const action = searchParams.get('action') || 'upload';

    const currentPath = getSafePath(folder);

    // Создание папки
    if (action === 'create-folder') {
      const { folderName } = await request.json();
      if (!folderName) {
        return NextResponse.json({ error: 'Имя папки не указано' }, { status: 400 });
      }

      const folderPath = path.join(currentPath, folderName);
      if (fs.existsSync(folderPath)) {
        return NextResponse.json({ error: 'Папка уже существует' }, { status: 400 });
      }

      fs.mkdirSync(folderPath, { recursive: true });
      return NextResponse.json({ 
        success: true, 
        folder: folder ? `${folder}/${folderName}` : folderName,
        message: 'Папка создана' 
      });
    }

    // Загрузка файла
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `Неподдерживаемый формат. Разрешены: ${ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: `Файл слишком большой. Максимум ${MAX_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name);
    const name = path.basename(file.name, ext);
    const filename = `${name}-${randomUUID().slice(0, 8)}${ext}`;
    
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath, { recursive: true });
    }

    const filePath = path.join(currentPath, filename);
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/media/${folder ? `${folder}/` : ''}${filename}`;

    return NextResponse.json({ 
      success: true, 
      url,
      filename,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}

// DELETE — удаление файла или папки
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Имя не указано' }, { status: 400 });
    }

    const currentPath = getSafePath(folder);
    const targetPath = path.join(currentPath, name);

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    }

    const stats = fs.statSync(targetPath);
    
    if (stats.isDirectory()) {
      // Удаляем папку рекурсивно
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting:', error);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}