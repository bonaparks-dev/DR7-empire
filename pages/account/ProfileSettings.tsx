import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { getUserCreditBalance, getCreditTransactions } from '../../utils/creditWallet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import type { CreditTransaction } from '../../utils/creditWallet';

interface CustomerExtended {
    id: string;
    tipo_cliente: 'persona_fisica' | 'azienda' | 'pubblica_amministrazione';
    nome?: string;
    cognome?: string;
    denominazione?: string;
    codice_fiscale?: string;
    partita_iva?: string;
    indirizzo?: string;
    telefono?: string;
    email?: string;
    pec?: string;
    nazione?: string;
    // Persona Fisica
    sesso?: string;
    data_nascita?: string;
    citta_nascita?: string;
    provincia_nascita?: string;
    citta_residenza?: string;
    provincia_residenza?: string;
    codice_postale?: string;
    numero_civico?: string;
    // Azienda
    codice_destinatario?: string; // SDI
    rappresentante_nome?: string;
    rappresentante_cognome?: string;
    rappresentante_cf?: string;
    rappresentante_ruolo?: string;
    sede_operativa?: string;

    metadata?: any;
}

const sanitizeDate = (dateString: string | undefined | null): string | null => {
    if (!dateString) return null;
    const trimmed = dateString.trim();
    return trimmed === '' ? null : trimmed;
};

