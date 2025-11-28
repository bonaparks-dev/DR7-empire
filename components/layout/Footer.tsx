import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { InstagramIcon, FacebookIcon, TwitterIcon, YoutubeIcon, TiktokIcon, WhatsAppIcon } from '../icons/Icons';
import ReviewsSection from '../../sections/ReviewsSection';

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-black border-t border-gray-900 text-gray-400">
      <div className="container mx-auto px-6 py-12">
        {/* Top Section: Social & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12 pb-12 border-b border-gray-900">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('Stay_Connected')}</h3>
            <p className="text-sm mb-4">{t('Receive_exclusive_offers_and_fleet_updates')}</p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/dubai_rent_7.0_s_p_a_" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <InstagramIcon className="w-7 h-7" />
              </a>
              <a href="https://www.tiktok.com/@dr7luxuryempire" aria-label="Tiktok" className="text-gray-400 hover:text-white transition-colors">
                <TiktokIcon className="w-7 h-7" />
              </a>
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="flex items-center w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Email_Address')}
              className="w-full bg-gray-900 border border-gray-800 rounded-l-full py-3 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
              required
            />
            <button type="submit" className="bg-gray-800 text-white font-bold rounded-r-full py-3 px-6 hover:bg-gray-700 transition-colors shrink-0">
              {t('Subscribe')}
            </button>
          </form>
        </div>

        {/* Reviews Section */}
        <div className="mb-12 pb-12 border-b border-gray-900">
          <ReviewsSection />
        </div>

        {/* Contact Section */}
        <div className="text-center mb-12 pb-12 border-b border-gray-900">
          <h3 className="text-2xl font-bold text-white mb-4">{t('Contact')}</h3>
          <a
            href="https://wa.me/393457905205"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 text-lg text-gray-300 hover:text-white transition-colors group"
            aria-label="Contact us on WhatsApp"
          >
            <WhatsAppIcon className="w-8 h-8" />
            <span className="font-semibold tracking-wider">+39 345 790 5205</span>
          </a>
        </div>

        {/* Middle Section: Links */}
        <div className="flex flex-col items-center justify-center gap-4 text-sm my-8">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <li><Link to="/cars" className="hover:text-white transition-colors">{t('Exotic_Supercars')}</Link></li>
            <li><Link to="/urban-cars" className="hover:text-white transition-colors">{t('Urban_Cars')}</Link></li>
            <li><Link to="/yachts" className="hover:text-white transition-colors">{t('Yachts')}</Link></li>
            <li><Link to="/jets" className="hover:text-white transition-colors">{t('Jets')}</Link></li>
            <li><Link to="/helicopters" className="hover:text-white transition-colors">{t('Helicopters')}</Link></li>
            <li><Link to="/car-wash-services" className="hover:text-white transition-colors">{t('Luxury_Wash')}</Link></li>
            <li><Link to="/mechanical-services" className="hover:text-white transition-colors">{t('Rapid_Service')}</Link></li>
            <li><Link to="/membership" className="hover:text-white transition-colors">{t('Members')}</Link></li>
          </ul>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <li><Link to="/commercial-operation" className="hover:text-white transition-colors">{t('LOTTERIA')}</Link></li>
            <li><Link to="/franchising" className="hover:text-white transition-colors">{t('Franchising')}</Link></li>
            <li><Link to="/investitori" className="hover:text-white transition-colors">Investitori</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">{t('About_Us')}</Link></li>
            <li><Link to="/press" className="hover:text-white transition-colors">{t('Press')}</Link></li>
            <li><Link to="/careers" className="hover:text-white transition-colors">{t('Careers')}</Link></li>
          </ul>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <li><Link to="/cookie-policy" className="hover:text-white transition-colors">{t('Cookie_Policy')}</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">{t('Privacy_Policy')}</Link></li>
            <li><Link to="/cancellation-policy" className="hover:text-white transition-colors">Politica di Cancellazione</Link></li>
          </ul>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="mt-12 pt-8 text-center border-t border-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link to="/" className="inline-block">
              <img src="/DR7logo.png" alt="DR7 Empire Logo" className="h-12 w-auto mx-auto" />
            </Link>
            <p className="text-sm order-last md:order-none">&copy; {new Date().getFullYear()} DR7 Empire. {t('All_Rights_Reserved')}</p>
            <button
                onClick={scrollToTop}
                className="text-sm font-semibold hover:text-white transition-colors flex items-center gap-1"
                aria-label="Back to top"
            >
                Back to Top
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;