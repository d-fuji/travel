import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Travel Planner',
  description: '共同プランニング＆バイラルVlog生成アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}