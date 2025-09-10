import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { InstagramIcon, FacebookIcon, TwitterIcon, YoutubeIcon, TiktokIcon } from '../icons/Icons';
import GoogleReviews from '../ui/GoogleReviews';

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
    <footer className="bg-gray-900/50 border-t border-gray-800 text-gray-400">
      <div className="container mx-auto px-6 py-12">
        {/* Top Section: Social & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12 pb-12 border-b border-gray-800">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('Stay_Connected')}</h3>
            <p className="text-sm mb-4">{t('Receive_exclusive_offers_and_fleet_updates')}</p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/dubai_rent_7.0_luxury_empire/" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <InstagramIcon className="w-7 h-7" />
              </a>
              <a href="#" aria-label="Tiktok" className="text-gray-400 hover:text-white transition-colors">
                <TiktokIcon className="w-7 h-7" />
              </a>
              {/* Optional: keep others if you need them */}
              {/* <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors"><FacebookIcon className="w-7 h-7" /></a> */}
              {/* <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors"><TwitterIcon className="w-7 h-7" /></a> */}
              {/* <a href="#" aria-label="YouTube" className="text-gray-400 hover:text-white transition-colors"><YoutubeIcon className="w-7 h-7" /></a> */}
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="flex items-center w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Email_Address')}
              className="w-full bg-gray-800 border-gray-700 rounded-l-full py-3 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
              required
            />
            <button type="submit" className="bg-white text-black font-bold rounded-r-full py-3 px-6 hover:bg-gray-200 transition-colors shrink-0">
              {t('Subscribe')}
            </button>
          </form>
        </div>

        {/* Reviews Section */}
        <div className="mb-12 pb-12 border-b border-gray-800">
          <GoogleReviews />
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-white mb-4">{t('DR7_Empire')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">{t('About_Us')}</Link></li>
              <li><Link to="/press" className="hover:text-white transition-colors">{t('Press')}</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">{t('Careers')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('Legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-white transition-colors">{t('Terms_of_Service')}</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">{t('Privacy_Policy')}</Link></li>
              <li><Link to="/rental-agreement" className="hover:text-white transition-colors">{t('Rental_Agreement')}</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-white transition-colors">{t('Cookie_Policy')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('Support')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-white transition-colors">{t('FAQ')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('Contact')}</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('Contact_Concierge')}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="mt-12 pt-8 text-center">
          <Link to="/" className="mb-4 inline-block">
            <img src="/DR7logo.png" alt="DR7 Empire Logo" className="h-12 w-auto mx-auto" />
          </Link>
          <p className="text-sm">&copy; {new Date().getFullYear()} DR7 Empire. {t('All_Rights_Reserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
