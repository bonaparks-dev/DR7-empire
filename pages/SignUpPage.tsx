import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    dataNascita: '',
    luogoNascita: '',
    numeroCivico: '',
    codicePostale: '',
    cittaResidenza: '',
    provinciaResidenza: '',
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState({
    cartaIdentitaFront: null as File | null,
    cartaIdentitaBack: null as File | null,
    codiceFiscaleFront: null as File | null,
    codiceFiscaleBack: null as File | null,
    patenteFront: null as File | null,
    patenteBack: null as File | null
  });

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
        // Codice Fiscale required only for Italy
        if (formData.nazione === 'Italia') {
          if (!formData.codiceFiscale) newErrors.codiceFiscale = 'Codice Fiscale è obbligatorio';
        }
        if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo è obbligatorio';
      }

      // Persona Fisica specific
      if (tipoCliente === 'persona_fisica') {
        if (!formData.nome) newErrors.nome = 'Nome è obbligatorio';
        if (!formData.cognome) newErrors.cognome = 'Cognome è obbligatorio';
        // Codice Fiscale required only for Italy
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
        if (!formData.cittaResidenza) newErrors.cittaResidenza = 'Città è obbligatoria';
        if (!formData.codicePostale) newErrors.codicePostale = 'CAP è obbligatorio';
        if (!formData.provinciaResidenza) newErrors.provinciaResidenza = 'Provincia è obbligatoria';
      }

      // Pubblica Amministrazione specific
      if (tipoCliente === 'pubblica_amministrazione') {
        if (!formData.codiceUnivoco) newErrors.codiceUnivoco = 'Codice Univoco è obbligatorio';
        if (!formData.enteUfficio) newErrors.enteUfficio = 'Ente o Ufficio è obbligatorio';
        if (!formData.citta) newErrors.citta = 'Città è obbligatorio';
        // Codice Fiscale required only for Italy
        if (formData.nazione === 'Italia') {
          if (!formData.codiceFiscale) newErrors.codiceFiscale = 'Codice Fiscale è obbligatorio';
        }
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
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (field: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  const handleUploadDocuments = async () => {
    if (!newUserId) return;

    setUploadingDocuments(true);
    try {
      const uploads = [];

      // Upload each document if selected
      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${newUserId}/${key}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('user-documents')
            .upload(fileName, file);

          if (uploadError) {
            console.error(`Error uploading ${key}:`, uploadError);
          } else {
            uploads.push({
              user_id: newUserId,
              document_type: key,
              file_path: fileName,
              upload_date: new Date().toISOString(),
              status: 'pending_verification'
            });
          }
        }
      }

      // Save document records to database
      if (uploads.length > 0) {
        const { error: dbError } = await supabase
          .from('user_documents')
          .insert(uploads);

        if (dbError) {
          console.error('Error saving document records:', dbError);
        }
      }

      setShowWelcomeModal(false);
      navigate('/check-email');
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleSkipDocuments = () => {
    setShowSkipConfirmation(true);
  };

  const confirmSkip = () => {
    setShowWelcomeModal(false);
    setShowSkipConfirmation(false);
    navigate('/check-email');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Step 1: Create auth user with full name
      const fullName = tipoCliente === 'persona_fisica'
        ? `${formData.nome} ${formData.cognome}`
        : tipoCliente === 'azienda'
        ? formData.denominazione
        : formData.enteUfficio;

      const { data: authData, error: authError } = await signup(
        formData.email,
        formData.password,
        {
          full_name: fullName,
          role: 'personal'
        }
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
        customerData.telefono = formData.telefono;
      } else if (tipoCliente === 'persona_fisica') {
        customerData.nome = formData.nome;
        customerData.cognome = formData.cognome;
        customerData.telefono = formData.telefono;
        customerData.email = formData.email;
        if (formData.pec) customerData.pec = formData.pec;
        if (formData.dataNascita) customerData.data_nascita = formData.dataNascita;
        if (formData.luogoNascita) customerData.luogo_nascita = formData.luogoNascita;
        if (formData.numeroCivico) customerData.numero_civico = formData.numeroCivico;
        customerData.codice_postale = formData.codicePostale;
        customerData.citta_residenza = formData.cittaResidenza;
        customerData.provincia_residenza = formData.provinciaResidenza;
      } else if (tipoCliente === 'pubblica_amministrazione') {
        customerData.codice_univoco = formData.codiceUnivoco;
        customerData.ente_ufficio = formData.enteUfficio;
        customerData.citta = formData.citta;
        customerData.email = formData.email;
        customerData.telefono = formData.telefono;
      }

      const { error: customerError } = await supabase
        .from('customers_extended')
        .insert([customerData]);

      if (customerError) {
        console.error('Error saving customer data:', customerError);
        // Don't throw - user is created, just log the error
      }

      // Save user ID and show welcome modal
      setNewUserId(authData?.user?.id || null);
      setShowWelcomeModal(true);
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
                      Codice Fiscale {formData.nazione === 'Italia' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={handleChange}
                      placeholder="00000000000"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required={formData.nazione === 'Italia'}
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
                    <select
                      name="nazione"
                      value={formData.nazione}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required
                    >
                      <option value="Italia">Italia</option>
                      <option value="Francia">Francia</option>
                      <option value="Germania">Germania</option>
                      <option value="Spagna">Spagna</option>
                      <option value="Altro">Altro</option>
                    </select>
                    {errors.nazione && <p className="text-xs text-red-400 mt-1">{errors.nazione}</p>}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Codice Fiscale {formData.nazione === 'Italia' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={handleChange}
                      placeholder="RSSMRA80A01H501U"
                      maxLength={16}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase"
                      required={formData.nazione === 'Italia'}
                    />
                    {errors.codiceFiscale && <p className="text-xs text-red-400 mt-1">{errors.codiceFiscale}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data di Nascita
                      </label>
                      <input
                        type="date"
                        name="dataNascita"
                        value={formData.dataNascita}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Luogo di Nascita
                      </label>
                      <input
                        type="text"
                        name="luogoNascita"
                        value={formData.luogoNascita}
                        onChange={handleChange}
                        placeholder="Roma"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      />
                    </div>
                  </div>

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
                        Numero Civico
                      </label>
                      <input
                        type="text"
                        name="numeroCivico"
                        value={formData.numeroCivico}
                        onChange={handleChange}
                        placeholder="123"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      />
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
                      {errors.provinciaResidenza && <p className="text-xs text-red-400 mt-1">{errors.provinciaResidenza}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      Codice Fiscale {formData.nazione === 'Italia' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={handleChange}
                      placeholder="00000000000"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                      required={formData.nazione === 'Italia'}
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

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowWelcomeModal(false);
              navigate('/check-email');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-2xl font-bold text-white text-center">
                  Benvenuto in DR7 S.p.A.! 🎉
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 text-gray-300">
                <p className="text-center text-lg text-white font-semibold">
                  Grazie per esserti iscritto al sito ufficiale DR7 S.p.A.
                </p>

                <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-3">
                    Una volta caricati i documenti, il tuo account verrà verificato e riceverai immediatamente il tuo Credito Benvenuto DR7:
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      <span><strong className="text-white">+10€</strong> immediati utilizzabili per i lavaggi</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>fino a <strong className="text-white">+50€</strong> extra come incentivo fedeltà utilizzabili per i noleggio Supercars</span>
                    </li>
                  </ul>
                </div>

                <p>
                  Per completare il tuo profilo ed accedere ai vantaggi esclusivi riservati ai membri registrati,
                  ti chiediamo di caricare i tuoi documenti:
                </p>

                {/* Document Upload Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-white mb-3">Carica i tuoi documenti:</h3>

                  {/* Carta d'Identità */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Carta d'Identità *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Fronte</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange('cartaIdentitaFront')}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Retro</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange('cartaIdentitaBack')}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Codice Fiscale */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Codice Fiscale *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Fronte</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange('codiceFiscaleFront')}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Retro</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange('codiceFiscaleBack')}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Patente */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Patente di guida (opzionale)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Fronte</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange('patenteFront')}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Retro</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange('patenteBack')}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">Inoltre:</h3>
                  <p>
                    7 giorni prima del tuo compleanno riceverai un nostro messaggio dedicato con un <strong className="text-white">Buono Auguri DR7</strong>,
                    utilizzabile su qualunque servizio.
                  </p>
                </div>

                <p className="text-center text-sm italic mt-6">
                  Grazie per aver scelto DR7 S.p.A.<br />
                  <strong className="text-white">La nuova esperienza della mobilità di lusso in Italia.</strong>
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-800 flex gap-4">
                <button
                  onClick={handleSkipDocuments}
                  disabled={uploadingDocuments}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-full font-bold hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Salta per Ora
                </button>
                <button
                  onClick={handleUploadDocuments}
                  disabled={uploadingDocuments}
                  className="flex-1 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {uploadingDocuments ? 'Caricamento...' : 'Carica Documenti'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Confirmation Modal */}
      <AnimatePresence>
        {showSkipConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSkipConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border-2 border-red-800 rounded-lg max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-red-800/50 bg-red-900/20">
                <h2 className="text-2xl font-bold text-white text-center">
                  ⚠️ Sei sicuro?
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 text-gray-300 text-center">
                <p className="text-lg text-white font-semibold">
                  Sei sicuro di voler continuare senza caricare i tuoi documenti?
                </p>

                <p className="text-base">
                  Caricandoli ora <strong className="text-white">(CI, CF, Patente)</strong> ricevi il tuo <strong className="text-green-400">Credito Benvenuto DR7</strong>: <strong className="text-white">10€ immediati per i lavaggi</strong> e <strong className="text-yellow-400">fino a 50€ extra per i noleggio Supercars</strong>.
                </p>

                <p className="text-lg font-bold text-yellow-400">
                  Non perdere il tuo vantaggio esclusivo.
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-800 flex gap-4">
                <button
                  onClick={() => setShowSkipConfirmation(false)}
                  className="flex-1 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                >
                  Torna Indietro
                </button>
                <button
                  onClick={confirmSkip}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-full font-bold hover:bg-gray-600 transition-colors"
                >
                  Salta Comunque
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SignUpPage;
