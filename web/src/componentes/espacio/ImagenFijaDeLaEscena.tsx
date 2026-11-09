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
  const prefijo = base.endsWith('/') ? base : `${base}/`
  return (
    <figure className="escena__fija">
      <img
        src={`${prefijo}escena/escena-fija.jpg`}
        width={1204}
        height={771}
        alt="Captura de la escena del campo de Makemake: el Sol, las órbitas de los planetas y la órbita inclinada de Makemake, con la línea de visión desde la Tierra hacia el campo."
      />
      <figcaption>
        Este navegador no puede dibujar en 3D (WebGL), así que se muestra una imagen fija de la
        escena del campo de Makemake
        {esMakemake ? '' : ', no la de este campo'}. El texto y el paso al visor funcionan igual.
      </figcaption>
    </figure>
  )
}
