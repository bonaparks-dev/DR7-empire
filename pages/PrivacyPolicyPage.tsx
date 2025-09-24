import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const PrivacyPolicyPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Privacy_Policy')}>
            <p><strong>Last Updated: {new Date().toLocaleDateString('en-CA')}</strong></p>
            
            <h2>1. Introduction and Data Controller</h2>
            <p>DR7 Empire ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data when you use our services. This policy is provided in compliance with the EU General Data Protection Regulation (GDPR).</p>
            <p>DR7 Empire is the Data Controller for the personal data collected through our platform and is responsible for your personal data.</p>

            <h2>2. Personal Data We Collect</h2>
            <p>We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul>
                <li><strong>Identity Data:</strong> Includes first name, last name, username, date of birth, and copies of government-issued ID (e.g., driver's license, passport) for verification.</li>
                <li><strong>Contact Data:</strong> Includes billing address, email address, and telephone numbers.</li>
                <li><strong>Financial Data:</strong> Includes payment card details or cryptocurrency wallet information.</li>
                <li><strong>Transaction Data:</strong> Includes details about payments to and from you and other details of services you have purchased through us.</li>
                <li><strong>Technical Data:</strong> Includes internet protocol (IP) address, your login data, browser type and version, and other technology on the devices you use to access our platform.</li>
            </ul>

            <h2>3. How We Use Your Personal Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul>
                <li>To perform the brokerage contract we are about to enter into or have entered into with you.</li>
                <li>To facilitate the booking and rental contract between you and the third-party asset owner.</li>
                <li>To comply with a legal or regulatory obligation (such as identity verification).</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            </ul>

            <h2>4. Disclosure of Your Personal Data</h2>
            <p>We may have to share your personal data with the parties set out below for the purposes set out in Section 3:</p>
            <ul>
                <li><strong>Third-Party Asset Owners:</strong> We will share necessary Identity, Contact, and Transaction Data with the owners of the assets you wish to book to facilitate the Rental Agreement between you and them.</li>
                <li><strong>Service Providers:</strong> We employ third-party companies for payment processing and identity verification.</li>
                <li><strong>Professional Advisers:</strong> Including lawyers, bankers, auditors, and insurers who provide consultancy, banking, legal, insurance, and accounting services.</li>
                <li><strong>Regulatory Authorities:</strong> We may be required to share your personal data with law enforcement or other authorities in Italy if required by law.</li>
            </ul>
             <p>We require all third parties to respect the security of your personal data and to treat it in accordance with the law. We do not allow our third-party service providers to use your personal data for their own purposes.</p>
            
            <h2>5. Data Security</h2>
            <p>We have put in place appropriate technical and organizational security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees and third parties who have a business need to know.</p>

            <h2>6. Your Legal Rights Under GDPR</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data. These include:</p>
            <ul>
                <li><strong>Request access</strong> to your personal data.</li>
                <li><strong>Request correction</strong> of the personal data that we hold about you.</li>
                <li><strong>Request erasure</strong> of your personal data.</li>
                <li><strong>Object to processing</strong> of your personal data.</li>
                <li><strong>Request restriction of processing</strong> of your personal data.</li>
                <li><strong>Request the transfer</strong> of your personal data to you or to a third party.</li>
                <li><strong>Withdraw consent at any time</strong> where we are relying on consent to process your personal data.</li>
            </ul>
            <p>If you wish to exercise any of these rights, please contact us. You also have the right to lodge a complaint at any time with the Italian data protection authority, the Garante per la protezione dei dati personali.</p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our privacy practices, please contact our Data Privacy Manager at: <a href="mailto:amministrazione@dr7luxuryempire.com">amministrazione@dr7luxuryempire.com</a>.</p>
        </LegalPageLayout>
    );
};

export default PrivacyPolicyPage;
