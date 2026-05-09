import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import CalcolaCFButton from '../components/ui/CalcolaCFButton'

// Mirror del NewClientModal admin (Persona Fisica / Azienda / Pubblica Amm.)
// reso pubblico: il cliente arriva qui da un link inviato dall'operatore,
// compila i dati anagrafici + carica i documenti, atterra in customers_extended
// con source='self_registration' e source_invite_id collegato al token.

type ClientType = 'persona_fisica' | 'azienda' | 'pubblica_amministrazione'

interface InviteState {
    valid: boolean | null
    expired?: boolean
    used?: boolean
    revoked?: boolean
    expiresAt?: string
    error?: string
}

interface FormState {
    tipo_cliente: ClientType
    // Contatti (comuni)
    telefono: string
    email: string
    // Persona Fisica
    nome: string
    cognome: string
    sesso: string
    codice_fiscale: string
    data_nascita: string
    luogo_nascita: string
    provincia_nascita: string
    // Residenza
    indirizzo: string
    numero_civico: string
    citta: string
    cap: string
    provincia: string
    nazione: string
    // Azienda
    ragione_sociale: string
    partita_iva: string
    pec: string
    codice_destinatario: string
    // Pubblica Amministrazione
    ente_ufficio: string
    codice_univoco: string
}

const initialForm: FormState = {
    tipo_cliente: 'persona_fisica',
    telefono: '', email: '',
    nome: '', cognome: '', sesso: '',
    codice_fiscale: '', data_nascita: '', luogo_nascita: '', provincia_nascita: '',
    indirizzo: '', numero_civico: '', citta: '', cap: '', provincia: '', nazione: 'IT',
    ragione_sociale: '', partita_iva: '', pec: '', codice_destinatario: '',
    ente_ufficio: '', codice_univoco: '',
}

type DocKind = 'identity_document' | 'drivers_license' | 'codice_fiscale'

interface DocItem {
    kind: DocKind
    file: File
    uploaded?: boolean
    uploading?: boolean
    error?: string
}

const TIPO_LABELS: Record<ClientType, string> = {
    persona_fisica: 'Persona Fisica',
    azienda: 'Azienda',
    pubblica_amministrazione: 'Pubblica Amm.',
}

