import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { InstagramIcon, FacebookIcon, TwitterIcon, YoutubeIcon } from '../icons/Icons';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Subscribed with ${email}`);
      setEmail('');
    }
  };

  return (
    <footer className="bg-stone-900/50 border-t border-stone-800 text-stone-400">
      <div className="container mx-auto px-6 py-12">
        {/* Top Section: Social & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12 pb-12 border-b border-stone-800">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('Stay_Connected')}</h3>
            <p className="text-sm mb-4">{t('Receive_exclusive_offers_and_fleet_updates')}</p>
            <div className="flex space-x-4">
              <a href="#" aria-label="Instagram" className="text-stone-400 hover:text-amber-400 transition-colors"><InstagramIcon className="w-7 h-7" /></a>
              <a href="#" aria-label="Facebook" className="text-stone-400 hover:text-amber-400 transition-colors"><FacebookIcon className="w-7 h-7" /></a>
              <a href="#" aria-label="Twitter" className="text-stone-400 hover:text-amber-400 transition-colors"><TwitterIcon className="w-7 h-7" /></a>
              <a href="#" aria-label="YouTube" className="text-stone-400 hover:text-amber-400 transition-colors"><YoutubeIcon className="w-7 h-7" /></a>
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="flex items-center w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Email_Address')}
              className="w-full bg-stone-800 border-stone-700 rounded-l-full py-3 px-6 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            />
            <button type="submit" className="bg-amber-400 text-black font-bold rounded-r-full py-3 px-6 hover:bg-amber-300 transition-colors shrink-0">
              {t('Subscribe')}
            </button>
          </form>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-white mb-4">{t('DR7_Empire')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-amber-400 transition-colors">{t('About_Us')}</Link></li>
              <li><Link to="/press" className="hover:text-amber-400 transition-colors">{t('Press')}</Link></li>
              <li><Link to="/careers" className="hover:text-amber-400 transition-colors">{t('Careers')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('Legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-amber-400 transition-colors">{t('Terms_of_Service')}</Link></li>
              <li><Link to="/privacy" className="hover:text-amber-400 transition-colors">{t('Privacy_Policy')}</Link></li>
              <li><Link to="/rental-agreement" className="hover:text-amber-400 transition-colors">{t('Rental_Agreement')}</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-amber-400 transition-colors">{t('Cookie_Policy')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('Support')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-amber-400 transition-colors">{t('FAQ')}</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">{t('Contact')}</Link></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">{t('Contact_Concierge')}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="mt-12 pt-8 text-center">
            <Link to="/" className="text-3xl font-bold tracking-wider text-white mb-4 inline-block">
                DR<span className="text-amber-400">7</span>
            </Link>
            <p className="text-sm">&copy; {new Date().getFullYear()} DR7 Empire. {t('All_Rights_Reserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;