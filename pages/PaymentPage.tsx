import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

type PayState = 'loading' | 'ready' | 'checking' | 'blocked' | 'confirming' | 'success' | 'error' | 'cancelled'

const ADMIN_BASE = 'https://admin.dr7empire.com'

export default function PaymentPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const securityToken = searchParams.get('securityToken')
  const orderId = searchParams.get('orderId')

  const [state, setState] = useState<PayState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const sdkLoaded = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId || !securityToken || !orderId) {
      setState('error')
      setErrorMsg('Link di pagamento non valido.')
      return
    }

    // Load Nexi XPay Build SDK
    if (sdkLoaded.current) return
    sdkLoaded.current = true

    const script = document.createElement('script')
    script.src = 'https://xpay.nexigroup.com/build/runtime/main-build.js'
    script.async = true
    script.onload = () => {
      initNexiSdk()
    }
    script.onerror = () => {
      setState('error')
      setErrorMsg('Errore caricamento sistema di pagamento. Riprova.')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup SDK if needed
    }
  }, [sessionId, securityToken, orderId])

  function initNexiSdk() {
    const XPay = (window as any).XPay
    if (!XPay) {
      setState('error')
      setErrorMsg('Sistema di pagamento non disponibile.')
      return
    }

    try {
      XPay.init({
        baseConfig: {
          apiKey: sessionId!,
          environment: 'PROD',
        },
        paymentParams: {
          securityToken: securityToken!,
        },
        customConfig: {
          targetElement: '#nexi-payment-container',
          showCloseButton: false,
          language: 'ita',
        },
        onPaymentStarted: () => {
          console.log('[PaymentPage] Payment started')
          setState('checking')
        },
        onPaymentComplete: async (result: any) => {
          console.log('[PaymentPage] Payment complete:', result)

          // Check card before confirming
          try {
            setState('checking')
            const res = await fetch(`${ADMIN_BASE}/.netlify/functions/nexi-check-card`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, orderId }),
            })
            const data = await res.json()

            if (!data.allowed) {
              setState('blocked')
              setErrorMsg(data.message || 'Le carte prepagate non sono accettate.')
              return
            }

            setState('success')
            // Redirect to success page after short delay
            setTimeout(() => {
              window.location.href = `/payment-success?order=${orderId}`
            }, 2000)
          } catch (e: any) {
            console.error('[PaymentPage] Check card error:', e)
            setState('error')
            setErrorMsg('Errore verifica pagamento. Contatta il supporto.')
          }
        },
        onPaymentError: (error: any) => {
          console.error('[PaymentPage] Payment error:', error)
          setState('error')
          setErrorMsg('Errore durante il pagamento. Riprova.')
        },
        onPaymentCancelled: () => {
          setState('cancelled')
        },
      })

      setState('ready')
    } catch (e: any) {
      console.error('[PaymentPage] SDK init error:', e)
      setState('error')
      setErrorMsg('Errore inizializzazione pagamento.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4">
      {/* DR7 Logo */}
      <div className="mb-8 text-center">
        <img src="/DR7logo1.png" alt="DR7" className="h-12 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Pagamento Sicuro</p>
      </div>

      <div className="bg-[#1a1a2e] rounded-2xl max-w-lg w-full p-6 border border-gray-700 shadow-2xl">

        {state === 'loading' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Caricamento sistema di pagamento...</p>
          </div>
        )}

        {state === 'ready' && (
          <>
            <h2 className="text-xl font-bold text-white mb-4 text-center">Completa il Pagamento</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Inserisci i dati della tua carta di credito o debito.</p>
            <p className="text-red-400 text-xs text-center mb-4">Le carte prepagate non sono accettate.</p>
            <div id="nexi-payment-container" ref={containerRef} className="min-h-[300px]"></div>
          </>
        )}

        {state === 'checking' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white font-semibold">Verifica in corso...</p>
            <p className="text-gray-400 text-sm mt-2">Stiamo verificando il metodo di pagamento.</p>
          </div>
        )}

        {state === 'blocked' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Metodo non accettato</h3>
            <p className="text-gray-300 text-sm mb-4">{errorMsg}</p>
            <p className="text-gray-400 text-xs">Utilizza una carta di credito o debito per completare il pagamento.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-white text-black rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Riprova con altra carta
            </button>
          </div>
        )}

        {state === 'success' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Pagamento Confermato</h3>
            <p className="text-gray-400 text-sm">Reindirizzamento in corso...</p>
          </div>
        )}

        {state === 'cancelled' && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-gray-400 mb-2">Pagamento Annullato</h3>
            <p className="text-gray-500 text-sm mb-4">Il pagamento è stato annullato.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-black rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Riprova
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Errore</h3>
            <p className="text-gray-400 text-sm">{errorMsg}</p>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-6 text-center">
        Pagamento sicuro tramite Nexi XPay · DR7 Empire
      </p>
    </div>
  )
}
