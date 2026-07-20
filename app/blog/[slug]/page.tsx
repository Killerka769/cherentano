import BlogPostClient from './BlogPostClient';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

async function getPost(slug: string) {
  
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true },
    include: {
      category: true,
      comments: {
        where: { isApproved: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  
  return post;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Пробуем найти с декодированным slug
  const post = await getPost(decodeURIComponent(slug));
  
  if (!post) {
    notFound();
  }
  
  const serializedPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    author: post.author,
    views: post.views,
    publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
    category: post.category,
    comments: post.comments.map(comment => ({
      id: comment.id,
      authorName: comment.authorName,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      userId: comment.userId,
      user: comment.user ? {
        id: comment.user.id,
        name: comment.user.name,
        role: comment.user.role,
      } : null,
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.content?.slice(0, 160).replace(/<[^>]+>/g, '') || post.title,
    "image": post.imageUrl || "https://chelentano05.ru/images/og-image.jpg",
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "datePublished": post.publishedAt?.toISOString() || new Date().toISOString(),
    "dateModified": post.updatedAt?.toISOString() || new Date().toISOString(),
    "publisher": {
      "@type": "Organization",
      "name": "Челентано",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chelentano05.ru/images/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://chelentano05.ru/blog/${post.slug}`
    }
  };

  // BreadcrumbList для статьи
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Главная",
        "item": "https://chelentano05.ru"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Блог",
        "item": "https://chelentano05.ru/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://chelentano05.ru/blog/${post.slug}`
      }
    ]
  };
  
  return (
    <>
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogPostClient initialPost={serializedPost} />
    </>
  );
}