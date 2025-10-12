import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

interface Article {
    title: string;
    publication: string;
    date: string;
    summary: string;
    link: string;
    image?: string;
}

const articles: Article[] = [
    {
        title: "Dubai Rent 7.0: la startup sarda che insegue Elon Musk (e punta a superarlo)",
        publication: "Casteddu Online",
        date: "16 Giugno 2025",
        summary: "Nata da zero nel 2024, già S.p.A. in 12 mesi. Ora prepara l'espansione globale e una holding da €500 miliardi entro il 2030.",
        link: "https://www.castedduonline.it/dubai-rent-7-0-la-startup-sarda-che-insegue-elon-musk-e-punta-a-superarlo/",
        image: "/press/article1.jpeg"
    },
    {
        title: "DR7 Empire: Luxury Redefined",
        publication: "Luxury Magazine",
        date: "March 2025",
        summary: "An innovative approach to luxury rentals and lifestyle services, setting new standards in the industry.",
        link: "#",
        image: "/press/article2.jpeg"
    },
    {
        title: "The Future of Luxury Travel",
        publication: "Travel Insider",
        date: "February 2025",
        summary: "How DR7 Empire is revolutionizing the luxury travel experience with cutting-edge technology and personalized service.",
        link: "#",
        image: "/press/article3.jpeg"
    }
];

const PressPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-black pt-32 pb-24">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        {t('Press')}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Discover the latest news, features, and press releases about DR7 Empire
                    </p>
                </motion.div>

                {/* Media Inquiries */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-16"
                >
                    <h2 className="text-3xl font-bold text-white mb-4">Media Inquiries</h2>
                    <p className="text-gray-300 mb-4">
                        For all media inquiries, interviews, or other press-related matters, please contact our media relations team.
                        We are happy to provide information about our company, services, and vision for the future of luxury.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Email:</span>
                        <a
                            href="mailto:support@dr7empire.com"
                            className="text-white hover:text-gray-300 transition-colors font-semibold"
                        >
                            support@dr7empire.com
                        </a>
                    </div>
                </motion.div>

                {/* In the News */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-16"
                >
                    <h2 className="text-4xl font-bold text-white mb-8">In the News</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, index) => (
                            <motion.article
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 * (index + 3) }}
                                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300 group"
                            >
                                {article.image && (
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                                    </div>
                                )}

                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                        <span className="font-semibold">{article.publication}</span>
                                        <span>•</span>
                                        <span>{article.date}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gray-300 transition-colors">
                                        {article.title}
                                    </h3>

                                    <p className="text-gray-400 mb-4 line-clamp-3">
                                        {article.summary}
                                    </p>

                                    <a
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-white hover:text-gray-300 transition-colors font-semibold group/link"
                                    >
                                        {t('Read_full_article')}
                                        <span className="ml-2 group-hover/link:translate-x-1 transition-transform">→</span>
                                    </a>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </motion.div>

                {/* Press Releases */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8"
                >
                    <h2 className="text-3xl font-bold text-white mb-4">Press Releases</h2>
                    <p className="text-gray-400">
                        For more information about our latest announcements and achievements, please contact our media relations team.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default PressPage;
