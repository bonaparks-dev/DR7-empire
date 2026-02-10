import { useState } from 'react'

interface CustomerFormData {
  tipoCliente: 'azienda' | 'persona_fisica' | 'pubblica_amministrazione' | ''
  // Azienda fields
  nazione: string
  denominazione: string
  partitaIVA: string
  codiceFiscale: string
  indirizzo: string
  // Persona Fisica fields
  nome: string
  cognome: string
  telefono: string
  email: string
  pec: string
  // Pubblica Amministrazione fields
  codiceUnivoco: string
  enteUfficio: string
  citta: string
}

interface DynamicCustomerFormProps {
  onSubmit: (data: CustomerFormData) => void
  isAdminMode?: boolean
}

export default function DynamicCustomerForm({ onSubmit, isAdminMode = false }: DynamicCustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    tipoCliente: '',
    nazione: 'Italia',
    denominazione: '',
    partitaIVA: '',
    codiceFiscale: '',
    indirizzo: '',
    nome: '',
    cognome: '',
    telefono: '',
    email: '',
    pec: '',
    codiceUnivoco: '',
    enteUfficio: '',
    citta: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // Search/Lookup functions (to be implemented with actual API calls)
  const cercaPerDenominazione = async () => {
    console.log('Searching for:', formData.denominazione)
    // TODO: Implement actual search logic
    alert('Funzione di ricerca per denominazione - da implementare')
  }

  const cercaPerPartitaIVA = async () => {
    console.log('Searching for Partita IVA:', formData.partitaIVA)
    // TODO: Implement actual search logic
    alert('Funzione di ricerca per Partita IVA - da implementare')
  }

  const cercaPerCodiceUnivoco = async () => {
    console.log('Searching for Codice Univoco:', formData.codiceUnivoco)
    // TODO: Implement actual search logic
    alert('Funzione di ricerca per Codice Univoco - da implementare')
  }

  const cercaPerCodiceFiscale = async () => {
    console.log('Searching for Codice Fiscale:', formData.codiceFiscale)
    // TODO: Implement actual search logic
    alert('Funzione di ricerca per Codice Fiscale - da implementare')
  }

  const cercaPerEnteUfficio = async () => {
    console.log('Searching for Ente/Ufficio:', formData.enteUfficio)
    // TODO: Implement actual search logic
    alert('Funzione di ricerca per Ente o Ufficio - da implementare')
  }

  const cercaPerCitta = async () => {
    console.log('Searching for Città:', formData.citta)
    // TODO: Implement actual search logic
    alert('Funzione di ricerca per Città - da implementare')
  }

  return (
    <div className="dynamic-customer-form-container">
      <style>{`
        .dynamic-customer-form-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .form-title {
          color: #f4c430;
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 2rem;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          color: #fff;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .form-label.required::after {
          content: ' *';
          color: #ff4444;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(244, 196, 48, 0.3);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #f4c430;
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 3px rgba(244, 196, 48, 0.1);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .input-with-button {
          display: flex;
          gap: 0.75rem;
        }

        .input-with-button .form-input {
          flex: 1;
        }

        .btn-search {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #f4c430 0%, #d4a420 100%);
          color: #000;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          font-size: 0.9rem;
        }

        .btn-search:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 196, 48, 0.4);
        }

        .btn-search:active {
          transform: translateY(0);
        }

        .btn-submit {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #f4c430 0%, #d4a420 100%);
          color: #000;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 2rem;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(244, 196, 48, 0.5);
        }

        .btn-submit:active {
          transform: translateY(0);
        }

        .section-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #f4c430 50%, transparent 100%);
          margin: 2rem 0;
        }

        .optional-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(244, 196, 48, 0.05);
          border: 1px dashed rgba(244, 196, 48, 0.3);
          border-radius: 8px;
        }

        .optional-section-title {
          color: #f4c430;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .form-section {
          animation: fadeIn 0.3s ease-in-out;
        }

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

        @media (max-width: 768px) {
          .dynamic-customer-form-container {
            padding: 1.5rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .input-with-button {
            flex-direction: column;
          }

          .btn-search {
            width: 100%;
          }
        }

        /* Dark theme adjustments for admin panel */
        ${isAdminMode ? `
          .dynamic-customer-form-container {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          }
        ` : ''}
      `}</style>

      <h2 className="form-title">
        {isAdminMode ? 'Crea Nuovo Cliente' : 'Registrazione Cliente'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Client Type Selection */}
        <div className="form-group">
          <label className="form-label required" htmlFor="tipoCliente">
            Tipo Cliente
          </label>
          <select
            id="tipoCliente"
            name="tipoCliente"
            className="form-select"
            value={formData.tipoCliente}
            onChange={handleChange}
            required
          >
            <option value="">Seleziona tipo cliente...</option>
            <option value="azienda">Azienda</option>
            <option value="persona_fisica">Persona Fisica</option>
            <option value="pubblica_amministrazione">Pubblica Amministrazione</option>
          </select>
        </div>

        {/* AZIENDA CONFIGURATION */}
        {formData.tipoCliente === 'azienda' && (
          <div className="form-section">
            <div className="section-divider"></div>

            {/* Nazione */}
            <div className="form-group">
              <label className="form-label required" htmlFor="nazione">
                Nazione
              </label>
              <input
                type="text"
                id="nazione"
                name="nazione"
                className="form-input"
                value={formData.nazione}
                onChange={handleChange}
                required
              />
            </div>

            {/* Denominazione */}
            <div className="form-group">
              <label className="form-label required" htmlFor="denominazione">
                Denominazione
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="denominazione"
                  name="denominazione"
                  className="form-input"
                  value={formData.denominazione}
                  onChange={handleChange}
                  placeholder="Nome azienda"
                  required
                />
                <button
                  type="button"
                  className="btn-search"
                  onClick={cercaPerDenominazione}
                >
                  Cerca
                </button>
              </div>
            </div>

            {/* Partita IVA */}
            <div className="form-group">
              <label className="form-label required" htmlFor="partitaIVA">
                Partita IVA
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="partitaIVA"
                  name="partitaIVA"
                  className="form-input"
                  value={formData.partitaIVA}
                  onChange={handleChange}
                  placeholder="IT12345678901"
                  required
                />
                <button
                  type="button"
                  className="btn-search"
                  onClick={cercaPerPartitaIVA}
                >
                  Cerca
                </button>
              </div>
            </div>

            {/* Codice Fiscale */}
            <div className="form-group">
              <label className="form-label required" htmlFor="codiceFiscale">
                Codice Fiscale
              </label>
              <input
                type="text"
                id="codiceFiscale"
                name="codiceFiscale"
                className="form-input"
                value={formData.codiceFiscale}
                onChange={handleChange}
                placeholder="00000000000"
                required
              />
            </div>

            {/* Indirizzo */}
            <div className="form-group">
              <label className="form-label required" htmlFor="indirizzo">
                Indirizzo
              </label>
              <input
                type="text"
                id="indirizzo"
                name="indirizzo"
                className="form-input"
                value={formData.indirizzo}
                onChange={handleChange}
                placeholder="Via, Numero Civico, CAP, Città"
                required
              />
            </div>

            {/* Optional Fields Section */}
            <div className="optional-section">
              <h3 className="optional-section-title">Campi Facoltativi</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                Sezione riservata per campi aggiuntivi futuri
              </p>
            </div>
          </div>
        )}

        {/* PERSONA FISICA CONFIGURATION */}
        {formData.tipoCliente === 'persona_fisica' && (
          <div className="form-section">
            <div className="section-divider"></div>

            {/* Nazione */}
            <div className="form-group">
              <label className="form-label required" htmlFor="nazione">
                Nazione
              </label>
              <input
                type="text"
                id="nazione"
                name="nazione"
                className="form-input"
                value={formData.nazione}
                onChange={handleChange}
                required
              />
            </div>

            {/* Nome */}
            <div className="form-group">
              <label className="form-label required" htmlFor="nome">
                Nome
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                className="form-input"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Mario"
                required
              />
            </div>

            {/* Cognome */}
            <div className="form-group">
              <label className="form-label required" htmlFor="cognome">
                Cognome
              </label>
              <input
                type="text"
                id="cognome"
                name="cognome"
                className="form-input"
                value={formData.cognome}
                onChange={handleChange}
                placeholder="Rossi"
                required
              />
            </div>

            {/* Codice Fiscale */}
            <div className="form-group">
              <label className="form-label required" htmlFor="codiceFiscale">
                Codice Fiscale
              </label>
              <input
                type="text"
                id="codiceFiscale"
                name="codiceFiscale"
                className="form-input"
                value={formData.codiceFiscale}
                onChange={handleChange}
                placeholder="RSSMRA80A01H501U"
                required
              />
            </div>

            {/* Indirizzo */}
            <div className="form-group">
              <label className="form-label required" htmlFor="indirizzo">
                Indirizzo
              </label>
              <input
                type="text"
                id="indirizzo"
                name="indirizzo"
                className="form-input"
                value={formData.indirizzo}
                onChange={handleChange}
                placeholder="Via, Numero Civico, CAP, Città"
                required
              />
            </div>

            {/* Optional Fields Section */}
            <div className="optional-section">
              <h3 className="optional-section-title">Campi Facoltativi</h3>

              {/* Telefono */}
              <div className="form-group">
                <label className="form-label" htmlFor="telefono">
                  Telefono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  className="form-input"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+39 123 456 7890"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@esempio.it"
                />
              </div>

              {/* PEC */}
              <div className="form-group">
                <label className="form-label" htmlFor="pec">
                  PEC
                </label>
                <input
                  type="email"
                  id="pec"
                  name="pec"
                  className="form-input"
                  value={formData.pec}
                  onChange={handleChange}
                  placeholder="pec@pec.it"
                />
              </div>
            </div>
          </div>
        )}

        {/* PUBBLICA AMMINISTRAZIONE CONFIGURATION */}
        {formData.tipoCliente === 'pubblica_amministrazione' && (
          <div className="form-section">
            <div className="section-divider"></div>

            {/* Codice Univoco */}
            <div className="form-group">
              <label className="form-label required" htmlFor="codiceUnivoco">
                Codice Univoco
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="codiceUnivoco"
                  name="codiceUnivoco"
                  className="form-input"
                  value={formData.codiceUnivoco}
                  onChange={handleChange}
                  placeholder="XXXXXX"
                  required
                />
                <button
                  type="button"
                  className="btn-search"
                  onClick={cercaPerCodiceUnivoco}
                >
                  Cerca
                </button>
              </div>
            </div>

            {/* Codice Fiscale */}
            <div className="form-group">
              <label className="form-label required" htmlFor="codiceFiscale">
                Codice Fiscale
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="codiceFiscale"
                  name="codiceFiscale"
                  className="form-input"
                  value={formData.codiceFiscale}
                  onChange={handleChange}
                  placeholder="00000000000"
                  required
                />
                <button
                  type="button"
                  className="btn-search"
                  onClick={cercaPerCodiceFiscale}
                >
                  Cerca
                </button>
              </div>
            </div>

            {/* Ente o Ufficio */}
            <div className="form-group">
              <label className="form-label required" htmlFor="enteUfficio">
                Ente o Ufficio
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="enteUfficio"
                  name="enteUfficio"
                  className="form-input"
                  value={formData.enteUfficio}
                  onChange={handleChange}
                  placeholder="Nome dell'ente o ufficio"
                  required
                />
                <button
                  type="button"
                  className="btn-search"
                  onClick={cercaPerEnteUfficio}
                >
                  Cerca
                </button>
              </div>
            </div>

            {/* Città */}
            <div className="form-group">
              <label className="form-label required" htmlFor="citta">
                Città
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="citta"
                  name="citta"
                  className="form-input"
                  value={formData.citta}
                  onChange={handleChange}
                  placeholder="Cagliari"
                  required
                />
                <button
                  type="button"
                  className="btn-search"
                  onClick={cercaPerCitta}
                >
                  Cerca
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {formData.tipoCliente && (
          <button type="submit" className="btn-submit">
            {isAdminMode ? 'Crea Cliente' : 'Registrati'}
          </button>
        )}
      </form>
    </div>
  )
}
