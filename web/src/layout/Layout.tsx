import type { ReactNode } from 'react'
import '../estilos/layout.css'
import Pie from './Pie.tsx'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <main className="layout__contenido">{children}</main>
      <Pie />
    </div>
  )
}