export default function RegistrazioneClientePage() {
    const { token } = useParams<{ token: string }>()
    const [invite, setInvite] = useState<InviteState>({ valid: null })
    const [step, setStep] = useState<'form' | 'documents' | 'done'>('form')
    const [form, setForm] = useState<FormState>(initialForm)
    const [submitting, setSubmitting] = useState(false)
    const [submitErr, setSubmitErr] = useState<string | null>(null)
    const [cfMsg, setCfMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [customerId, setCustomerId] = useState<string | null>(null)
    const [docs, setDocs] = useState<DocItem[]>([])

    useEffect(() => {
        if (!token) {
            setInvite({ valid: false, error: 'Link incompleto' })
            return
        }
        ;(async () => {
            try {
                const res = await fetch(`/.netlify/functions/validate-customer-invite?token=${encodeURIComponent(token)}`)
                const json = await res.json()
                setInvite(json)
            } catch (e) {
                setInvite({ valid: false, error: e instanceof Error ? e.message : 'Errore validazione' })
            }
        })()
    }, [token])

    function update<K extends keyof FormState>(k: K, v: FormState[K]) {
        setForm(prev => ({ ...prev, [k]: v }))
    }

    // Codice Fiscale Calcola — riusa il pattern bidirezionale del sito (calcola
    // CF dai dati / estrae dati dal CF / verifica consistenza). Mostra messaggi
    // inline invece di alert() cosi' l'esperienza mobile rimane fluida.
    const cfConfig = useMemo(() => ({
        getCognome: () => form.cognome,
        getNome: () => form.nome,
        getDataNascita: () => form.data_nascita,
        getSesso: () => form.sesso,
        getLuogoNascita: () => form.luogo_nascita,
        getCodiceFiscale: () => form.codice_fiscale,
        setCodiceFiscale: (v: string) => update('codice_fiscale', v),
        setSesso: (v: string) => update('sesso', v),
        setDataNascita: (v: string) => update('data_nascita', v),
        setLuogoNascita: (v: string) => update('luogo_nascita', v),
        setProvinciaNascita: (v: string) => update('provincia_nascita', v),
        onSuccess: (text: string) => setCfMsg({ type: 'success', text }),
        onError: (text: string) => setCfMsg({ type: 'error', text }),
    }), [form.nome, form.cognome, form.sesso, form.data_nascita, form.luogo_nascita, form.codice_fiscale])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitErr(null)

        const missing: string[] = []
        // Comuni
        if (!form.telefono.trim()) missing.push('Telefono')
        if (!form.email.trim()) missing.push('Email')
        if (!form.indirizzo.trim()) missing.push('Indirizzo')
        if (!form.citta.trim()) missing.push('Città')
        if (!form.cap.trim()) missing.push('CAP')
        if (!form.provincia.trim()) missing.push('Provincia')

        if (form.tipo_cliente === 'azienda') {
            if (!form.ragione_sociale.trim()) missing.push('Ragione sociale')
            if (!form.partita_iva.trim()) missing.push('P.IVA')
            if (!form.pec.trim() && !form.codice_destinatario.trim()) {
                missing.push('PEC o Codice Destinatario SDI')
            }
        } else if (form.tipo_cliente === 'pubblica_amministrazione') {
            if (!form.ente_ufficio.trim()) missing.push('Ente / Ufficio')
            if (!form.codice_univoco.trim()) missing.push('Codice Univoco IPA')
        } else {
            // persona_fisica
            if (!form.nome.trim()) missing.push('Nome')
            if (!form.cognome.trim()) missing.push('Cognome')
            if (!form.codice_fiscale.trim()) missing.push('Codice Fiscale')
            if (!form.data_nascita) missing.push('Data di nascita')
            if (!form.luogo_nascita.trim()) missing.push('Luogo di nascita')
        }

        if (missing.length > 0) return setSubmitErr(`Campi mancanti: ${missing.join(', ')}`)

        if (form.telefono.replace(/\D/g, '').length < 8) return setSubmitErr('Numero di telefono non valido')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setSubmitErr('Email non valida')
        if (form.tipo_cliente === 'persona_fisica' && form.codice_fiscale.length !== 16) {
            return setSubmitErr('Codice Fiscale deve essere di 16 caratteri')
        }
        if (form.tipo_cliente === 'azienda' && !/^\d{11}$/.test(form.partita_iva)) {
            return setSubmitErr('P.IVA deve essere di 11 cifre')
        }

        setSubmitting(true)
        try {
            // Mappiamo i nostri campi a quelli che submit-customer-invite si aspetta.
            // tipo_cliente del backend era 'privato' | 'azienda'; lo manteniamo
            // backwards compatible mappando persona_fisica -> 'privato' e
            // pubblica_amministrazione -> 'azienda' (entrambi richiedono SDI),
            // ma passiamo anche il valore originale come ente_ufficio/codice_ipa.
            const payloadCustomer: Record<string, string> = {
                tipo_cliente: form.tipo_cliente === 'persona_fisica' ? 'privato' : 'azienda',
                telefono: form.telefono.trim(),
                email: form.email.trim(),
                indirizzo: form.indirizzo.trim(),
                numero_civico: form.numero_civico.trim(),
                citta: form.citta.trim(),
                cap: form.cap.trim(),
                provincia: form.provincia.trim().toUpperCase(),
                nazione: form.nazione.trim().toUpperCase() || 'IT',
            }

            if (form.tipo_cliente === 'persona_fisica') {
                payloadCustomer.nome = form.nome.trim()
                payloadCustomer.cognome = form.cognome.trim()
                payloadCustomer.sesso = form.sesso.trim()
                payloadCustomer.codice_fiscale = form.codice_fiscale.trim().toUpperCase()
                payloadCustomer.data_nascita = form.data_nascita
                payloadCustomer.luogo_nascita = form.luogo_nascita.trim()
                payloadCustomer.provincia_nascita = form.provincia_nascita.trim().toUpperCase()
            } else if (form.tipo_cliente === 'azienda') {
                payloadCustomer.ragione_sociale = form.ragione_sociale.trim()
                payloadCustomer.denominazione = form.ragione_sociale.trim()
                payloadCustomer.partita_iva = form.partita_iva.trim()
                payloadCustomer.pec = form.pec.trim()
                payloadCustomer.codice_destinatario = form.codice_destinatario.trim().toUpperCase()
                if (form.codice_fiscale.trim()) payloadCustomer.codice_fiscale = form.codice_fiscale.trim().toUpperCase()
            } else {
                // pubblica_amministrazione
                payloadCustomer.ente_ufficio = form.ente_ufficio.trim()
                payloadCustomer.ragione_sociale = form.ente_ufficio.trim()
                payloadCustomer.codice_univoco = form.codice_univoco.trim().toUpperCase()
                payloadCustomer.codice_ipa = form.codice_univoco.trim().toUpperCase()
                if (form.partita_iva.trim()) payloadCustomer.partita_iva = form.partita_iva.trim()
                if (form.pec.trim()) payloadCustomer.pec = form.pec.trim()
                if (form.codice_fiscale.trim()) payloadCustomer.codice_fiscale = form.codice_fiscale.trim().toUpperCase()
            }

            const res = await fetch('/.netlify/functions/submit-customer-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, customer: payloadCustomer }),
            })
            const json: { success?: boolean; customerId?: string; error?: string } = await res.json()
            if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`)
            setCustomerId(json.customerId || null)
            setStep('documents')
        } catch (err) {
            setSubmitErr(err instanceof Error ? err.message : String(err))
        } finally {
            setSubmitting(false)
        }
    }

    function addDoc(kind: DocKind, file: File) {
        setDocs(prev => [...prev, { kind, file }])
    }

    function removeDoc(idx: number) {
        setDocs(prev => prev.filter((_, i) => i !== idx))
    }

    async function uploadDocs() {
        if (!customerId || !token) return
        for (let i = 0; i < docs.length; i++) {
            const item = docs[i]
            if (item.uploaded) continue
            setDocs(prev => prev.map((d, j) => j === i ? { ...d, uploading: true, error: undefined } : d))
            try {
                const fileBuf = await item.file.arrayBuffer()
                const b64 = btoa(String.fromCharCode(...new Uint8Array(fileBuf)))
                const res = await fetch('/.netlify/functions/upload-customer-invite-document', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token,
                        customerId,
                        docKind: item.kind,
                        fileName: item.file.name,
                        contentType: item.file.type,
                        fileBase64: b64,
                    }),
                })
                const json = await res.json()
                if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`)
                setDocs(prev => prev.map((d, j) => j === i ? { ...d, uploading: false, uploaded: true } : d))
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                setDocs(prev => prev.map((d, j) => j === i ? { ...d, uploading: false, error: msg } : d))
            }
        }
    }

    // ─── Render gates ────────────────────────────────────────────────────
    if (invite.valid === null) return <Centered><p className="text-zinc-300">Verifica link…</p></Centered>
    if (!invite.valid) {
        const reason = invite.expired ? 'Il link è scaduto.' :
            invite.used ? 'Questo link è già stato utilizzato.' :
            invite.revoked ? 'Il link è stato revocato.' :
            invite.error || 'Link non valido.'
        return <Centered>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Link non utilizzabile</h1>
            <p className="text-zinc-300">{reason}</p>
            <p className="text-sm text-zinc-500 mt-4">Contatta DR7 Empire per un nuovo link di registrazione.</p>
        </Centered>
    }

    if (step === 'done') {
        return <Centered>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2">Registrazione completata</h1>
            <p className="text-zinc-300">Grazie. Il team DR7 Empire verificherà i documenti caricati al più presto.</p>
        </Centered>
    }

    return (
        <div className="py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <PageIntro />

                {step === 'form' && (
                    <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-400/20 p-6 sm:p-8 space-y-7">
                        {/* 1. Tipo Cliente */}
                        <section>
                            <SectionTitle index="1" title="Tipo Cliente" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {(['persona_fisica', 'azienda', 'pubblica_amministrazione'] as const).map(t => {
                                    const active = form.tipo_cliente === t
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => update('tipo_cliente', t)}
                                            className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                                active
                                                    ? 'border-amber-400 bg-amber-400/10 text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.6)]'
                                                    : 'border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800'
                                            }`}
                                        >
                                            {TIPO_LABELS[t]}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        {/* 2. Dati anagrafici / azienda / PA */}
                        {form.tipo_cliente === 'persona_fisica' && (
                            <section>
                                <SectionTitle index="2" title="Dati Anagrafici" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Nome" value={form.nome} onChange={v => update('nome', v)} required />
                                    <Field label="Cognome" value={form.cognome} onChange={v => update('cognome', v)} required />
                                    <div className="md:col-span-2">
                                        <label className="block">
                                            <span className="text-xs font-semibold text-zinc-300 tracking-wide">CODICE FISCALE *</span>
                                            <div className="mt-2 flex flex-col sm:flex-row gap-2">
                                                <input
                                                    value={form.codice_fiscale}
                                                    onChange={e => update('codice_fiscale', e.target.value.toUpperCase())}
                                                    required
                                                    maxLength={16}
                                                    minLength={16}
                                                    placeholder="ABCDEF12G34H567I"
                                                    className={INPUT_CLASS + ' uppercase tracking-wider'}
                                                />
                                                <CalcolaCFButton
                                                    config={cfConfig}
                                                    className="px-4 py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-amber-400/20"
                                                />
                                            </div>
                                            {cfMsg && (
                                                <p className={`mt-2 text-xs ${cfMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{cfMsg.text}</p>
                                            )}
                                        </label>
                                    </div>
                                    <SelectField label="Sesso" value={form.sesso} onChange={v => update('sesso', v)} options={[
                                        { value: '', label: 'Seleziona…' },
                                        { value: 'M', label: 'Maschio' },
                                        { value: 'F', label: 'Femmina' },
                                    ]} />
                                    <Field label="Data di Nascita" type="date" value={form.data_nascita} onChange={v => update('data_nascita', v)} required />
                                    <Field label="Luogo di Nascita" value={form.luogo_nascita} onChange={v => update('luogo_nascita', v)} required placeholder="es. Cagliari, Torino…" />
                                    <Field label="Provincia di Nascita" value={form.provincia_nascita} onChange={v => update('provincia_nascita', v.toUpperCase())} maxLength={2} placeholder="es. CA, TO, MI…" />
                                </div>
                            </section>
                        )}

                        {form.tipo_cliente === 'azienda' && (
                            <section>
                                <SectionTitle index="2" title="Dati Azienda" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Ragione Sociale" value={form.ragione_sociale} onChange={v => update('ragione_sociale', v)} required />
                                    <Field label="P.IVA" value={form.partita_iva} onChange={v => update('partita_iva', v.replace(/\D/g, ''))} required maxLength={11} minLength={11} placeholder="11 cifre" />
                                    <Field label="PEC (se nessun Codice SDI)" type="email" value={form.pec} onChange={v => update('pec', v)} placeholder="azienda@pec.it" />
                                    <Field label="Codice Destinatario SDI (se nessuna PEC)" value={form.codice_destinatario} onChange={v => update('codice_destinatario', v.toUpperCase())} maxLength={7} placeholder="7 caratteri" />
                                    <Field label="Codice Fiscale Rappresentante" value={form.codice_fiscale} onChange={v => update('codice_fiscale', v.toUpperCase())} maxLength={16} />
                                </div>
                            </section>
                        )}

                        {form.tipo_cliente === 'pubblica_amministrazione' && (
                            <section>
                                <SectionTitle index="2" title="Pubblica Amministrazione" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Ente / Ufficio" value={form.ente_ufficio} onChange={v => update('ente_ufficio', v)} required />
                                    <Field label="Codice Univoco IPA" value={form.codice_univoco} onChange={v => update('codice_univoco', v.toUpperCase())} required maxLength={6} placeholder="6 caratteri" />
                                    <Field label="P.IVA" value={form.partita_iva} onChange={v => update('partita_iva', v.replace(/\D/g, ''))} maxLength={11} />
                                    <Field label="Codice Fiscale Ente" value={form.codice_fiscale} onChange={v => update('codice_fiscale', v.toUpperCase())} maxLength={16} />
                                    <Field label="PEC" type="email" value={form.pec} onChange={v => update('pec', v)} />
                                </div>
                            </section>
                        )}

                        {/* 3. Residenza / Sede */}
                        <section>
                            <SectionTitle index="3" title={form.tipo_cliente === 'persona_fisica' ? 'Residenza' : 'Sede'} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <Field label="Indirizzo" value={form.indirizzo} onChange={v => update('indirizzo', v)} required placeholder="Via / Viale / Corso…" />
                                </div>
                                <Field label="Civico" value={form.numero_civico} onChange={v => update('numero_civico', v)} maxLength={10} placeholder="es. 12/A" />
                                <Field label="Città" value={form.citta} onChange={v => update('citta', v)} required placeholder="es. Cagliari" />
                                <Field label="Provincia" value={form.provincia} onChange={v => update('provincia', v.toUpperCase())} maxLength={2} minLength={2} required placeholder="es. CA" />
                                <Field label="CAP" value={form.cap} onChange={v => update('cap', v.replace(/\D/g, ''))} maxLength={5} minLength={5} required placeholder="5 cifre" />
                                <Field label="Nazione" value={form.nazione} onChange={v => update('nazione', v.toUpperCase())} maxLength={2} placeholder="IT" />
                            </div>
                        </section>

                        {/* 4. Contatti */}
                        <section>
                            <SectionTitle index="4" title="Contatti" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Telefono" type="tel" value={form.telefono} onChange={v => update('telefono', v)} required placeholder="+39 333 1234567" />
                                <Field label="Email" type="email" value={form.email} onChange={v => update('email', v)} required placeholder="nome@esempio.com" />
                            </div>
                        </section>

                        <p className="text-xs text-zinc-500 pt-1">I campi contrassegnati con * sono obbligatori.</p>

                        {submitErr && (
                            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{submitErr}</p>
                        )}

                        <div className="pt-5 border-t border-zinc-800 flex flex-col sm:flex-row sm:justify-end gap-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 bg-amber-400 text-zinc-900 font-bold rounded-xl hover:bg-amber-300 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-amber-400/20"
                            >
                                {submitting ? 'Invio…' : 'Continua →'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'documents' && customerId && (
                    <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-400/20 p-6 sm:p-8 space-y-5">
                        <div>
                            <SectionTitle index="✓" title="Documenti" />
                            <p className="text-sm text-zinc-400">
                                Carica i tuoi documenti. Saranno verificati dal team DR7 prima di confermare la registrazione.
                                Formati: JPG, PNG, PDF (max 10 MB ciascuno).
                            </p>
                        </div>

                        <div className="space-y-3">
                            <DocPicker label="Carta d'identità o Passaporto" kind="identity_document" onAdd={addDoc} />
                            <DocPicker label="Patente di guida" kind="drivers_license" onAdd={addDoc} />
                            <DocPicker label="Codice Fiscale / Tessera Sanitaria" kind="codice_fiscale" onAdd={addDoc} />
                        </div>

                        {docs.length > 0 && (
                            <ul className="border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
                                {docs.map((d, i) => (
                                    <li key={i} className="px-4 py-3 flex items-center gap-3 text-sm bg-zinc-950/50">
                                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">{d.kind.replace('_', ' ')}</span>
                                        <span className="flex-1 truncate text-zinc-200">{d.file.name}</span>
                                        {d.uploaded ? <span className="text-emerald-400 text-xs font-semibold">✓ caricato</span>
                                            : d.uploading ? <span className="text-amber-300 text-xs">caricamento…</span>
                                                : d.error ? <span className="text-red-400 text-xs">{d.error}</span>
                                                    : <button type="button" onClick={() => removeDoc(i)} className="text-red-400 text-xs hover:text-red-300">rimuovi</button>}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-5 border-t border-zinc-800">
                            <button type="button" onClick={() => setStep('done')}
                                className="text-sm text-zinc-400 underline self-start hover:text-zinc-200">Salta i documenti per ora</button>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button type="button" onClick={uploadDocs}
                                    disabled={docs.length === 0 || docs.every(d => d.uploaded)}
                                    className="px-5 py-2.5 bg-zinc-800 text-zinc-100 font-semibold rounded-xl hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-40">
                                    Carica selezionati
                                </button>
                                <button type="button" onClick={() => setStep('done')}
                                    disabled={docs.some(d => !d.uploaded && !d.error)}
                                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-emerald-500/20">
                                    Concludi
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Style tokens ───────────────────────────────────────────────────────
// Centralizzate qui cosi' tutti gli input hanno la STESSA visibilita' su
// dark theme (placeholder leggibile, bordo sempre presente, focus chiaro).
const INPUT_CLASS =
    'w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 ' +
    'placeholder:text-zinc-500 placeholder:font-normal ' +
    'focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 ' +
    'transition-colors'

function PageIntro() {
    return (
        <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Registrazione Cliente</h1>
            <p className="text-sm text-zinc-400 mt-2">Compila i tuoi dati per completare la registrazione DR7 Empire</p>
        </div>
    )
}

function Centered({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
            <div className="bg-zinc-900/80 backdrop-blur-sm border border-amber-400/20 rounded-2xl shadow-2xl p-8 max-w-md text-center">
                {children}
            </div>
        </div>
    )
}

function SectionTitle({ index, title }: { index: string; title: string }) {
    return (
        <h3 className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wider mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/40 text-[11px] text-amber-300">{index}</span>
            {title}
        </h3>
    )
}

function Field({ label, value, onChange, type = 'text', required, maxLength, minLength, placeholder }: {
    label: string
    value: string
    onChange: (v: string) => void
    type?: string
    required?: boolean
    maxLength?: number
    minLength?: number
    placeholder?: string
}) {
    return (
        <label className="block">
            <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">{label}{required ? ' *' : ''}</span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                maxLength={maxLength}
                minLength={minLength}
                placeholder={placeholder}
                className={`mt-2 ${INPUT_CLASS}`}
            />
        </label>
    )
}

function SelectField({ label, value, onChange, options }: {
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <label className="block">
            <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">{label}</span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`mt-2 ${INPUT_CLASS} appearance-none pr-8 bg-no-repeat bg-right`}
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '18px', backgroundPosition: 'right 12px center' }}
            >
                {options.map(o => <option key={o.value} value={o.value} className="bg-zinc-900 text-zinc-100">{o.label}</option>)}
            </select>
        </label>
    )
}

function DocPicker({ label, kind, onAdd }: {
    label: string
    kind: DocKind
    onAdd: (kind: DocKind, f: File) => void
}) {
    return (
        <label className="border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer bg-zinc-950/40 hover:border-amber-400/40 hover:bg-zinc-950 transition-colors">
            <span className="text-sm font-medium text-zinc-200 flex-1">{label}</span>
            <input
                type="file"
                accept="image/*,application/pdf"
                onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) onAdd(kind, f)
                    e.currentTarget.value = ''
                }}
                className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-zinc-700 file:bg-zinc-800 file:text-zinc-100 file:font-semibold file:text-xs hover:file:bg-zinc-700 file:cursor-pointer"
            />
        </label>
    )
}
