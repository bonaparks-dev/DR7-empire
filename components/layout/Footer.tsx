import React from 'react';
import { Link } from 'react-router-dom';
import ReviewsSection from '../../sections/ReviewsSection';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-black border-t border-gray-900 text-gray-400">
      <div className="container mx-auto px-6 py-12">
        {/* Top Section: Social */}
        <div className="mb-12 pb-12 border-b border-gray-900 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Join the DR7 Network</h3>
          <p className="text-sm mb-4">Entra nel nostro ecosistema globale e segui i nostri canali social per contenuti esclusivi e aggiornamenti dal mondo DR7 Cagliari.</p>
          <div className="flex justify-center space-x-4">
            <a href="https://www.instagram.com/dubai_rent_7.0_s_p_a_" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@dr7luxuryempire" aria-label="Tiktok" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
            </a>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12 pb-12 border-b border-gray-900">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">A Global Standard of Excellence</h3>
            <p className="text-sm text-gray-400">DR7 Cagliari mantiene un rating impeccabile di 5.0/5.0 su quasi 300 recensioni verificate, confermandosi un punto di riferimento nel settore della luxury mobility.</p>
          </div>
          <ReviewsSection />
        </div>

        {/* Contact Section */}
        <div className="text-center mb-12 pb-12 border-b border-gray-900">
          <h3 className="text-2xl font-bold text-white mb-6">Contact</h3>
          <a
            href="https://wa.me/393457905205"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 text-lg text-gray-300 hover:text-white transition-colors group mb-6"
            aria-label="Contact us on WhatsApp"
          >
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="font-semibold tracking-wider">+39 345 790 5205</span>
          </a>

          <div className="mt-8 text-sm text-gray-400 max-w-2xl mx-auto space-y-1 px-4">
            <p className="font-semibold text-white">Dubai Rent 7.0 S.p.A.</p>
            <p className="break-words">Sede Legale: Via del Fangario 25, 09122 Cagliari (CA) – Italia</p>
            <p className="break-words">Capitale Sociale: € 50.000 i.v. (in aumento)</p>
            <p className="break-words">P.IVA / C.F.: 04104640927</p>
            <p className="text-xs mt-2 break-words">
              Società soggetta a direzione e coordinamento della<br />
              DR7 Group S.p.A.
            </p>
          </div>
        </div>

        {/* Division Links */}
        <div className="flex flex-col items-center justify-center gap-4 text-sm my-8">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <li><Link to="/supercar-luxury" className="hover:text-white transition-colors font-semibold">Supercar & Luxury Division</Link></li>
            <li><Link to="/prime-wash" className="hover:text-white transition-colors font-semibold">Prime Wash</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors font-semibold">Contattaci</Link></li>
          </ul>
        </div>

        {/* Corporate & Legal Links */}
        <div className="flex flex-col items-center justify-center gap-4 text-sm my-8">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <li><Link to="/about" className="hover:text-white transition-colors">Corporate Overview</Link></li>
            <li><Link to="/press" className="hover:text-white transition-colors">Press & Media</Link></li>
            <li><Link to="/careers" className="hover:text-white transition-colors">Careers & Opportunities</Link></li>
          </ul>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/cancellation-policy" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
          </ul>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="mt-12 pt-8 text-center border-t border-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link to="/" className="inline-block">
              <img src="/DR7logo1.png" alt="DR7 Cagliari Logo" className="h-12 w-auto mx-auto" />
            </Link>
            <div className="text-sm order-last md:order-none text-center">
              <p className="font-semibold text-white mb-1">DR7 Cagliari – Global Mobility & Luxury Lifestyle Group</p>
              <p>&copy; 2024 - 2026 DR7 Cagliari. All Rights Reserved.</p>
            </div>
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