const ProfileSettings = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        // Basic
        fullName: '',
        email: '',
        phone: '',
        // Persona Fisica
        firstName: '',
        lastName: '',
        sesso: '',
        dataNascita: '',
        cittaNascita: '',
        provinciaNascita: '',
        codiceFiscale: '',
        // Address
        indirizzo: '',
        numeroCivico: '',
        cittaResidenza: '',
        provinciaResidenza: '',
        codicePostale: '',
        // License
        tipoPatente: '',
        numeroPatente: '',
        patenteEmessaDa: '',
        patenteDataRilascio: '',
        patenteScadenza: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [successError, setSuccessError] = useState(false);
    const [creditBalance, setCreditBalance] = useState<number>(0);
    const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([]);
    const [isLoadingCredits, setIsLoadingCredits] = useState(true);
    const [extendedProfile, setExtendedProfile] = useState<CustomerExtended | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    type ClientStatus = 'Standard' | 'Fidelizzato' | 'Elite';
    const [clientStatus, setClientStatus] = useState<ClientStatus>('Standard');

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    // Fetch credit balance and profile data
    const loadData = async () => {
        if (user?.id) {
            setIsLoadingCredits(true);
            setIsLoadingProfile(true);
            try {
                // Fetch Credits
                const balance = await getUserCreditBalance(user.id);
                const transactions = await getCreditTransactions(user.id, 5);
                setCreditBalance(balance);
                setRecentTransactions(transactions);

                // Fetch Extended Profile
                const { data, error } = await supabase
                    .from('customers_extended')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching extended profile:', error);
                }

                if (data) {
                    setExtendedProfile(data);
                    // Update form data from extended profile
                    const isAzienda = data.tipo_cliente === 'azienda';
                    setFormData(prev => ({
                        ...prev,
                        fullName: isAzienda ? data.denominazione : `${data.nome || ''} ${data.cognome || ''}`.trim() || user.fullName || '',
                        phone: data.telefono || user.phone || '',
                        email: data.email || user.email || '',
                        // Persona Fisica fields
                        firstName: data.nome || '',
                        lastName: data.cognome || '',
                        codiceFiscale: data.codice_fiscale || '',
                        sesso: data.sesso || '',
                        dataNascita: data.data_nascita || '',
                        cittaNascita: data.citta_nascita || '',
                        provinciaNascita: data.provincia_nascita || '',
                        // Address
                        indirizzo: data.indirizzo || '',
                        numeroCivico: data.numero_civico || '',
                        cittaResidenza: data.citta_residenza || '',
                        provinciaResidenza: data.provincia_residenza || '',
                        codicePostale: data.codice_postale || '',
                        // License (from metadata)
                        tipoPatente: data.metadata?.tipo_patente || '',
                        numeroPatente: data.metadata?.numero_patente || '',
                        patenteEmessaDa: data.metadata?.patente_emessa_da || '',
                        patenteDataRilascio: data.metadata?.patente_data_rilascio || '',
                        patenteScadenza: data.metadata?.patente_scadenza || ''
                    }));
                } else {
                    // No profile found - we set null to trigger the fallback UI
                    // But we don't set a dummy object anymore to ensure we know it's missing
                    setExtendedProfile(null);
                }

                // --- Client Status Calculation ---
                // 1. Check Memberships for "Elite"
                const { data: memberships, error: membershipError } = await supabase
                    .from('membership_purchases')
                    .select('*')
                    .eq('user_id', user.id)
                    .gt('renewal_date', new Date().toISOString());

                const isElite = memberships && memberships.length > 0;

                // 2. Check Bookings for "Fidelizzato"
                const { count: bookingsCount, error: bookingsError } = await supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('userId', user.id);

                const isFidelizzato = (bookingsCount || 0) > 3;

                if (isElite) {
                    setClientStatus('Elite');
                } else if (isFidelizzato) {
                    setClientStatus('Fidelizzato');
                } else {
                    setClientStatus('Standard');
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoadingCredits(false);
                setIsLoadingProfile(false);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (successMessage) setSuccessMessage('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');
        try {
            // Update or Create in customers_extended table
            const nameParts = formData.fullName.trim().split(' ');
            const lastName = nameParts.length > 1 ? nameParts.pop() : '';
            const firstName = nameParts.join(' ');

            const commonData = {
                telefono: formData.phone,
                // If creating new or fallback, these might be useful defaults
                email: formData.email,
            };

            if (extendedProfile && extendedProfile.id) {
                // Update existing profile
                const updateData: any = { ...commonData };

                // For persona_fisica, update personal fields
                if (extendedProfile.tipo_cliente === 'persona_fisica') {
                    updateData.nome = formData.firstName;
                    updateData.cognome = formData.lastName;
                    updateData.codice_fiscale = formData.codiceFiscale?.toUpperCase().trim() || null;
                    updateData.sesso = formData.sesso;
                    updateData.data_nascita = sanitizeDate(formData.dataNascita);
                    updateData.citta_nascita = formData.cittaNascita;
                    updateData.provincia_nascita = formData.provinciaNascita;
                    updateData.indirizzo = formData.indirizzo;
                    updateData.numero_civico = formData.numeroCivico;
                    updateData.citta_residenza = formData.cittaResidenza;
                    updateData.provincia_residenza = formData.provinciaResidenza;
                    updateData.codice_postale = formData.codicePostale;

                    // Update license metadata
                    updateData.metadata = {
                        ...extendedProfile.metadata,
                        tipo_patente: formData.tipoPatente,
                        numero_patente: formData.numeroPatente,
                        patente_emessa_da: formData.patenteEmessaDa,
                        patente_data_rilascio: sanitizeDate(formData.patenteDataRilascio),
                        patente_scadenza: sanitizeDate(formData.patenteScadenza)
                    };
                }

                const { error } = await supabase
                    .from('customers_extended')
                    .update(updateData)
                    .eq('user_id', user!.id);

                if (error) throw error;
            } else {
                // INSERT NEW PROFILE
                // We default to persona_fisica and parse the fullName from the basic form
                const insertData = {
                    user_id: user!.id,
                    tipo_cliente: 'persona_fisica',
                    nome: firstName,
                    cognome: lastName,
                    codice_fiscale: formData.codiceFiscale?.toUpperCase() || null,
                    email: formData.email,
                    telefono: formData.phone,
                    nazione: 'Italia', // Default
                    metadata: {}
                };

                const { error } = await supabase
                    .from('customers_extended')
                    .insert([insertData]);

                if (error) throw error;
            }

            // Reload data to reflect changes
            await loadData();

            // Also update auth user metadata for consistency
            try {
                await updateUser({
                    fullName: formData.fullName || `${formData.firstName} ${formData.lastName}`.trim(),
                    phone: formData.phone
                });
            } catch (authError) {
                console.error("Failed to update auth metadata:", authError);
            }

            setSuccessMessage('Modifiche salvate con successo!');
            setSuccessError(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            console.error("Failed to update profile", error);
            setSuccessMessage(error?.message || 'Errore nel salvare le modifiche');
            setSuccessError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Credit Wallet Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">DR7 Credit Wallet</h2>
                    <p className="text-sm text-gray-400 mt-1">Your available credits for DR7 services</p>
                </div>
                <div className="p-6">
                    {isLoadingCredits ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-2 border-t-white border-gray-600 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Saldo Disponibile</p>
                                    <p className="text-4xl font-bold text-white">€{creditBalance.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Client Status Badge */}
                                    <div className={`px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 ${
                                        clientStatus === 'Elite'
                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                                            : clientStatus === 'Fidelizzato'
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300'
                                    }`}>
                                        {clientStatus === 'Elite' && (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        )}
                                        {clientStatus === 'Fidelizzato' && (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {clientStatus}
                                    </div>
                                    {/* Ricarica Button */}
                                    <button
                                        onClick={() => navigate('/credit-wallet')}
                                        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        Ricarica
                                    </button>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            {recentTransactions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Ultime Transazioni</h3>
                                    <div className="space-y-2">
                                        {recentTransactions.map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-md"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm text-white">{transaction.description}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(transaction.created_at).toLocaleDateString('it-IT', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${transaction.transaction_type === 'credit'
                                                        ? 'text-green-400'
                                                        : 'text-red-400'
                                                        }`}>
                                                        {transaction.transaction_type === 'credit' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Saldo: €{transaction.balance_after.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-lg">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">{t('Profile_Details')}</h2>
                    <p className="text-sm text-gray-400 mt-1">{t('Update_your_information')}</p>
                </div>
                <div className="p-6 space-y-6">

                    {isLoadingProfile ? (
                        <div className="text-center py-4 text-gray-400">Caricamento dati profilo...</div>
                    ) : extendedProfile ? (
                        <>
                            {/* --- Basic Info Section --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">Tipo Cliente</label>
                                    <p className="mt-1 text-white font-semibold capitalize">{extendedProfile.tipo_cliente?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">Nazione</label>
                                    <p className="mt-1 text-white">{extendedProfile.nazione || '-'}</p>
                                </div>
                            </div>

                            {/* --- Personal / Company Details --- */}
                            {extendedProfile.tipo_cliente === 'persona_fisica' && (
                                <div className="border-t border-gray-800 pt-4">
                                    <h3 className="text-lg font-semibold text-white mb-4">Dati Personali</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-sm text-gray-400">Nome</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Cognome</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Codice Fiscale</label><input type="text" value={formData.codiceFiscale} onChange={handleChange} name="codiceFiscale" className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2 font-mono uppercase" maxLength={16} /></div>
                                        <div><label className="text-sm text-gray-400">Sesso</label><select value={formData.sesso} onChange={(e) => setFormData({ ...formData, sesso: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2"><option value="">Seleziona...</option><option value="M">Maschio</option><option value="F">Femmina</option></select></div>
                                        <div><label className="text-sm text-gray-400">Data di Nascita</label><input type="date" value={formData.dataNascita} onChange={(e) => setFormData({ ...formData, dataNascita: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Città di Nascita</label><input type="text" value={formData.cittaNascita} onChange={(e) => setFormData({ ...formData, cittaNascita: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Provincia di Nascita</label><input type="text" value={formData.provinciaNascita} onChange={(e) => setFormData({ ...formData, provinciaNascita: e.target.value })} maxLength={2} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2 uppercase" /></div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Residenza</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-sm text-gray-400">Indirizzo</label><input type="text" value={formData.indirizzo} onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Numero Civico</label><input type="text" value={formData.numeroCivico} onChange={(e) => setFormData({ ...formData, numeroCivico: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Città</label><input type="text" value={formData.cittaResidenza} onChange={(e) => setFormData({ ...formData, cittaResidenza: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Provincia</label><input type="text" value={formData.provinciaResidenza} onChange={(e) => setFormData({ ...formData, provinciaResidenza: e.target.value })} maxLength={2} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2 uppercase" /></div>
                                        <div><label className="text-sm text-gray-400">CAP</label><input type="text" value={formData.codicePostale} onChange={(e) => setFormData({ ...formData, codicePostale: e.target.value })} maxLength={5} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Patente di Guida</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-sm text-gray-400">Tipo Patente</label><input type="text" value={formData.tipoPatente} onChange={(e) => setFormData({ ...formData, tipoPatente: e.target.value })} placeholder="es. B" className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Numero</label><input type="text" value={formData.numeroPatente} onChange={(e) => setFormData({ ...formData, numeroPatente: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2 font-mono" /></div>
                                        <div><label className="text-sm text-gray-400">Rilasciata da</label><input type="text" value={formData.patenteEmessaDa} onChange={(e) => setFormData({ ...formData, patenteEmessaDa: e.target.value })} placeholder="es. MIT" className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Data Rilascio</label><input type="date" value={formData.patenteDataRilascio} onChange={(e) => setFormData({ ...formData, patenteDataRilascio: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                        <div><label className="text-sm text-gray-400">Scadenza</label><input type="date" value={formData.patenteScadenza} onChange={(e) => setFormData({ ...formData, patenteScadenza: e.target.value })} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md text-white p-2" /></div>
                                    </div>
                                </div>
                            )}

                            {extendedProfile.tipo_cliente === 'azienda' && (
                                <div className="border-t border-gray-800 pt-4">
                                    <h3 className="text-lg font-semibold text-white mb-4">Dati Aziendali</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2"><label className="text-sm text-gray-400">Ragione Sociale</label><p className="text-white">{extendedProfile.denominazione}</p></div>
                                        <div><label className="text-sm text-gray-400">Partita IVA</label><p className="text-white font-mono">{extendedProfile.partita_iva}</p></div>
                                        <div><label className="text-sm text-gray-400">Codice Fiscale</label><p className="text-white font-mono">{extendedProfile.codice_fiscale}</p></div>
                                        <div><label className="text-sm text-gray-400">Codice SDI</label><p className="text-white font-mono">{extendedProfile.codice_destinatario}</p></div>
                                        <div><label className="text-sm text-gray-400">PEC</label><p className="text-white">{extendedProfile.pec || '-'}</p></div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Sede Legale & Operativa</h3>
                                    <div className="space-y-4">
                                        <div><label className="text-sm text-gray-400">Sede Legale</label><p className="text-white">{extendedProfile.indirizzo}</p></div>
                                        {extendedProfile.sede_operativa && <div><label className="text-sm text-gray-400">Sede Operativa</label><p className="text-white">{extendedProfile.sede_operativa}</p></div>}
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Rappresentante Legale</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-sm text-gray-400">Nome</label><p className="text-white">{extendedProfile.rappresentante_nome} {extendedProfile.rappresentante_cognome}</p></div>
                                        <div><label className="text-sm text-gray-400">Codice Fiscale</label><p className="text-white font-mono">{extendedProfile.rappresentante_cf}</p></div>
                                        <div><label className="text-sm text-gray-400">Ruolo</label><p className="text-white">{extendedProfile.rappresentante_ruolo}</p></div>
                                    </div>
                                </div>
                            )}

                            {/* --- Contact Info (Editable) --- */}
                            <div className="border-t border-gray-800 pt-6 mt-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Informazioni di Contatto (Modificabili)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('Email_Address')}</label>
                                        <input type="email" name="email" id="email" value={formData.email} readOnly className="mt-1 block w-full bg-gray-800/50 border-gray-700 rounded-md shadow-sm text-gray-400 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300">{t('Phone_Number')}</label>
                                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {/* Fallback to basic form if no extended profile found */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">{t('Full_Name')}</label>
                                <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('Email_Address')}</label>
                                <input type="email" name="email" id="email" value={formData.email} readOnly className="mt-1 block w-full bg-gray-800/50 border-gray-700 rounded-md shadow-sm text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">{t('Phone_Number')}</label>
                                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-gray-900 flex items-center justify-end space-x-4 rounded-b-lg">
                    {successMessage && <span className={`text-sm ${successError ? 'text-red-400' : 'text-green-400'}`}>{successMessage}</span>}
                    <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm disabled:opacity-60">
                        {isSubmitting ? t('Please_wait') : t('Save_Changes')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettings;