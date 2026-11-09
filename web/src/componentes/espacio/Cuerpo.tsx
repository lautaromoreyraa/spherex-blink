import { Html, useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { DoubleSide, RingGeometry, Vector3 } from 'three'
import { rutaDeTextura } from './cuerpos.ts'
import type { CuerpoEnEscena } from './modelo.ts'

interface Props {
  cuerpo: CuerpoEnEscena
  /** Nombre ya traducido: lo que muestra el rótulo y lee el lector de pantalla. */
  rotulo: string
  elegido: boolean
  onElegir: (cuerpo: CuerpoEnEscena) => void
  colorLiso: string
}

/**
 * Un cuerpo con su rótulo. El rótulo es un botón de verdad en el DOM (con
 * `Html` de drei), así que se alcanza con Tab, tiene nombre accesible y el
 * lector de pantalla lo anuncia, cosa que una malla del lienzo no puede
 * hacer (RF-34, RNF-03).
 */
export default function Cuerpo({ cuerpo, rotulo, elegido, onElegir, colorLiso }: Props) {
  return (
    <group position={cuerpo.posicion as [number, number, number]}>
      {cuerpo.textura ? (
        <EsferaConTextura cuerpo={cuerpo} textura={cuerpo.textura} />
      ) : (
        <mesh>
          <sphereGeometry args={[cuerpo.radio, 32, 16]} />
          <meshStandardMaterial color={colorLiso} />
        </mesh>
      )}
      <Html position={[0, cuerpo.radio * 1.15, 0]} center zIndexRange={[20, 0]}>
        <button
          type="button"
          className="escena__rotulo"
          aria-pressed={elegido}
          onClick={() => onElegir(cuerpo)}
        >
          {rotulo}
        </button>
      </Html>
    </group>
  )
}

function EsferaConTextura({ cuerpo, textura }: { cuerpo: CuerpoEnEscena; textura: string }) {
  const mapa = useTexture(rutaDeTextura(textura))
  return (
    <>
      <mesh>
        <sphereGeometry args={[cuerpo.radio, 48, 24]} />
        {cuerpo.emite ? (
          <meshBasicMaterial map={mapa} toneMapped={false} />
        ) : (
          <meshStandardMaterial map={mapa} roughness={1} metalness={0} />
        )}
      </mesh>
      {cuerpo.anillos && <Anillos radio={cuerpo.radio} />}
    </>
  )
}

/** Inclinación del eje de Saturno respecto de su órbita, en radianes. */
const INCLINACION_DE_SATURNO = (26.73 * Math.PI) / 180

function Anillos({ radio }: { radio: number }) {
  const mapa = useTexture(rutaDeTextura('anillos-de-saturno'))
  const geometria = useMemo(() => {
    const interior = radio * 1.24
    const exterior = radio * 2.27
    const anillo = new RingGeometry(interior, exterior, 96, 1)
    // La textura es una tira radial: u va del borde interior al exterior.
    const posiciones = anillo.attributes.position!
    const uv = anillo.attributes.uv!
    const punto = new Vector3()
    for (let i = 0; i < posiciones.count; i++) {
      punto.fromBufferAttribute(posiciones, i)
      uv.setXY(i, (punto.length() - interior) / (exterior - interior), 0.5)
    }
    return anillo
  }, [radio])

  return (
    <mesh geometry={geometria} rotation={[-Math.PI / 2 + INCLINACION_DE_SATURNO, 0, 0]}>
      <meshStandardMaterial map={mapa} transparent side={DoubleSide} depthWrite={false} />
    </mesh>
  )
}
