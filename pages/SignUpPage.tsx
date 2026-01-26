import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import DocumentUploadModal from '../components/ui/DocumentUploadModal';
import MarketingConsentModal from '../components/ui/MarketingConsentModal';
import { countries } from '../utils/countries';
import { AppleStyleSelect } from '../components/ui/AppleStyleSelect';

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

  const [tipoCliente, setTipoCliente] = useState<'azienda' | 'persona_fisica' | 'pubblica_amministrazione' | ''>('persona_fisica');
  const [formData, setFormData] = useState({
    // Common fields
    nazione: 'Italia',
    codiceFiscale: '',
    indirizzo: '',
    // Azienda fields
    denominazione: '',
    partitaIVA: '',
    sedeOperativa: '',
    codiceSDI: '',
    rappresentanteNome: '',
    rappresentanteCognome: '',
    rappresentanteCF: '',
    rappresentanteRuolo: '',
    documentoTipo: '',
    documentoNumero: '',
    documentoDataRilascio: '',
    documentoLuogoRilascio: '',
    // Persona Fisica fields
    nome: '',
    cognome: '',
    telefono: '',
    email: '',
    pec: '',
    sesso: '',
    dataNascita: '',
    cittaNascita: '',
    provinciaNascita: '',
    luogoNascita: '', // keeping for backward compat if needed, but cittaNascita is preferred
    numeroCivico: '',
    codicePostale: '',
    cittaResidenza: '',
    provinciaResidenza: '',

    residencyZone: 'NON_RESIDENTE', // Required residency zone field
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
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'business' ? '/partner/dashboard' : '/account');
    }
  }, [user, navigate]);

  const validateCodiceFiscale = (cf: string): boolean => {
    const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    return cf.length === 16 && cfRegex.test(cf.toUpperCase());
  };

  const validateItalianPhone = (phone: string): boolean => {
    const phoneRegex = /^(\+39|0039)?[\s]?[0-9]{9,13}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validatePartitaIVA = (piva: string): boolean => {
    const pivaRegex = /^[0-9]{11}$/;
    return pivaRegex.test(piva);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    // Auto-uppercase for specific fields
    if (name === 'codiceFiscale' || name === 'provinciaResidenza') {
      newValue = value.toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validate based on client type
    if (!tipoCliente) {
      newErrors.tipoCliente = 'Seleziona un tipo di cliente';
    } else {
      // Common validations
      if (!formData.nazione) newErrors.nazione = 'Nazione è obbligatorio';
      if (!formData.email) {
        newErrors.email = 'Email è obbligatorio';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t('Please_enter_a_valid_email_address');
      }

      // Azienda specific
      if (tipoCliente === 'azienda') {
        if (!formData.denominazione) newErrors.denominazione = 'Denominazione è obbligatorio';
        if (!formData.partitaIVA) {
          newErrors.partitaIVA = 'Partita IVA è obbligatorio';
        } else if (!validatePartitaIVA(formData.partitaIVA)) {
          newErrors.partitaIVA = 'Partita IVA non valida (11 cifre)';
        }
        if (!formData.codiceFiscale) newErrors.codiceFiscale = 'Codice Fiscale è obbligatorio';
        if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo è obbligatorio';
        if (!formData.telefono) {
          newErrors.telefono = 'Telefono è obbligatorio';
        } else if (!validateItalianPhone(formData.telefono)) {
          newErrors.telefono = 'Formato telefono non valido';
        }

        // Legal Representative Validations
        if (!formData.rappresentanteNome) newErrors.rappresentanteNome = 'Nome rappresentante è obbligatorio';
        if (!formData.rappresentanteCognome) newErrors.rappresentanteCognome = 'Cognome rappresentante è obbligatorio';
        if (!formData.rappresentanteCF) newErrors.rappresentanteCF = 'CF rappresentante è obbligatorio';
        if (!formData.rappresentanteRuolo) newErrors.rappresentanteRuolo = 'Ruolo rappresentante è obbligatorio';

        // Document Validations
        if (!formData.documentoTipo) newErrors.documentoTipo = 'Tipo documento è obbligatorio';
        if (!formData.documentoNumero) newErrors.documentoNumero = 'Numero documento è obbligatorio';
        if (!formData.documentoDataRilascio) newErrors.documentoDataRilascio = 'Data rilascio documento è obbligatoria';
        if (!formData.documentoLuogoRilascio) newErrors.documentoLuogoRilascio = 'Luogo rilascio documento è obbligatorio';
      }

      // Persona Fisica specific
      if (tipoCliente === 'persona_fisica') {
        if (!formData.nome) newErrors.nome = 'Nome è obbligatorio';
        if (!formData.cognome) newErrors.cognome = 'Cognome è obbligatorio';

        // Codice Fiscale is only required for Italian nationals
        if (formData.nazione === 'Italia') {
          if (!formData.codiceFiscale) {
            newErrors.codiceFiscale = 'Codice Fiscale è obbligatorio';
          } else if (!validateCodiceFiscale(formData.codiceFiscale)) {
            newErrors.codiceFiscale = 'Codice Fiscale non valido (16 caratteri)';
          }
        }

        if (!formData.telefono) {
          newErrors.telefono = 'Telefono è obbligatorio';
        } else if (!validateItalianPhone(formData.telefono)) {
          newErrors.telefono = 'Formato telefono non valido';
        }
        if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo è obbligatorio';
        if (!formData.numeroCivico) newErrors.numeroCivico = 'Numero Civico è obbligatorio';
        if (!formData.cittaResidenza) newErrors.cittaResidenza = 'Città è obbligatoria';
        if (!formData.codicePostale) newErrors.codicePostale = 'CAP è obbligatorio';
        if (!formData.provinciaResidenza) newErrors.provinciaResidenza = 'Provincia è obbligatoria';

        if (!formData.sesso) newErrors.sesso = 'Sesso è obbligatorio';
        if (!formData.dataNascita) newErrors.dataNascita = 'Data di nascita è obbligatoria';
        if (!formData.cittaNascita) newErrors.cittaNascita = 'Città di nascita è obbligatoria';
        if (!formData.provinciaNascita) newErrors.provinciaNascita = 'Provincia di nascita è obbligatoria';

        // Residency Zone Validation
        if (!formData.residencyZone) newErrors.residencyZone = 'Zona di residenza è obbligatoria';

        // License Validations removed
      }

      // Pubblica Amministrazione specific
      if (tipoCliente === 'pubblica_amministrazione') {
        if (!formData.codiceUnivoco) newErrors.codiceUnivoco = 'Codice Univoco è obbligatorio';
        if (!formData.enteUfficio) newErrors.enteUfficio = 'Ente o Ufficio è obbligatorio';
        if (!formData.citta) newErrors.citta = 'Città è obbligatorio';
        if (!formData.codiceFiscale) newErrors.codiceFiscale = 'Codice Fiscale è obbligatorio';
        if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo è obbligatorio';
      }
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
    console.log('🔍 VALIDATION ERRORS:', newErrors);
    console.log('🔍 FORM DATA:', {
      residencyZone: formData.residencyZone,
      provinciaResidenza: formData.provinciaResidenza,
      nazione: formData.nazione
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Prepare customer data payload
      const customerData: any = {
        tipo_cliente: tipoCliente,
        nazione: formData.nazione,
        codice_fiscale: formData.codiceFiscale,
        indirizzo: formData.indirizzo,
        source: 'website'
      };

      // Add type-specific fields
      if (tipoCliente === 'azienda') {
        customerData.denominazione = formData.denominazione;
        customerData.partita_iva = formData.partitaIVA;
        customerData.email = formData.email;
        customerData.telefono = formData.telefono;
        if (formData.sedeOperativa) customerData.sede_operativa = formData.sedeOperativa;
        if (formData.codiceSDI) customerData.codice_destinatario = formData.codiceSDI;

        // Legal Rep & Doc Metadata
        customerData.rappresentante_nome = formData.rappresentanteNome;
        customerData.rappresentante_cognome = formData.rappresentanteCognome;
        customerData.rappresentante_cf = formData.rappresentanteCF;
        customerData.rappresentante_ruolo = formData.rappresentanteRuolo;

        customerData.metadata = {
          documento_tipo: formData.documentoTipo,
          documento_numero: formData.documentoNumero,
          documento_data_rilascio: formData.documentoDataRilascio,
          documento_luogo_rilascio: formData.documentoLuogoRilascio
        };

      } else if (tipoCliente === 'persona_fisica') {
        customerData.nome = formData.nome;
        customerData.cognome = formData.cognome;
        customerData.telefono = formData.telefono;
        customerData.email = formData.email;
        if (formData.pec) customerData.pec = formData.pec;

        customerData.sesso = formData.sesso;
        customerData.data_nascita = formData.dataNascita;
        customerData.citta_nascita = formData.cittaNascita;
        if (formData.provinciaNascita) customerData.provincia_nascita = formData.provinciaNascita;

        if (formData.numeroCivico) customerData.numero_civico = formData.numeroCivico;
        customerData.codice_postale = formData.codicePostale;
        customerData.citta_residenza = formData.cittaResidenza;
        customerData.provincia_residenza = formData.provinciaResidenza;

        customerData.residency_zone = formData.residencyZone || 'NON_RESIDENTE';
      } else if (tipoCliente === 'pubblica_amministrazione') {
        customerData.codice_univoco = formData.codiceUnivoco;
        customerData.ente_ufficio = formData.enteUfficio;
        customerData.citta = formData.citta;
        customerData.email = formData.email;
        customerData.telefono = formData.telefono;
      }

      // Call the backend function to handle registration securely
      const response = await fetch('/.netlify/functions/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          customerData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Registration failed:', result);
        console.error('Error details:', {
          error: result.error,
          code: result.code,
          details: result.details,
          hint: result.hint,
          dbDetails: result.dbDetails
        });

        // Build a detailed error message
        let errorMessage = result.error || t('Something_went_wrong');
        if (result.code) errorMessage += ` (Code: ${result.code})`;
        if (result.hint) errorMessage += `\n${result.hint}`;
        if (result.dbDetails) errorMessage += `\nDetails: ${result.dbDetails}`;

        throw new Error(errorMessage);
      }

      // Success - now handle post-signup flow
      // Since we created the user via admin API, we might need to sign them in automatically?
      // Or just prompt to check email (if using email confirm)
      // The `signup` hook usually handles auto-login if email confirm is off.
      // But here we used backend. We should manual login?
      // Actually, let's try to sign them in immediately if we can, or just navigate.

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        // Presumably email not confirmed yet
        navigate('/check-email');
      } else if (signInData.user) {
        // Logged in successfully
        if (result.user?.id) {
          setNewUserId(result.user.id);
          setShowDocumentModal(true);
        } else {
          navigate('/account');
        }
      }

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
              <AppleStyleSelect
                label="Tipo Cliente"
                name="tipoCliente"
                value={
                  tipoCliente === 'azienda' ? 'Azienda' :
                    tipoCliente === 'persona_fisica' ? 'Persona Fisica' :
                      tipoCliente === 'pubblica_amministrazione' ? 'Pubblica Amministrazione' :
                        ''
                }
                onChange={(e) => {
                  const displayValue = e.target.value;
                  const dbValue =
                    displayValue === 'Azienda' ? 'azienda' :
                      displayValue === 'Persona Fisica' ? 'persona_fisica' :
                        displayValue === 'Pubblica Amministrazione' ? 'pubblica_amministrazione' :
                          '';
                  setTipoCliente(dbValue as any);
                }}
                options={['Azienda', 'Persona Fisica', 'Pubblica Amministrazione']}
                required
                error={errors.tipoCliente}
              />

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
                      Sede Legale <span className="text-red-500">*</span>
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
                      Sede Operativa (se diversa)
                    </label>
                    <input
                      type="text"
                      name="sedeOperativa"
                      value={formData.sedeOperativa}
                      onChange={handleChange}
                      placeholder="Via, Numero Civico, CAP, Città"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Codice SDI / Destinatario
                    </label>
                    <input
                      type="text"
                      name="codiceSDI"
                      value={formData.codiceSDI}
                      onChange={handleChange}
                      placeholder="XXXXXXX"
                      maxLength={7}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Aziendale <span className="text-red-500">*</span>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefono Aziendale <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="+39 123 456 7890"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    />
                    {errors.telefono && <p className="text-xs text-red-400 mt-1">{errors.telefono}</p>}
                  </div>

                  {/* Rappresentante Legale */}
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Rappresentante Legale</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nome <span className="text-red-500">*</span></label>
                        <input type="text" name="rappresentanteNome" value={formData.rappresentanteNome} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white" required />
                        {errors.rappresentanteNome && <p className="text-xs text-red-400 mt-1">{errors.rappresentanteNome}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cognome <span className="text-red-500">*</span></label>
                        <input type="text" name="rappresentanteCognome" value={formData.rappresentanteCognome} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white" required />
                        {errors.rappresentanteCognome && <p className="text-xs text-red-400 mt-1">{errors.rappresentanteCognome}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Codice Fiscale <span className="text-red-500">*</span></label>
                        <input type="text" name="rappresentanteCF" value={formData.rappresentanteCF} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase" maxLength={16} required />
                        {errors.rappresentanteCF && <p className="text-xs text-red-400 mt-1">{errors.rappresentanteCF}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ruolo <span className="text-red-500">*</span></label>
                        <input type="text" name="rappresentanteRuolo" value={formData.rappresentanteRuolo} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white" placeholder="Es. Amministratore" required />
                        {errors.rappresentanteRuolo && <p className="text-xs text-red-400 mt-1">{errors.rappresentanteRuolo}</p>}
                      </div>
                    </div>

                    {/* Documento Rappresentante */}
                    <h4 className="text-md font-medium text-gray-300 mt-4 mb-2">Documento di Identità</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <AppleStyleSelect
                        label="Tipo"
                        name="documentoTipo"
                        value={formData.documentoTipo}
                        onChange={handleChange}
                        options={["Carta d'Identità", "Passaporto", "Patente"]}
                        required
                        error={errors.documentoTipo}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Numero <span className="text-red-500">*</span></label>
                        <input type="text" name="documentoNumero" value={formData.documentoNumero} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white" required />
                        {errors.documentoNumero && <p className="text-xs text-red-400 mt-1">{errors.documentoNumero}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Data Rilascio <span className="text-red-500">*</span></label>
                        <input type="date" name="documentoDataRilascio" value={formData.documentoDataRilascio} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white" required />
                        {errors.documentoDataRilascio && <p className="text-xs text-red-400 mt-1">{errors.documentoDataRilascio}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Luogo Rilascio <span className="text-red-500">*</span></label>
                        <input type="text" name="documentoLuogoRilascio" value={formData.documentoLuogoRilascio} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white" required />
                        {errors.documentoLuogoRilascio && <p className="text-xs text-red-400 mt-1">{errors.documentoLuogoRilascio}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PERSONA FISICA FIELDS */}
              {tipoCliente === 'persona_fisica' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-t border-gray-700 pt-4"></div>

                  <div>
                    <AppleStyleSelect
                      label="Paese"
                      name="nazione"
                      value={formData.nazione}
                      onChange={handleChange}
                      options={countries}
                      required
                      error={errors.nazione}
                      className="text-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>


                  {formData.nazione === 'Italia' && (
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
                        maxLength={16}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase"
                        required
                      />
                      {errors.codiceFiscale && <p className="text-xs text-red-400 mt-1">{errors.codiceFiscale}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <AppleStyleSelect
                      label="Sesso"
                      name="sesso"
                      value={formData.sesso === 'M' ? 'Maschio' : formData.sesso === 'F' ? 'Femmina' : ''}
                      onChange={(e) => {
                        const displayValue = e.target.value;
                        const dbValue = displayValue === 'Maschio' ? 'M' : displayValue === 'Femmina' ? 'F' : '';
                        handleChange({ target: { name: 'sesso', value: dbValue } } as any);
                      }}
                      options={['Maschio', 'Femmina']}
                      error={errors.sesso}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data di Nascita <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dataNascita"
                        value={formData.dataNascita}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        required
                      />
                      {errors.dataNascita && <p className="text-xs text-red-400 mt-1">{errors.dataNascita}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Città di Nascita <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cittaNascita"
                        value={formData.cittaNascita}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        required
                      />
                      {errors.cittaNascita && <p className="text-xs text-red-400 mt-1">{errors.cittaNascita}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Provincia di Nascita <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="provinciaNascita"
                        value={formData.provinciaNascita}
                        onChange={handleChange}
                        maxLength={2}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase"
                        required
                      />
                      {errors.provinciaNascita && <p className="text-xs text-red-400 mt-1">{errors.provinciaNascita}</p>}
                    </div>
                  </div>

                  {/* Residency Zone Section - Only for Italia */}
                  {formData.nazione === 'Italia' && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Zona di Residenza <span className="text-red-500">*</span>
                      </label>

                      {/* Step 1: Resident or Non-Resident */}
                      <div className="space-y-2">
                        <label className="flex items-center p-3 bg-gray-800 border border-gray-700 rounded-md cursor-pointer hover:border-yellow-500 transition-colors">
                          <input
                            type="radio"
                            name="residencyType"
                            value="RESIDENTE"
                            checked={formData.residencyZone?.startsWith('RESIDENTE_')}
                            onChange={(e) => {
                              // Set both residencyZone and provinciaResidenza to CA by default
                              setFormData(prev => ({
                                ...prev,
                                residencyZone: 'RESIDENTE_CA',
                                provinciaResidenza: 'CA'
                              }));
                            }}
                            className="h-4 w-4 text-yellow-500 bg-gray-700 border-gray-600 focus:ring-yellow-500"
                          />
                          <span className="ml-3 text-white">RESIDENTE CAGLIARI–SUD SARDEGNA</span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-800 border border-gray-700 rounded-md cursor-pointer hover:border-yellow-500 transition-colors">
                          <input
                            type="radio"
                            name="residencyType"
                            value="NON_RESIDENTE"
                            checked={formData.residencyZone === 'NON_RESIDENTE'}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, residencyZone: 'NON_RESIDENTE' }));
                            }}
                            className="h-4 w-4 text-yellow-500 bg-gray-700 border-gray-600 focus:ring-yellow-500"
                          />
                          <span className="ml-3 text-white">NON RESIDENTE</span>
                        </label>
                      </div>

                      {/* Info text for residents */}
                      {formData.residencyZone?.startsWith('RESIDENTE_') && (
                        <p className="text-xs text-gray-400 mt-2">
                          {formData.residencyZone === 'RESIDENTE_SU' && 'Sud Sardegna include: Carbonia-Iglesias, Medio Campidano, Ogliastra'}
                        </p>
                      )}

                      {errors.residencyZone && <p className="text-xs text-red-400 mt-1">{errors.residencyZone}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Indirizzo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="indirizzo"
                        value={formData.indirizzo}
                        onChange={handleChange}
                        placeholder="Via Roma"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        required
                      />
                      {errors.indirizzo && <p className="text-xs text-red-400 mt-1">{errors.indirizzo}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Numero Civico <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="numeroCivico"
                        value={formData.numeroCivico}
                        onChange={handleChange}
                        placeholder="123"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        required
                      />
                      {errors.numeroCivico && <p className="text-xs text-red-400 mt-1">{errors.numeroCivico}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Città di Residenza <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cittaResidenza"
                        value={formData.cittaResidenza}
                        onChange={handleChange}
                        placeholder="Milano"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        required
                      />
                      {errors.cittaResidenza && <p className="text-xs text-red-400 mt-1">{errors.cittaResidenza}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        CAP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="codicePostale"
                        value={formData.codicePostale}
                        onChange={handleChange}
                        placeholder="20100"
                        maxLength={5}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        required
                      />
                      {errors.codicePostale && <p className="text-xs text-red-400 mt-1">{errors.codicePostale}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Provincia <span className="text-red-500">*</span>
                      </label>
                      {formData.nazione === 'Italia' && formData.residencyZone?.startsWith('RESIDENTE_') ? (
                        <AppleStyleSelect
                          label="Provincia"
                          name="provinciaResidenza"
                          value={
                            formData.residencyZone === 'RESIDENTE_CA' ? 'CA' :
                              formData.residencyZone === 'RESIDENTE_SU' ? 'SU' :
                                formData.provinciaResidenza
                          }
                          onChange={(e) => {
                            const province = e.target.value;
                            // Update both provinciaResidenza and residencyZone
                            setFormData(prev => ({
                              ...prev,
                              provinciaResidenza: province,
                              residencyZone: province === 'CA' ? 'RESIDENTE_CA' : province === 'SU' ? 'RESIDENTE_SU' : prev.residencyZone
                            }));
                          }}
                          options={['CA', 'SU']}
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          name="provinciaResidenza"
                          value={formData.provinciaResidenza}
                          onChange={handleChange}
                          placeholder="MI"
                          maxLength={2}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase"
                          required
                        />
                      )}
                      {errors.provinciaResidenza && <p className="text-xs text-red-400 mt-1">{errors.provinciaResidenza}</p>}
                    </div>
                  </div>



                  <div className="grid grid-cols-2 gap-4 mt-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Telefono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+39 320 1234567"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        required
                      />
                      {errors.telefono && <p className="text-xs text-red-400 mt-1">{errors.telefono}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      PEC
                    </label>
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
                      {showPassword ? 'Hide' : 'Show'}
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

      {/* Document Upload Modal */}
      {
        showDocumentModal && newUserId && (
          <DocumentUploadModal
            isOpen={showDocumentModal}
            onClose={() => {
              setShowDocumentModal(false);
              // Open marketing modal after document modal closes (whether uploaded or skipped)
              setShowMarketingModal(true);
            }}
            userId={newUserId || ''}
          />
        )
      }

      {/* Marketing Consent Modal */}
      {
        showMarketingModal && newUserId && (
          <MarketingConsentModal
            isOpen={showMarketingModal}
            userId={newUserId}
            onClose={() => {
              setShowMarketingModal(false);
              navigate('/check-email');
            }}
            onConfirm={async () => {
              try {
                // Update customers_extended for backward compatibility
                if (newUserId) {
                  const { error } = await supabase
                    .from('customers_extended')
                    .update({
                      notifications: {
                        bookingConfirmations: true,
                        specialOffers: true,
                        newsletter: true,
                        marketingConsent: true
                      }
                    })
                    .eq('id', newUserId);

                  if (error) console.error('Error updating customers_extended:', error);
                }
              } catch (err) {
                console.error('Error in consent update:', err);
              } finally {
                setShowMarketingModal(false);
                navigate('/check-email');
              }
            }}
          />
        )
      }
    </motion.div >
  );
};

export default SignUpPage;
