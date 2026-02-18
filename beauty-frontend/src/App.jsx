import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { MastersPage } from './pages/MastersPage'
import { MasterDetailsPage } from './pages/MasterDetailsPage'

export function App() {
  return (
    <div className="app-shell">
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="brand">Beauty Sarafan</Link>
          <nav className="nav">
            <Link to="/masters">Каталог мастеров</Link>
          </nav>
        </div>
      </header>

      <main className="container page-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/masters" element={<MastersPage />} />
          <Route path="/masters/:id" element={<MasterDetailsPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">© {new Date().getFullYear()} Beauty Sarafan</div>
      </footer>
    </div>
  )
}
