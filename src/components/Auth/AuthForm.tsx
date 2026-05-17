import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login({ username, password });
      } else {
        await register({ username, email, password });
        sessionStorage.setItem('isNewUser', 'true');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-green-400 mb-2 neon-text">
            Dark.Chat
          </h1>
          <p className="text-gray-400">Secure messaging in the dark</p>
        </div>

        <div className="bg-gray-900 border border-green-500/30 rounded-lg p-8 shadow-xl neon-border">
          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                isLogin
                  ? 'bg-green-500 text-gray-900 font-semibold'
                  : 'text-gray-400 hover:text-green-400'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                !isLogin
                  ? 'bg-green-500 text-gray-900 font-semibold'
                  : 'text-gray-400 hover:text-green-400'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-400">
                    Я согласен на{' '}
                    <a
                      href="https://vsp210.ru/consent_personal_data"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:underline"
                    >
                      обработку персональных данных
                    </a>
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (!isLogin && !agreedToTerms)}
              className="w-full bg-green-500 hover:bg-green-600 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed neon-button"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLogin ? 'Login' : 'Register'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
