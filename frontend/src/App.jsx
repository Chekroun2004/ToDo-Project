import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import AuroraBackground from './components/AuroraBackground'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Todos from './pages/Todos'
import TodoDetail from './pages/TodoDetail'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'

function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-[#0d0d1a]">
      <AuroraBackground />
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/todos" element={<ProtectedRoute><Layout><Todos /></Layout></ProtectedRoute>} />
          <Route path="/todos/:id" element={<ProtectedRoute><Layout><TodoDetail /></Layout></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Layout><Stats /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
