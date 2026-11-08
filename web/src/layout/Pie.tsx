import { reconocimientos } from './reconocimientos.ts'

// Pie común a todas las páginas: los reconocimientos de datos tienen que
// verse en cualquier vista, no sólo en la de inicio (RNF-10).
export default function Pie() {
  return (
    <footer className="pie">
      <h2 className="pie__titulo">Reconocimientos</h2>
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
