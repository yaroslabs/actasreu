import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.email, form.password)
      }
      navigate('/dashboard')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Credenciales incorrectas'
        : err.code === 'auth/email-already-in-use'
        ? 'El correo ya está registrado'
        : err.message || 'Error de autenticación'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Error con Google Sign-In')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-5/12 bg-slate-900 flex-col justify-between p-12 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <FileText size={17} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Mis Actas de Reunión</span>
        </div>

        <div>
          <p className="text-2xl font-light text-white leading-relaxed mb-8">
            "Transforma tus notas de reunión en actas profesionales en menos de 2 minutos."
          </p>
          <div className="space-y-3">
            {[
              'Gestión de proyectos y reuniones',
              'Generación de actas con inteligencia artificial',
              'Seguimiento de acuerdos y compromisos',
              'Exportación a PDF corporativo',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-slate-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Mis Actas de Reunión</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <FileText size={17} className="text-white" />
            </div>
            <span className="font-semibold text-slate-900">Mis Actas de Reunión</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear una cuenta'}
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {mode === 'login' ? 'Ingresa tus credenciales para continuar' : 'Regístrate para comenzar'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="correo@empresa.com"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <Button type="submit" className="w-full justify-center" size="lg" loading={loading}>
              {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-50 text-xs text-slate-400">o continúa con</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium
              text-slate-700 bg-white border border-slate-200 rounded-lg
              hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
            <button
              className="text-indigo-600 font-medium hover:underline"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Regístrate' : 'Ingresa'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
