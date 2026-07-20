import Link from 'next/link';

export default function BlogPostNotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>📄 Статья не найдена</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Возможно, она была удалена или ещё не опубликована
      </p>
      <Link
        href="/blog"
        style={{
          color: '#c4492c',
          textDecoration: 'underline',
          fontWeight: 500
        }}
      >
        ← Вернуться в блог
      </Link>
    </div>
  );
}