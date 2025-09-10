import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const CookiePolicyPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Cookie_Policy')}>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>

            <h2>1. What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your computer, smartphone, or other device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. Cookies help us remember your preferences and understand how you use our site, which allows us to improve your experience.</p>

            <h2>2. How We Use Cookies</h2>
            <p>We use cookies for several important purposes. They can be categorized as follows:</p>
            <ul>
                <li>
                    <strong>Strictly Necessary Cookies:</strong> These cookies are essential for you to browse the website and use its features, such as accessing secure areas of the site. Without these cookies, services like user login and the booking process cannot be provided.
                </li>
                <li>
                    <strong>Performance and Analytics Cookies:</strong> These cookies collect information about how you use our website, for instance, which pages you go to most often. This data helps us optimize our website and make it easier for you to navigate. All information these cookies collect is aggregated and therefore anonymous.
                </li>
                <li>
                    <strong>Functional Cookies:</strong> These cookies allow our website to remember choices you make while browsing. For instance, we may store your geographic location in a cookie to ensure we show you the website localized for your area, or we may remember preferences such as language and currency. This allows us to provide you with a more personal and convenient experience.
                </li>
                 <li>
                    <strong>Targeting or Advertising Cookies:</strong> These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement as well as help measure the effectiveness of the advertising campaigns. They are usually placed by advertising networks with the website operator’s permission.
                </li>
            </ul>

            <h2>3. Third-Party Cookies</h2>
            <p>In addition to our own cookies, we may also use various third-parties' cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on. For example, we use Google Analytics to help us understand our website traffic.</p>

            <h2>4. Your Choices and Managing Cookies</h2>
            <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by using your web browser's settings. Most browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.</p>
            <p>To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.</p>

             <h2>5. Changes to This Cookie Policy</h2>
            <p>We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>
        </LegalPageLayout>
    );
};

export default CookiePolicyPage;
