import type { Metadata } from 'next';
import './globals.css';
import GoogleAnalytics from '../components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'Travel Planner',
  description: '共同プランニング＆バイラルVlog生成アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
