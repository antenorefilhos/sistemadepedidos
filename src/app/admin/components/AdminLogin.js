'use client';

// Extraído de page.js: tela de senha de acesso ao painel.
export default function AdminLogin({ password, onPasswordChange, onSubmit }) {
  return (
    <div className="w-full flex-1 min-h-[calc(100vh-3rem)] flex items-center justify-center p-4 bg-base-200 animate-[fadeIn_0.3s_ease]">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-primary/20">
        <form onSubmit={onSubmit} className="card-body">
          <h2 className="card-title justify-center text-primary font-serif font-bold mb-4 text-lg">Painel Gerencial</h2>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Senha de Acesso</span>
            </label>
            <input
              type="password"
              placeholder="Digite sua senha de acesso"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
            />
          </div>
          <div className="card-actions justify-end mt-4">
            <button type="submit" className="btn btn-primary btn-block">
              Acessar Painel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
