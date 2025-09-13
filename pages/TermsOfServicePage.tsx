import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const TermsOfServicePage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Terms_of_Service')}>
            <p><strong>Last Updated: {new Date().toLocaleDateString('en-CA')}</strong></p>
            
            <h2>1. Agreement to Terms</h2>
            <p>Welcome to DR7 Empire ("DR7," "we," "us," or "our"). These Terms and Conditions of Brokerage Service ("Terms") govern your use of our platform and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you are prohibited from using the Services.</p>
            <p>These Terms constitute a legally binding agreement made between you ("Client," "you") and DR7 Empire, concerning your access to and use of the DR7 platform.</p>

            <h2>2. Our Role as a Broker</h2>
            <p>DR7 provides an exclusive brokerage service, acting as an intermediary to connect you with a curated network of third-party owners and operators ("Owners") of luxury assets, including but not limited to cars, yachts, villas, and private jets ("Assets").</p>
            <p><strong>IMPORTANT:</strong> DR7 is not the owner, operator, or insurer of the Assets. Our role is strictly limited to facilitating the booking process between you and the Owner. The provision of the Asset is the sole responsibility of the Owner. Your rental or charter of an Asset will be subject to a separate, legally binding agreement between you and the respective Owner ("Rental Agreement").</p>
            
            <h2>3. User Accounts and Client Verification</h2>
            <p>To access our Services, you must be at least 25 years old and have the legal capacity to enter into binding contracts. You are required to register for an account, providing accurate and complete information. To comply with Italian and international regulations, including Anti-Money Laundering (AML) laws, we may require identity verification, including government-issued identification, before confirming high-value bookings.</p>

            <h2>4. Bookings, Payments, and Financial Terms</h2>
            <p><strong>Booking Process:</strong> A booking request submitted through our platform is an offer to rent an Asset. A booking is confirmed only upon your receipt of a formal confirmation from us and your acceptance of the Owner's Rental Agreement.</p>
            <p><strong>Payments:</strong> As an intermediary, DR7 facilitates payments from you to the Owner. You authorize us to charge your chosen payment method for the total amount of the booking, which includes the rental fee, any applicable taxes, and a security deposit. The security deposit is held and managed according to the terms of the Owner's Rental Agreement.</p>
            
            <h2>5. Role of Third-Party Owners</h2>
            <p>The Owners are independent entities and are not employees or agents of DR7. The Owners are solely responsible for:</p>
            <ul>
                <li>Ensuring the Asset is in a safe, legal, and operational condition.</li>
                <li>Providing comprehensive insurance for the Asset.</li>
                <li>Executing the final Rental Agreement with you.</li>
                <li>The delivery, management, and collection of the Asset.</li>
            </ul>
            <p>While DR7 carefully vets all Owners in its network, we do not guarantee the performance or quality of any Asset or Owner.</p>

            <h2>6. Limitation of Liability</h2>
            <p>To the fullest extent permitted by Italian law, DR7 Empire's liability is limited to its role as a brokerage service. We shall not be liable for any direct, indirect, incidental, special, or consequential damages, including but not limited to personal injury, property damage, loss of profits, or other intangible losses, resulting from:</p>
            <ul>
                <li>The condition, performance, or legality of any Asset.</li>
                <li>Any act or omission by an Owner or their staff.</li>
                <li>The terms of, or your breach of, the Rental Agreement between you and the Owner.</li>
                <li>Any disputes arising between you and an Owner.</li>
            </ul>
            <p>Our total liability in any matter arising from these Terms shall not exceed the brokerage fee we received for the specific booking in question.</p>

            <h2>7. Governing Law and Jurisdiction</h2>
            <p>These Terms and your use of the Services are governed by and construed in accordance with the laws of Italy. You irrevocably agree that the Court of Cagliari, Italy, shall have exclusive jurisdiction to settle any dispute or claim that arises out of or in connection with this agreement or its subject matter.</p>

            <h2>8. Modifications to Terms and Services</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the new Terms on our platform. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.</p>
            
            <h2>9. Contact Information</h2>
            <p>For any questions or legal notices regarding these Terms, please contact our legal department at <a href="mailto:legal@dr7.example.com">legal@dr7.example.com</a>.</p>
        </LegalPageLayout>
    );
};

export default TermsOfServicePage;