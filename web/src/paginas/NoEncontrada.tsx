import Enlace from '../componentes/Enlace.tsx'
import { useIdioma } from '../hooks/useIdioma.ts'
import { direccion } from '../util/rutas.ts'

export default function NoEncontrada() {
  const { t } = useIdioma()
  return (
    <div className="pagina-simple">
      <h1 className="pagina-simple__titulo">{t('noEncontrada.titulo')}</h1>
      <p>{t('noEncontrada.texto')}</p>
      <p>
        <Enlace href={direccion({ pagina: 'inicio' })}>{t('noEncontrada.volver')}</Enlace>
      </p>
    </div>
  )
}
