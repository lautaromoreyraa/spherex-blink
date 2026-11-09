import { useIdioma } from '../hooks/useIdioma.ts'

type Props =
  | { estado: 'cargando'; texto?: string }
  | { estado: 'error'; mensaje: string; alReintentar: () => void }

/** Cargando o error, con el mismo aspecto en todas las páginas. */
export default function EstadoDeCarga(props: Props) {
  const { t } = useIdioma()
  if (props.estado === 'cargando') {
    return (
      <p className="estado" role="status">
        {props.texto ?? t('cargando')}
      </p>
    )
  }
  return (
    <div className="estado estado--error" role="alert">
      <p>{t('error.datos', { detalle: props.mensaje })}</p>
      <button type="button" className="boton" onClick={props.alReintentar}>
        {t('error.reintentar')}
      </button>
    </div>
  )
}
