import Script from 'next/script';
import BlogClient from './BlogClient';

async function getPosts(category: string = 'all', search: string = '', page: number = 1) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    category,
    search,
    page: String(page),
    limit: '9'
  });
  
  const res = await fetch(`${baseUrl}/api/blog/posts?${params}`, {
    cache: 'no-store',
  });
  
  if (!res.ok) return { posts: [], totalPages: 1 };
  return res.json();
}

async function getCategories() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/blog/categories`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories || [];
}

export default async function BlogPage() {
  const [postsData, categories] = await Promise.all([
    getPosts(),
    getCategories()
  ]);

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Блог ресторана Челентано",
    "description": "Новости, события, рецепты и истории гостей ресторана Челентано в Махачкале.",
    "url": "https://chelentano05.ru/blog",
    "blogPost": postsData.posts.slice(0, 5).map((post: any) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.imageUrl,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "datePublished": post.publishedAt
    }))
  };

  return (
    <>
      <Script
        id="blog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <BlogClient
        initialPosts={postsData.posts || []}
        initialCategories={categories}
        initialTotalPages={postsData.totalPages || 1}
      />
    </>
  );
}