import { useIdioma } from '../../hooks/useIdioma.ts'

/**
 * Lo que se ve sin WebGL (RNF-13): una captura fija de la escena. El texto de
 * la página —fechas, ángulos, avisos— es el mismo, y el paso al visor sigue
 * andando, sólo que sin vuelo. Hay una sola captura, la del campo de
 * Makemake, así que en otro campo se aclara que no es la suya.
 */
export default function ImagenFijaDeLaEscena({
  esMakemake,
  base = import.meta.env.BASE_URL,
}: {
  esMakemake: boolean
  base?: string
}) {
  const { t } = useIdioma()
  const prefijo = base.endsWith('/') ? base : `${base}/`
  return (
    <figure className="escena__fija">
      <img src={`${prefijo}escena/escena-fija.jpg`} width={1204} height={771} alt={t('escena.fijaAlt')} />
      <figcaption>{t(esMakemake ? 'escena.fija' : 'escena.fijaOtroCampo')}</figcaption>
    </figure>
  )
}
