import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import AuthService from '../../services/AuthService';
import '../../styles/Login.css';

const Login = () => {
  const [singleCode, setSingleCode] = useState(
    import.meta.env.VITE_BACKOFFICE_CODE
      || import.meta.env.VITE_SINGLE_AUTH_CODE
      || 'glpi123'
  );
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await AuthService.login(singleCode);
      
      if (user) {
        toast.success(`Bienvenue ${user.realname || user.name} !`);
        console.log('Login successful, navigating...');
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.message || 'Code unique incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            GLPI
          </div>
          <h1>Bienvenue</h1>
          <p>Connectez-vous à votre interface GLPI</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-group">
            <label htmlFor="singleCode">Code unique</label>
            <div className="login-input-wrapper">
              <Lock className="login-icon" size={20} />
              <input
                type="text"
                id="singleCode"
                placeholder="Entrez votre code unique"
                value={singleCode}
                onChange={(e) => setSingleCode(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? (
              'Connexion en cours...'
            ) : (
              <>
                <LogIn size={20} />
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 GLPI React App</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
