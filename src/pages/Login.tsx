import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { authAPI, standardizeError, User } from '../services/api';
import { logUserAction } from '../services/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface LoginProps {
  onLogin: (userData: User, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res: any = await authAPI.login(formData.username, formData.password);

      logUserAction('login', { username: formData.username });
      onLogin(res.data.user, res.data.token);
      //localStorage.setItem('token', res.data.token);
      //localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error) {
      const standardized = standardizeError(error);
      logUserAction('login_failed', { username: formData.username, error: standardized.message });
      toast.error(standardized.message || t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);

    try {
      const res: any = await authAPI.guestLogin();

      logUserAction('guest_login', { username: res.data.user.username });
      onLogin(res.data.user, res.data.token);
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error) {
      const standardized = standardizeError(error);
      logUserAction('guest_login_failed', { error: standardized.message });
      toast.error(standardized.message || t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4 fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('auth.loginWelcomeBack')}</h1>
          <p className="text-muted-foreground text-lg">{t('auth.loginSignInToAccount')}</p>
        </div>

        <Card className="card-modern p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <CardContent>

              <div className="space-y-3">
                <label htmlFor="username" className="text-sm font-semibold text-card-foreground block">
                  {t('auth.loginUsername')}
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input-modern w-full focus-modern"
                  placeholder={t('auth.loginEnterUsername')}
                />
              </div>

              <div className="space-y-3 py-5">

                <label htmlFor="password" className="text-sm font-semibold text-card-foreground block">
                  {t('auth.loginPassword')}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-modern w-full focus-modern"
                  placeholder={t('auth.loginEnterPassword')}
                />
              </div>

            </CardContent>


            <CardFooter>

              <Button
                variant="outline"
                type="submit"
                className="w-full btn-modern h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? t('auth.loginLoggingIn') : t('auth.loginSignIn')}
              </Button>
            </CardFooter>

          </form>
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              type="button"
              onClick={handleGuestLogin}
              className="w-full h-12 text-base font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? t('auth.loginProcessing') : t('auth.loginContinueAsGuest')}
            </Button>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.loginDontHaveAccount')}{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
              >
                {t('auth.loginCreateAccount')}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;