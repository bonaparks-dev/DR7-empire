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

const ProfileSettings = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [creditBalance, setCreditBalance] = useState<number>(0);
    const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([]);
    const [isLoadingCredits, setIsLoadingCredits] = useState(true);
    const [extendedProfile, setExtendedProfile] = useState<CustomerExtended | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
    useEffect(() => {
        const fetchData = async () => {
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
                        .single();

                    if (data) {
                        setExtendedProfile(data);
                        // Update basic form data from extended profile if available, otherwise fallback to auth user
                        setFormData(prev => ({
                            ...prev,
                            fullName: data.tipo_cliente === 'azienda' ? data.denominazione : `${data.nome || ''} ${data.cognome || ''}`.trim() || user.fullName || '',
                            phone: data.telefono || user.phone || '',
                            email: data.email || user.email || '' // Usually email matches
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setIsLoadingCredits(false);
                    setIsLoadingProfile(false);
                }
            }
        };

        fetchData();
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
            await updateUser({
                fullName: formData.fullName,
                phone: formData.phone
            });
            setSuccessMessage(t('Changes_Saved'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Failed to update profile", error);
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
                                <button
                                    onClick={() => navigate('/credit-wallet')}
                                    className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    Ricarica
                                </button>
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
                                        <div><label className="text-sm text-gray-400">Nome</label><p className="text-white">{extendedProfile.nome}</p></div>
                                        <div><label className="text-sm text-gray-400">Cognome</label><p className="text-white">{extendedProfile.cognome}</p></div>
                                        <div><label className="text-sm text-gray-400">Codice Fiscale</label><p className="text-white font-mono">{extendedProfile.codice_fiscale}</p></div>
                                        <div><label className="text-sm text-gray-400">Sesso</label><p className="text-white">{extendedProfile.sesso}</p></div>
                                        <div><label className="text-sm text-gray-400">Data di Nascita</label><p className="text-white">{extendedProfile.data_nascita}</p></div>
                                        <div><label className="text-sm text-gray-400">Luogo di Nascita</label><p className="text-white">{extendedProfile.citta_nascita} ({extendedProfile.provincia_nascita})</p></div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Residenza</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2"><label className="text-sm text-gray-400">Indirizzo</label><p className="text-white">{extendedProfile.indirizzo} {extendedProfile.numero_civico ? `, ${extendedProfile.numero_civico}` : ''}</p></div>
                                        <div><label className="text-sm text-gray-400">Città</label><p className="text-white">{extendedProfile.citta_residenza}</p></div>
                                        <div><label className="text-sm text-gray-400">Provincia</label><p className="text-white">{extendedProfile.provincia_residenza}</p></div>
                                        <div><label className="text-sm text-gray-400">CAP</label><p className="text-white">{extendedProfile.codice_postale}</p></div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Patente di Guida</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-sm text-gray-400">Tipo Patente</label><p className="text-white">{extendedProfile.metadata?.tipo_patente || '-'}</p></div>
                                        <div><label className="text-sm text-gray-400">Numero</label><p className="text-white font-mono">{extendedProfile.metadata?.numero_patente || '-'}</p></div>
                                        <div><label className="text-sm text-gray-400">Rilasciata da</label><p className="text-white">{extendedProfile.metadata?.patente_emessa_da || '-'}</p></div>
                                        <div><label className="text-sm text-gray-400">Data Rilascio</label><p className="text-white">{extendedProfile.metadata?.patente_data_rilascio || '-'}</p></div>
                                        <div><label className="text-sm text-gray-400">Scadenza</label><p className="text-white">{extendedProfile.metadata?.patente_scadenza || '-'}</p></div>
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
                    {successMessage && <span className="text-sm text-green-400">{successMessage}</span>}
                    <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm disabled:opacity-60">
                        {isSubmitting ? t('Please_wait') : t('Save_Changes')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettings;