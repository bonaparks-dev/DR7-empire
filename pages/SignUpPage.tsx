import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';

const PasswordStrengthMeter: React.FC<{ password?: string }> = ({ password = '' }) => {
    const { t } = useTranslation();
    const getStrength = () => {
        let score = 0;
        if (password.length > 7) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;
        return score;
    };

    const strength = getStrength();
    const strengthText = [t('Password_is_too_weak'), t('Password_Strength_Weak'), t('Password_Strength_Medium'), t('Password_Strength_Good'), t('Password_Strength_Strong')];
    const strengthColor = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return (
        <div className="flex items-center mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2 mr-3">
                <div className={`h-2 rounded-full ${strengthColor[strength]}`} style={{ width: `${(strength / 5) * 100}%` }}></div>
            </div>
            <span className="text-xs text-gray-400">{strengthText[strength]}</span>
        </div>
    );
};

const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  const [tipoCliente, setTipoCliente] = useState<'azienda' | 'persona_fisica' | 'pubblica_amministrazione' | ''>('');
  const [formData, setFormData] = useState({
    // Common fields
    nazione: 'Italia',
    codiceFiscale: '',
    indirizzo: '',
    // Azienda fields
    denominazione: '',
    partitaIVA: '',
    // Persona Fisica fields
    nome: '',
    cognome: '',
    telefono: '',
    email: '',
    pec: '',
    // Pubblica Amministrazione fields
    codiceUnivoco: '',
    enteUfficio: '',
    citta: '',
    // Authentication fields
    password: '',
    confirmPassword: ''
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'business' ? '/partner/dashboard' : '/account');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validate based on client type
    if (!tipoCliente) {
      newErrors.tipoCliente = 'Seleziona un tipo di cliente';
    } else {
      // Common validations
      if (!formData.nazione) newErrors.nazione = 'Nazione è obbligatorio';
      if (!formData.codiceFiscale) newErrors.codiceFiscale = 'Codice Fiscale è obbligatorio';
      if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo è obbligatorio';

      // Azienda specific
      if (tipoCliente === 'azienda') {
        if (!formData.denominazione) newErrors.denominazione = 'Denominazione è obbligatorio';
        if (!formData.partitaIVA) newErrors.partitaIVA = 'Partita IVA è obbligatorio';
        if (!formData.email) newErrors.email = 'Email è obbligatorio';
      }

      // Persona Fisica specific
      if (tipoCliente === 'persona_fisica') {
        if (!formData.nome) newErrors.nome = 'Nome è obbligatorio';
        if (!formData.cognome) newErrors.cognome = 'Cognome è obbligatorio';
        if (!formData.email) newErrors.email = 'Email è obbligatorio';
      }

      // Pubblica Amministrazione specific
      if (tipoCliente === 'pubblica_amministrazione') {
        if (!formData.codiceUnivoco) newErrors.codiceUnivoco = 'Codice Univoco è obbligatorio';
        if (!formData.enteUfficio) newErrors.enteUfficio = 'Ente o Ufficio è obbligatorio';
        if (!formData.citta) newErrors.citta = 'Città è obbligatorio';
        if (!formData.email) newErrors.email = 'Email è obbligatorio';
      }
    }

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('Please_enter_a_valid_email_address');
    }

    // Password validation
    if (!formData.password) newErrors.password = t('Password_is_required');
    else if (formData.password.length < 8) newErrors.password = t('Password_is_too_weak');
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('Passwords_do_not_match');
    }

    // Terms validation
    if (!agreedToTerms) newErrors.terms = t('You_must_agree_to_the_terms');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await signup(
        formData.email,
        formData.password,
        {}
      );

      if (authError) throw authError;

      // Step 2: Save customer data to customers_extended
      const customerData: any = {
        tipo_cliente: tipoCliente,
        nazione: formData.nazione,
        codice_fiscale: formData.codiceFiscale,
        indirizzo: formData.indirizzo,
        source: 'website',
        user_id: authData?.user?.id || null
      };

      // Add type-specific fields
      if (tipoCliente === 'azienda') {
        customerData.denominazione = formData.denominazione;
        customerData.partita_iva = formData.partitaIVA;
        customerData.email = formData.email;
      } else if (tipoCliente === 'persona_fisica') {
        customerData.nome = formData.nome;
        customerData.cognome = formData.cognome;
        customerData.telefono = formData.telefono;
        customerData.email = formData.email;
        customerData.pec = formData.pec;
      } else if (tipoCliente === 'pubblica_amministrazione') {
        customerData.codice_univoco = formData.codiceUnivoco;
        customerData.ente_ufficio = formData.enteUfficio;
        customerData.citta = formData.citta;
        customerData.email = formData.email;
      }

      const { error: customerError } = await supabase
        .from('customers_extended')
        .insert([customerData]);

      if (customerError) {
        console.error('Error saving customer data:', customerError);
        // Don't throw - user is created, just log the error
      }

      navigate('/check-email');
    } catch (err: any) {
      setGeneralError(err.message || t('Something_went_wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8 space-y-6"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">{t('Create_Your_Account')}</h2>
              <p className="mt-2 text-sm text-gray-400">Registrazione Cliente - DR7 Empire</p>
            </div>

            {generalError && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3">
                {generalError}
              </p>
            )}

            <form className="space-y-6" onSubmit={handleSignUp} noValidate>
              {/* Client Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipoCliente"
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-yellow-500"
                  required
                >
                  <option value="">Seleziona tipo cliente...</option>
                  <option value="azienda">Azienda</option>
                  <option value="persona_fisica">Persona Fisica</option>
                  <option value="pubblica_amministrazione">Pubblica Amministrazione</option>
                </select>
                {errors.tipoCliente && <p className="text-xs text-red-400 mt-1">{errors.tipoCliente}</p>}
              </div>

              {/* AZIENDA FIELDS */}
              {tipoCliente === 'azienda' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-t border-gray-700 pt-4"></div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nazione <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nazione"
                      value={formData.nazione}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.nazione && <p className="text-xs text-red-400 mt-1">{errors.nazione}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Denominazione <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="denominazione"
                      value={formData.denominazione}
                      onChange={handleChange}
                      placeholder="Nome azienda"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.denominazione && <p className="text-xs text-red-400 mt-1">{errors.denominazione}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Partita IVA <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="partitaIVA"
                      value={formData.partitaIVA}
                      onChange={handleChange}
                      placeholder="IT12345678901"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.partitaIVA && <p className="text-xs text-red-400 mt-1">{errors.partitaIVA}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Codice Fiscale <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={handleChange}
                      placeholder="00000000000"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.codiceFiscale && <p className="text-xs text-red-400 mt-1">{errors.codiceFiscale}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Indirizzo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="indirizzo"
                      value={formData.indirizzo}
                      onChange={handleChange}
                      placeholder="Via, Numero Civico, CAP, Città"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.indirizzo && <p className="text-xs text-red-400 mt-1">{errors.indirizzo}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@azienda.it"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                  </div>
                </div>
              )}

              {/* PERSONA FISICA FIELDS */}
              {tipoCliente === 'persona_fisica' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-t border-gray-700 pt-4"></div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nazione <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nazione"
                      value={formData.nazione}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.nazione && <p className="text-xs text-red-400 mt-1">{errors.nazione}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Mario"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.nome && <p className="text-xs text-red-400 mt-1">{errors.nome}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cognome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="cognome"
                      value={formData.cognome}
                      onChange={handleChange}
                      placeholder="Rossi"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.cognome && <p className="text-xs text-red-400 mt-1">{errors.cognome}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Codice Fiscale <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={handleChange}
                      placeholder="RSSMRA80A01H501U"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.codiceFiscale && <p className="text-xs text-red-400 mt-1">{errors.codiceFiscale}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Indirizzo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="indirizzo"
                      value={formData.indirizzo}
                      onChange={handleChange}
                      placeholder="Via, Numero Civico, CAP, Città"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.indirizzo && <p className="text-xs text-red-400 mt-1">{errors.indirizzo}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@esempio.it"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-semibold text-yellow-500">Campi Facoltativi</h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Telefono</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+39 123 456 7890"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">PEC</label>
                      <input
                        type="email"
                        name="pec"
                        value={formData.pec}
                        onChange={handleChange}
                        placeholder="pec@pec.it"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PUBBLICA AMMINISTRAZIONE FIELDS */}
              {tipoCliente === 'pubblica_amministrazione' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-t border-gray-700 pt-4"></div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Codice Univoco <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="codiceUnivoco"
                      value={formData.codiceUnivoco}
                      onChange={handleChange}
                      placeholder="XXXXXX"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.codiceUnivoco && <p className="text-xs text-red-400 mt-1">{errors.codiceUnivoco}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Codice Fiscale <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={handleChange}
                      placeholder="00000000000"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.codiceFiscale && <p className="text-xs text-red-400 mt-1">{errors.codiceFiscale}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ente o Ufficio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="enteUfficio"
                      value={formData.enteUfficio}
                      onChange={handleChange}
                      placeholder="Nome dell'ente o ufficio"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.enteUfficio && <p className="text-xs text-red-400 mt-1">{errors.enteUfficio}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Città <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="citta"
                      value={formData.citta}
                      onChange={handleChange}
                      placeholder="Cagliari"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.citta && <p className="text-xs text-red-400 mt-1">{errors.citta}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Indirizzo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="indirizzo"
                      value={formData.indirizzo}
                      onChange={handleChange}
                      placeholder="Via, Numero Civico, CAP, Città"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.indirizzo && <p className="text-xs text-red-400 mt-1">{errors.indirizzo}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@ente.it"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                  </div>
                </div>
              )}

              {/* PASSWORD FIELDS (shown after client type is selected) */}
              {tipoCliente && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-t border-gray-700 pt-4"></div>
                  <h3 className="text-lg font-semibold text-white">Crea le tue credenziali</h3>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('Password')}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
                      style={{ top: '32px' }}
                    >
                      {showPassword ?  : }
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-red-400">{errors.password}</p>
                  ) : (
                    <PasswordStrengthMeter password={formData.password} />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Conferma Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('Confirm_Password')}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex items-center">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                      {t('I_agree_to_the')}{' '}
                      <Link to="/terms" className="font-medium text-white hover:underline">
                        {t('Terms_and_Privacy_Policy')}
                      </Link>
                    </label>
                  </div>
                  {errors.terms && <p className="text-xs text-red-400">{errors.terms}</p>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
                  >
                    {isSubmitting ? t('Please_wait') : t('Create_Account')}
                  </button>
                </div>
              )}
            </form>

            <div className="text-sm text-center">
              <p className="text-gray-400">
                {t('Already_have_an_account')}{' '}
                <Link to="/signin" className="font-medium text-white hover:text-gray-300">
                  {t('Sign_In')}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </motion.div>
  );
};

export default SignUpPage;
