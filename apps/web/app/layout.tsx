import './globals.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gemelo Digital Chancay',
  description: 'Visualización y análisis del gemelo digital de Chancay',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
