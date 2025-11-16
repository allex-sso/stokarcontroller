
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@alumasa.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@alumasa.com' && password === 'admin') {
      setError('');
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-alumasa-deep-blue text-white p-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold">Alumasa</h1>
          <p className="text-lg text-gray-300 mt-2">Controle do Almoxarifado</p>
        </div>
        
        <div className="max-w-sm w-full bg-white rounded-lg shadow-xl p-8 text-gray-800">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Login</h2>
          <form onSubmit={handleSubmit}>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm font-medium mb-2" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600 text-sm font-medium mb-2" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  aria-label="Toggle password visibility"
                >
                  <EyeIcon />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center text-sm text-gray-600">
                <input className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" type="checkbox" defaultChecked/>
                <span className="ml-2">Lembrar-me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="inline-block align-baseline font-medium text-sm text-blue-600 hover:text-blue-800"
              >
                Esqueci minha senha?
              </button>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300"
              type="submit"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>

      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-800">Recuperação de Senha</h3>
                <p className="text-gray-600 my-4">Para redefinir sua senha, entre em contato com o administrador do sistema.</p>
                <div className="flex justify-end">
                    <button onClick={() => setShowForgotPasswordModal(false)} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Fechar</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Login;
