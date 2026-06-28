import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-500 hover:text-white'
    }`

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tight">TodoApp</span>
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
              <NavLink to="/todos" className={linkClass}>Mes Tâches</NavLink>
              <NavLink to="/stats" className={linkClass}>Statistiques</NavLink>
              <NavLink to="/notifications" className={linkClass}>Notifications</NavLink>
            </div>
          </div>

          {/* User section */}
          <div className="flex items-center gap-4">
            <NavLink to="/profile" className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.name || 'Utilisateur'}</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
