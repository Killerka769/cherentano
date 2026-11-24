import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chelentano05.ru';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAbsoluteImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes('/_next/image')) return null;

  if (url.startsWith('https://') || url.startsWith('http://')) return url;
  if (url.startsWith('//')) return `https:${url}`;

  const origin = SITE_URL.replace(/\/$/, '');
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

function formatYmlDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function GET() {
  const [categories, dishes] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.dish.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        weight: true,
        isAvailable: true,
        categoryId: true,
      },
    }),
  ]);

  const offers = dishes.filter((dish) => dish.price > 0);
  const hasUncategorized = offers.some((dish) => !dish.categoryId);
  const origin = SITE_URL.replace(/\/$/, '');

  const categoryXml = [
    ...categories.map(
      (category) =>
        `      <category id="${category.id}">${escapeXml(category.name)}</category>`
    ),
    ...(hasUncategorized
      ? ['      <category id="0">Без категории</category>']
      : []),
  ].join('\n');

  const offersXml = offers
    .map((dish) => {
      const name = escapeXml(dish.name);
      const url = dish.slug
        ? `${origin}/menu/${encodeURIComponent(dish.slug)}`
        : `${origin}/menu`;
      const description = dish.description
        ? escapeXml(stripHtml(dish.description))
        : '';
      const picture = toAbsoluteImage(dish.imageUrl);
      const categoryId = dish.categoryId ?? 0;

      const parts = [
        `      <offer id="${dish.id}" available="${dish.isAvailable ? 'true' : 'false'}">`,
        `        <name>${name}</name>`,
        `        <url>${escapeXml(url)}</url>`,
        `        <price>${dish.price}</price>`,
        `        <currencyId>RUR</currencyId>`,
        `        <categoryId>${categoryId}</categoryId>`,
      ];

      if (picture) {
        parts.push(`        <picture>${escapeXml(picture)}</picture>`);
      }

      if (description) {
        parts.push(`        <description>${description}</description>`);
      }

      if (dish.weight) {
        parts.push(`        <param name="Вес" unit="г">${dish.weight}</param>`);
      }

      parts.push('      </offer>');
      return parts.join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog date="${formatYmlDate(new Date())}">
  <shop>
    <name>Челентано</name>
    <company>Ресторан «Челентано»</company>
    <url>${origin}/</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
${categoryXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>
`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
