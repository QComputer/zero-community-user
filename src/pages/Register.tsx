import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { authAPI, invitationAPI, User } from '../services/api';
import { logUserAction } from '../services/logger';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '../components/ui/badge';

interface RegisterProps {
  onLogin: (userData: User, token: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'customer',
    invitationToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (token) {
      setFormData(prev => ({ ...prev, invitationToken: token }));
      loadInvitationDetails(token);
    }

    if (type && !token) {
      // If type is provided without token, set it directly
      setFormData(prev => ({ ...prev, role: type }));
    }
  }, [searchParams]);

  const loadInvitationDetails = async (token: string) => {
    try {
      const invitation: any = await invitationAPI.getInvitation(token);
      setInvitationData(invitation);

      // Pre-fill the role from invitation
      setFormData(prev => ({
        ...prev,
        role: invitation.type
      }));

      toast.info(t('auth.registerJoiningAs', { type: invitation.type, store: invitation.store.name }));
    } catch (error: any) {
      toast.error(t('errors.invalidInvitation'));
      navigate('/register');
    }
  };

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
      const registrationData = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        ...(formData.invitationToken && { invitationToken: formData.invitationToken })
      };

      const responseData: any = await authAPI.registerWithInvitation(registrationData);

      logUserAction('register', {
        username: formData.username,
        role: formData.role,
        invitationToken: formData.invitationToken
      });
      
      const { token, ...user } = responseData.data;
      onLogin(user, token);

      const successMessage = invitationData
        ? t('auth.registerJoiningAs', { type: invitationData.type, store: invitationData.store.name })
        : t('auth.registrationSuccess');

      toast.success(successMessage);
      navigate('/dashboard');
    } catch (error: any) {
      logUserAction('register_failed', {
        username: formData.username,
        role: formData.role,
        invitationToken: formData.invitationToken,
        error: error.message
      });
      const errorMessage = error.message || t('errors.registrationFailed');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4 fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('auth.registerCreateAccount')}</h1>
          <p className="text-muted-foreground text-lg">
            {invitationData
              ? t('auth.registerJoiningAs', { type: invitationData.type, store: invitationData.store.name })
              : t('auth.registerSignUpNewAccount')
            }
          </p>
          {invitationData && (
            <Badge variant="secondary" className="mt-2">
              {t('auth.registerInvitedBy', { store: invitationData.store.name })}
            </Badge>
          )}
        </div>

        <Card className="card-modern p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <CardContent>

              <div className="space-y-3">
                <label htmlFor="username" className="text-sm font-semibold text-card-foreground block">
                  {t('auth.registerUsername')}
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input-modern w-full focus-modern"
                  placeholder={t('auth.registerEnterUsername')}
                />
              </div>

              <div className="space-y-3 py-5">

                <label htmlFor="password" className="text-sm font-semibold text-card-foreground block">
                  {t('auth.registerPassword')}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-modern w-full focus-modern"
                  placeholder={t('auth.registerEnterPassword')}
                />
              </div>

              {!invitationData && (
                <div className="space-y-3">
                  <label htmlFor="role" className="text-sm font-semibold text-card-foreground block">
                    {t('auth.registerRole')}
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input-modern w-full focus-modern"
                  >
                    <option value="customer">{t('common.customer')}</option>
                    <option value="driver">{t('common.driver')}</option>
                    <option value="store">{t('common.store')}</option>
                  </select>
                </div>
              )}

              {invitationData && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-card-foreground block">
                    {t('auth.registerRole')}
                  </label>
                  <div className="input-modern w-full bg-muted/50 text-muted-foreground cursor-not-allowed">
                    {formData.role === 'staff' ? t('common.staff') : t('common.customer')} (Pre-selected from invitation)
                  </div>
                </div>
              )}

            </CardContent>


            <CardFooter>

              <Button
                variant="outline"
                type="submit"
                className="w-full btn-modern h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? t('auth.registerCreatingAccount') : t('auth.registerCreateAccountButton')}
              </Button>
            </CardFooter>

          </form>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.registerAlreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
              >
                {t('auth.registerSignIn')}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;