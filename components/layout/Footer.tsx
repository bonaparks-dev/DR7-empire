
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-stone-900/50 border-t border-stone-800 text-stone-400">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">DR<span className="text-amber-400">7</span></h3>
            <p className="text-sm">{t('DR7_is_your_gateway_to_a_world_of_unparalleled_luxury_From_supercars_to_private_jets_we_provide_access_to_the_extraordinary').substring(0, 100)}...</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('Services')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cars" className="hover:text-amber-400 transition-colors">{t('Cars')}</Link></li>
              <li><Link to="/yachts" className="hover:text-amber-400 transition-colors">{t('Yachts')}</Link></li>
              <li><Link to="/villas" className="hover:text-amber-400 transition-colors">{t('Villas')}</Link></li>
              <li><Link to="/membership" className="hover:text-amber-400 transition-colors">{t('Membership')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('About_Us')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-amber-400 transition-colors">{t('Contact')}</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">{t('Privacy_Policy')}</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">{t('Terms_of_Service')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Follow Us</h4>
            {/* Placeholder for social icons */}
            <div className="flex space-x-4">
              <a href="#" className="hover:text-amber-400 transition-colors">IG</a>
              <a href="#" className="hover:text-amber-400 transition-colors">FB</a>
              <a href="#" className="hover:text-amber-400 transition-colors">X</a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-stone-800 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DR7. {t('All_Rights_Reserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
