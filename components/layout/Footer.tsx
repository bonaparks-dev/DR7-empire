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
          <p className="text-sm mb-4">Entra nel nostro ecosistema globale e segui i nostri canali social per contenuti esclusivi e aggiornamenti dal mondo DR7 Empire.</p>
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
            <p className="text-sm text-gray-400">DR7 Empire mantiene un rating impeccabile di 5.0/5.0 su oltre 250 recensioni verificate, confermandosi un punto di riferimento nel settore della luxury mobility.</p>
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
            <li><Link to="/urban" className="hover:text-white transition-colors font-semibold">Urban Division</Link></li>
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
            <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/cancellation-policy" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
          </ul>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="mt-12 pt-8 text-center border-t border-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link to="/" className="inline-block">
              <img src="/DR7logo1.png" alt="DR7 Empire Logo" className="h-12 w-auto mx-auto" />
            </Link>
            <div className="text-sm order-last md:order-none text-center">
              <p className="font-semibold text-white mb-1">DR7 Empire – Global Mobility & Luxury Lifestyle Group</p>
              <p>&copy; 2024 - 2026 DR7 Empire. All Rights Reserved.</p>
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