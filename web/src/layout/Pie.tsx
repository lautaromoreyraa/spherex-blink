import { reconocimientos } from './reconocimientos.ts'

// Pie común a todas las páginas: los reconocimientos de datos tienen que
// verse en cualquier vista, no sólo en la de inicio (RNF-10). Los textos de
// cada fuente van en inglés y textuales; sólo el título sigue al idioma.
export default function Pie({ titulo = 'Reconocimientos' }: { titulo?: string }) {
  return (
    <footer className="pie">
      <h2 className="pie__titulo">{titulo}</h2>
      <ul className="pie__lista">
        {reconocimientos.map(({ fuente, enlace, texto }) => (
          <li key={fuente} lang="en">
            <a href={enlace} rel="noopener noreferrer">
              {fuente}
            </a>
            : {texto}
          </li>
        ))}
      </ul>
    </footer>
  )
}
