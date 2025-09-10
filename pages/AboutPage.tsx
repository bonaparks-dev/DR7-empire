import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const teamMembers = [
    {
        name: 'Cristiano DR7',
        title: 'Founder & CEO',
        image: 'https://picsum.photos/seed/ceo-portrait-male/400/400',
        bio: 'A visionary entrepreneur with a passion for high-end engineering and exclusive experiences, Cristiano founded DR7 to redefine the boundaries of luxury lifestyle services.'
    },
    {
        name: 'Elena Rossi',
        title: 'Head of Operations',
        image: 'https://picsum.photos/seed/operations-head-female/400/400',
        bio: 'Elena ensures that every aspect of the DR7 experience is seamless and exceeds client expectations, from booking to final delivery.'
    },
    {
        name: 'Marco Bianchi',
        title: 'Lead Concierge',
        image: 'https://picsum.photos/seed/concierge-lead-male/400/400',
        bio: 'Marco and his team are the magicians behind the scenes, dedicated to fulfilling every client request with unmatched precision and care.'
    },
    {
        name: 'Giulia Conti',
        title: 'Fleet Manager',
        image: 'https://picsum.photos/seed/fleet-manager-female/400/400',
        bio: 'Giulia meticulously curates and maintains our world-class fleet, ensuring every asset is in pristine condition for our clients.'
    }
];

const TeamMemberCard: React.FC<typeof teamMembers[0]> = ({ name, title, image, bio }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden group transition-all duration-300 hover:border-white/50 hover:shadow-2xl hover:shadow-white/10 text-center p-6"
    >
        <img src={image} alt={name} className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-700 group-hover:border-white transition-colors duration-300" />
        <h3 className="text-xl font-bold text-white mt-4">{name}</h3>
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-gray-400 text-sm mt-2">{bio}</p>
    </motion.div>
);

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero Section */}
            <div className="relative h-[50vh] flex items-center justify-center text-center overflow-hidden pt-20">
                <div className="absolute inset-0 z-0">
                    <img src="https://picsum.photos/seed/luxury-office-view/1920/1080" alt="DR7 Office" className="w-full h-full object-cover brightness-50" />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>
                <div className="relative z-10 px-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-6xl font-black text-white uppercase tracking-wider"
                    >
                        {t('The_Visionaries_Behind_Luxury')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg md:text-xl font-light text-gray-300 mt-2 max-w-2xl mx-auto"
                    >
                        {t('Meet_the_team')}
                    </motion.p>
                </div>
            </div>

            {/* Mission Section */}
            <section className="py-20 bg-black">
                <div className="container mx-auto px-6 text-center max-w-3xl">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold text-white mb-4">{t('Our_Mission')}</motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg text-gray-300 leading-relaxed"
                    >
                        {t('Our_Mission_Statement')}
                    </motion.p>
                </div>
            </section>
            
            {/* Team Section */}
            <section className="py-20 bg-gray-900/40">
                <div className="container mx-auto px-6">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold text-white text-center mb-12"
                    >
                        {t('Meet_the_Team')}
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((member, index) => (
                            <TeamMemberCard key={index} {...member} />
                        ))}
                    </div>
                </div>
            </section>

             {/* Careers CTA */}
            <section className="py-24 relative bg-black">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold text-white">{t('Join_Our_Team')}</motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">{t('Join_Our_Team_Statement')}</motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8"
                    >
                        <Link to="/careers" className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                            {t('View_Openings')}
                        </Link>
                    </motion.div>
                </div>
            </section>

        </motion.div>
    );
};

export default AboutPage;