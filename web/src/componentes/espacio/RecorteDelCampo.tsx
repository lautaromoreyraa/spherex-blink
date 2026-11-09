import { Html, useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { NearestFilter, Quaternion, Matrix4, Vector3 } from 'three'
import type { PuntoDeEscena } from '../../util/escalas.ts'

interface Props {
  imagen: string
  /** Texto del botón, ya traducido. */
  texto: string
  posicion: PuntoDeEscena
  tierra: PuntoDeEscena
  tamano: number
  colorDelMarco: string
  onVolar: () => void
}

/**
 * El recorte real de SPHEREx al final de la línea de visión, mirando hacia
 * la Tierra: es adonde llega el vuelo (RF-36). Se dibuja con filtro de
 * vecino más cercano para que se vean los píxeles de 6,15″, que son la
 * unidad en la que después se mide todo en el visor.
 */
export default function RecorteDelCampo({
  imagen,
  texto,
  posicion,
  tierra,
  tamano,
  colorDelMarco,
  onVolar,
}: Props) {
  const mapa = useTexture(imagen, (t) => {
    t.magFilter = NearestFilter
    t.minFilter = NearestFilter
    t.generateMipmaps = false
  })

  // El plano mira a la Tierra con el norte de la eclíptica hacia arriba.
  const orientacion = useMemo(() => {
    const matriz = new Matrix4().lookAt(
      new Vector3(...tierra),
      new Vector3(...posicion),
      new Vector3(0, 1, 0),
    )
    return new Quaternion().setFromRotationMatrix(matriz)
  }, [posicion, tierra])

  return (
    <group position={posicion as [number, number, number]} quaternion={orientacion}>
      <mesh>
        <planeGeometry args={[tamano, tamano]} />
        <meshBasicMaterial map={mapa} toneMapped={false} />
      </mesh>
      {/* Marco: un plano apenas más grande, detrás de la imagen. */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[tamano * 1.04, tamano * 1.04]} />
        <meshBasicMaterial color={colorDelMarco} />
      </mesh>
      <Html position={[0, -tamano * 0.62, 0]} center zIndexRange={[20, 0]}>
        <button type="button" className="escena__rotulo escena__rotulo--campo" onClick={onVolar}>
          {texto}
        </button>
      </Html>
    </group>
  )
}
