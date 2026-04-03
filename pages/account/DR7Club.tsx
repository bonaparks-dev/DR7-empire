import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getUserCreditBalance, getCreditTransactions } from '../../utils/creditWallet'
import type { CreditTransaction } from '../../utils/creditWallet'
import {
  getClubStatus,
  CLUB_PLANS,
  TIER_THRESHOLDS,
  WALLET_MAX_ORDER_PERCENT,
  SIGNUP_BONUS,
  ANNUAL_RENEWAL_BONUS,
  type ClubSubscription,
  type ClubTierInfo,
} from '../../utils/dr7club'

const DR7Club = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<ClubSubscription | null>(null)
  const [tierInfo, setTierInfo] = useState<ClubTierInfo | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadClubData()
  }, [user])

  const loadClubData = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [clubStatus, balance, txns] = await Promise.all([
        getClubStatus(user.id),
        getUserCreditBalance(user.id),
        getCreditTransactions(user.id, 10),
      ])
      setSubscription(clubStatus.subscription)
      setTierInfo(clubStatus.tierInfo)
      setIsActive(clubStatus.isActive)
      setWalletBalance(balance)
      setTransactions(txns)
    } catch (err) {
      console.error('Error loading club data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setSubscribing(true)
    try {
      const planInfo = CLUB_PLANS[plan]
      const msg = `Ciao! Vorrei iscrivermi al DR7 Club - Piano ${planInfo.label} (€${planInfo.price}${planInfo.period}).\n\nNome: ${user?.fullName || ''}\nEmail: ${user?.email || ''}`
      window.open(`https://wa.me/393457905205?text=${encodeURIComponent(msg)}`, '_blank')
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Caricamento DR7 Club...</p>
      </div>
    )
  }

  const tierColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    access: { bg: 'bg-gray-800/50', border: 'border-gray-600', text: 'text-gray-300', badge: 'bg-gray-600 text-white' },
    black: { bg: 'bg-gray-900/80', border: 'border-white/30', text: 'text-white', badge: 'bg-black text-white border border-white/30' },
    signature: { bg: 'bg-[#C9A96E]/10', border: 'border-[#C9A96E]/40', text: 'text-[#D4B896]', badge: 'bg-[#C9A96E]/15 text-[#D4B896] border border-[#C9A96E]/40' },
  }

  const currentColors = tierColors[tierInfo?.tier || 'access']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">DR7 Club</h2>
          {isActive ? (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded-full">Attivo</span>
          ) : (
            <span className="px-3 py-1 bg-gray-700 text-gray-400 text-sm font-bold rounded-full">Non iscritto</span>
          )}
        </div>
        <p className="text-gray-400 text-sm">
          Guadagna fino al 4% in credito wallet su ogni noleggio. Più spendi, più guadagni.
        </p>
      </div>

      {/* Subscription Plans (if not active) */}
      {!isActive && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Iscriviti al DR7 Club</h3>
          <p className="text-gray-400 text-sm mb-6">
            Scegli il tuo piano e inizia a guadagnare credito wallet su ogni prenotazione.
            Bonus di €{SIGNUP_BONUS} alla prima iscrizione!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly */}
            <div className="border border-gray-700 rounded-lg p-5 hover:border-white/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-bold text-lg">{CLUB_PLANS.monthly.label}</h4>
                  <p className="text-gray-400 text-sm">Flessibile, senza vincoli</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">€{CLUB_PLANS.monthly.price.toFixed(2)}</span>
                  <span className="text-gray-400 text-sm">{CLUB_PLANS.monthly.period}</span>
                </div>
              </div>
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={subscribing}
                className="w-full mt-3 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Iscriviti ora
              </button>
            </div>

            {/* Annual */}
            <div className="border-2 border-[#C9A96E]/50 rounded-lg p-5 relative">
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#C9A96E] text-black text-xs font-bold rounded">RISPARMIA 33%</div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-bold text-lg">{CLUB_PLANS.annual.label}</h4>
                  <p className="text-gray-400 text-sm">+ €{ANNUAL_RENEWAL_BONUS} bonus rinnovo</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#D4B896]">€{CLUB_PLANS.annual.price}</span>
                  <span className="text-gray-400 text-sm">{CLUB_PLANS.annual.period}</span>
                </div>
              </div>
              <button
                onClick={() => handleSubscribe('annual')}
                disabled={subscribing}
                className="w-full mt-3 py-2.5 bg-[#C9A96E] text-black font-bold rounded-lg hover:bg-[#D4B896] transition-colors text-sm"
              >
                Iscriviti ora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Subscription */}
      {isActive && subscription && (
        <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Piano attivo</p>
              <p className="text-white font-bold text-lg">
                {subscription.plan === 'monthly' ? 'Mensile' : 'Annuale'} — €{subscription.price}{subscription.plan === 'monthly' ? '/mese' : '/anno'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Scade il</p>
              <p className="text-white font-medium">
                {new Date(subscription.expires_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tier & Progress */}
      {tierInfo && (
        <div className={`${currentColors.bg} border ${currentColors.border} rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${currentColors.badge}`}>
                {tierInfo.label}
              </span>
              <div>
                <p className="text-white font-bold">Livello {tierInfo.label}</p>
                <p className="text-gray-400 text-sm">Reward: {tierInfo.rewardPercent}% su ogni noleggio</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Spesa annuale</p>
              <p className="text-white font-bold text-xl">€{tierInfo.annualSpend.toLocaleString('it-IT', { minimumFractionDigits: 0 })}</p>
            </div>
          </div>

          {/* Progress bar */}
          {tierInfo.nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Livello {tierInfo.label}</span>
                <span>Livello {TIER_THRESHOLDS.find(t => t.tier === tierInfo.nextTier)?.label} (€{tierInfo.nextTierThreshold.toLocaleString()})</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-[#C9A96E] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${tierInfo.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mancano €{(tierInfo.nextTierThreshold - tierInfo.annualSpend).toLocaleString('it-IT')} per il livello successivo
              </p>
            </div>
          )}

          {!tierInfo.nextTier && (
            <p className="mt-3 text-sm text-[#D4B896] font-medium">Hai raggiunto il livello massimo! Reward del {tierInfo.rewardPercent}% su ogni noleggio.</p>
          )}
        </div>
      )}

      {/* Tiers Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Livelli DR7 Club</h3>
        <div className="grid grid-cols-3 gap-3">
          {TIER_THRESHOLDS.map(t => (
            <div
              key={t.tier}
              className={`p-4 rounded-lg border text-center ${tierInfo?.tier === t.tier
                ? `${tierColors[t.tier].border} ${tierColors[t.tier].bg}`
                : 'border-gray-700 bg-gray-800/30'}`}
            >
              <p className={`font-bold text-lg ${tierInfo?.tier === t.tier ? tierColors[t.tier].text : 'text-gray-400'}`}>
                {t.label}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {t.max === Infinity ? `da €${t.min.toLocaleString()}` : `€${t.min.toLocaleString()} – €${t.max.toLocaleString()}`}
              </p>
              <p className={`text-2xl font-bold mt-2 ${tierInfo?.tier === t.tier ? 'text-[#D4B896]' : 'text-gray-500'}`}>
                {t.rewardPercent}%
              </p>
              <p className="text-gray-500 text-xs">reward</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">DR7 Wallet</h3>
          <span className="text-2xl font-bold text-green-400">€{walletBalance.toFixed(2)}</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Utilizzabile fino al {WALLET_MAX_ORDER_PERCENT}% di un ordine. Non convertibile in denaro. Validità 12 mesi.
        </p>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Ultimi movimenti</h4>
            <div className="space-y-2">
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-white text-sm">{tx.description}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${tx.transaction_type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.transaction_type === 'credit' ? '+' : '-'}€{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Come funziona</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">+</span>
            <span>Pagamento anticipato (100%): reward base fino al {TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1].rewardPercent}%</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">+</span>
            <span>Pagamento con acconto (30%): reward dimezzato (min 1%)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">+</span>
            <span>Servizi Prime Wash: reward 3%</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">+</span>
            <span>Servizi extra: reward 2%</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4B896] mt-0.5">!</span>
            <span>Il credito viene accreditato solo a noleggio completato</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">-</span>
            <span>Non utilizzabile per cauzioni, penali, danni o franchigie</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default DR7Club
