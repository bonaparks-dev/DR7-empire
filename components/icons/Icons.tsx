import React from 'react';

export const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.67c.622.328 1.292.618 2.048.825l.001-.106a6.375 6.375 0 014.67 11.964-.631.631 0 01-.825-.475A9.337 9.337 0 0015 19.128z" />
    </svg>
);

export const CogIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ZapIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

export const AnchorIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M12 21a9 9 0 01-9-9 1.5 1.5 0 013 0 6 6 0 0012 0 1.5 1.5 0 013 0 9 9 0 01-9 9zm-9-9h18" />
    </svg>
);

export const HomeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
    </svg>
);

export const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const SendIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const HelicopterIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 10.5h20"/>
        <path d="M12 2.5v8"/>
        <path d="M12 10.5c-3.5-2-7.5-.5-7.5 3v4c0 .8.7 1.5 1.5 1.5H7"/>
        <path d="M12 10.5c3.5-2 7.5-.5 7.5 3v4c0 .8-.7 1.5-1.5 1.5H17"/>
        <path d="M17 18.5h-10"/>
        <path d="M7 14.5L4 16"/>
        <path d="M4.5 13.5 6 12"/>
    </svg>
);

export const WifiIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.75 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const MenuIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);


export const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
    </svg>
);

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.238 44 30.025 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
);

export const MetaMaskIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 110.4 103.9" fill="currentColor" className={className}>
        <path d="M3.3 45.4c0-1.5.1-3 .4-4.5L16.2 0l21.3 12.3L25.2 38.3c-2.4-1-5.1-1.1-7.5.1-2.4 1.2-4.2 3.5-4.8 6.2H3.3zM107.1 45.4c0-1.5-.1-3-.4-4.5L94.2 0 72.9 12.3l12.3 26.1c2.4-1 5.1-1.1 7.5.1 2.4 1.2 4.2 3.5 4.8 6.2h10.6zM24.7 54.4c-1.5 0-2.9.3-4.3.8 9.9 12.6 25.9 15.6 34.8 15.6 8.8 0 24.8-3 34.8-15.6-1.4-.5-2.8-.8-4.3-.8-1.5 0-2.9.3-4.3.8-8.4 10.5-20.4 13.1-26.2 13.1-5.8 0-17.8-2.6-26.2-13.1-1.4-.5-2.8-.8-4.3-.8zM19.3 49.9c0-1.5.3-2.9.8-4.3C28.5 35.1 41.3 32 55.2 32c13.9 0 26.7 3.1 35.1 13.6.5 1.4.8 2.8.8 4.3 0 1.5-.3 2.9-.8 4.3-8.4 10.5-21.2 13.6-35.1 13.6-13.9 0-26.7-3.1-35.1-13.6-.5-1.4-.8-2.8-.8-4.3zM89.8 83.1l6.4-11.1-19-11-8.5 14.7c-1.3.8-2.8 1.4-4.3 1.9-1.5.5-3.1.8-4.7.8-1.6 0-3.2-.3-4.7-.8-1.5-.5-3-1.1-4.3-1.9L41.2 61.1l-19 11 6.4 11.1L12.4 103.9h85.6L89.8 83.1z"></path>
    </svg>
);
export const CoinbaseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#0052FF"></path>
        <path d="M16 8H8V16H16V8Z" fill="white"></path>
    </svg>
);
export const PhantomIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="100" cy="100" r="100" fill="#201F25"></circle>
        <path d="M136.639 52.2359C128.846 44.4431 114.978 40 99.4262 40C68.7303 40 45.4262 61.3414 45.4262 90.1554C45.4262 118.97 68.7303 140.311 99.4262 140.311C114.978 140.311 128.846 135.868 136.639 128.075C141.229 123.486 144.114 118.358 145.426 113.345L120.892 101.321C119.537 104.207 117.436 106.592 114.912 108.03C110.981 110.298 105.795 111.433 99.4262 111.433C84.0784 111.433 72.892 102.215 72.892 90.1554C72.892 78.0963 84.0784 68.878 99.4262 68.878C105.795 68.878 110.981 70.0131 114.912 72.281C117.436 73.719 119.537 76.1042 120.892 78.9904L145.426 66.9664C144.114 61.9535 141.229 56.8252 136.639 52.2359ZM145.426 90.1554C145.426 89.2559 145.342 88.4404 145.258 87.5408L108.03 105.522C108.621 106.113 109.128 106.788 109.551 107.463L145.258 92.7567C145.342 91.9413 145.426 91.0417 145.426 90.1554ZM109.551 72.848C109.128 73.523 108.621 74.1979 108.03 74.7893L145.258 92.7567V87.5541L109.551 72.848Z" fill="#A492FF"></path>
    </svg>
);

export const SolanaIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg fill="currentColor" viewBox="0 0 166 132" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M123.518 0H42.4822L0 37.8943L42.4822 75.7886H123.518L166 37.8943L123.518 0Z" transform="translate(0 55.6223)" fill="#14F195"/>
        <path d="M42.4822 131.411H123.518L166 93.5168L123.518 55.6225H42.4822L0 93.5168L42.4822 131.411Z" transform="translate(0 -55.6223)" fill="#9945FF"/>
        <path d="M123.518 55.6221H42.4822L0 93.5164L42.4822 131.411H123.518L166 93.5164L123.518 55.6221Z" transform="translate(0 -55.6221)" fill="#000000" fillOpacity="0.25"/>
    </svg>
);

export const EyeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.433-7.447A1 1 0 017.22 4h9.56a1 1 0 01.75.375l4.433 7.447a1.012 1.012 0 010 .639l-4.433 7.447A1 1 0 0116.78 20h-9.56a1 1 0 01-.75-.375L2.036 12.322z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const EyeSlashIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
    </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

export const CreditCardIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3.375m-3.375 0V18m12.75 0V15M2.25 18v-2.25m19.5 2.25V15M2.25 12l19.5 0M2.25 4.5h19.5v15H2.25v-15z" />
    </svg>
);

export const CryptoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-6h6m-8.25-3.75l-1.5 1.5M20.25 15.75l-1.5 1.5M5.25 15.75l-1.5-1.5M18.75 8.25l1.5-1.5M4.5 12H3m18 0h-1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const BathIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-2.12 0L3 4.88a1.5 1.5 0 0 0 0 2.12L5 8.38"/>
        <path d="M9 18H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/>
        <path d="M12 10h4"/>
        <path d="M14 8v4"/>
        <path d="M18.37 12.63c.2-.2.45-.29.7-.37"/>
        <path d="M20.41 14.19c.22.18.48.32.74.41"/>
        <path d="M21 17c0 .88-.36 1.73-.97 2.34-.6.6-1.45.96-2.32.96-.88 0-1.73-.36-2.34-.97A3.26 3.26 0 0 1 14.4 17c0-.88.36-1.73.97-2.34.6-.6 1.45-.96 2.32-.96s1.73.36 2.34.97c.6.6.96 1.45.96 2.32Z"/>
    </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.594 2.866c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
);

export const CarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875m-17.25 4.5h-2.25m19.5 0h-2.25m0-18c-5.03 0-9.22 3.22-10.875 7.625m10.875-7.625c5.03 0 9.22 3.22 10.875 7.625" />
    </svg>
);

export const BedIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
);

export const WavesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5M3.75 14.25h16.5M5.25 12h13.5M6.75 7.5h10.5M8.25 4.5h7.5" />
    </svg>
);

export const TreePineIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V3m0 18l-3-3m3 3l3-3m-3-15l3 3m-3-3l-3 3" />
    </svg>
);

export const Building2Icon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0h-19.5" />
    </svg>
);

export const ShieldIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
    </svg>
);

export const CrownIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75l7.5-7.5 7.5 7.5m-15 3.75l7.5-7.5 7.5 7.5m-15 3.75h15" />
    </svg>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const DevicePhoneMobileIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
    </svg>
);

export const CubeTransparentIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

export const TicketIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m2.25-4.125c0-1.036.84-1.875 1.875-1.875h.375c1.036 0 1.875.84 1.875 1.875v.375c0 1.036-.84 1.875-1.875 1.875h-.375a1.875 1.875 0 01-1.875-1.875v-.375z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V18a2.25 2.25 0 01-2.25 2.25H9.75A2.25 2.25 0 017.5 18V3.75m9 0V3.375c0-.621-.504-1.125-1.125-1.125H10.125c-.621 0-1.125.504-1.125 1.125v.375m9 0a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25M3.75 6.75h16.5M3.75 18a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0019.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 15.75V18m0 0V6.75A2.25 2.25 0 015.25 4.5h12A2.25 2.25 0 0119.5 6.75v8.25a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 00-2.25 2.25v.375" />
    </svg>
);

export const SignOutIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163m0-1.623c-3.264 0-3.66.014-4.944.072-4.268.195-6.237 2.165-6.432 6.432C.014 8.34 0 8.736 0 12s.014 3.66.072 4.944c.195 4.268 2.164 6.237 6.432 6.432C8.34 23.986 8.736 24 12 24s3.66-.014 4.944-.072c4.268-.195 6.237-2.165 6.432-6.432C23.986 15.66 24 15.264 24 12s-.014-3.66-.072-4.944c-.195-4.268-2.164-6.237-6.432-6.432C15.66.014 15.264 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" /></svg> );
export const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.732 0 1.325-.593 1.325-1.325V1.325C24 .593 23.407 0 22.675 0z" /></svg> );
export const TwitterIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.298 1.634 4.218 3.799 4.654-.753.205-1.536.25-2.327.087.632 1.942 2.41 3.326 4.5 3.365-1.84 1.442-4.14 2.25-6.625 2.25-.43 0-.855-.025-1.274-.075 2.38 1.528 5.234 2.42 8.316 2.42 9.92 0 15.39-8.23 15.39-15.39 0-.234-.005-.467-.015-.7 1.058-.763 1.97-1.712 2.7-2.814z" /></svg> );
export const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> );
export const TiktokIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className={className}><path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/></svg> );
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
    <rect width="48" height="48" rx="8" fill="#25D366"/>
    <path fill="#fff" d="M24 9.5c-7.18 0-13 5.82-13 13 0 2.27.6 4.51 1.73 6.49l-1.84 5.51 5.76-1.51c1.9.95 4.01 1.51 6.35 1.51 7.18 0 13-5.82 13-13s-5.82-13-13-13zm7.45 18.51c-.31.88-1.83 1.66-2.52 1.73-.65.07-1.3.29-4.38-.92-3.94-1.55-6.49-5.55-6.69-5.81-.19-.26-1.59-2.12-1.59-4.04s1.01-2.87 1.37-3.26c.36-.39.78-.49 1.04-.49.26 0 .52.01.75.01.24.01.56-.09.88.67.33.77 1.12 2.74 1.22 2.94.1.19.17.42.03.68-.13.26-.2.42-.4.65-.19.23-.41.51-.58.69-.19.19-.39.4-.17.78.23.39 1.01 1.66 2.16 2.69 1.48 1.33 2.73 1.74 3.12 1.94.39.19.62.16.85-.1.23-.26.98-1.14 1.24-1.54.26-.39.52-.33.88-.19.36.13 2.28 1.08 2.67 1.27.39.19.65.29.75.45.1.16.1.91-.21 1.79z"/>
  </svg>
);

export const FileTextIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

export const MapPinIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

export const MinusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const MessageCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.455.09-.934.09-1.405 0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
);

export const CookieIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 10.937a9 9 0 10-18.175 1.562" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15a.75.75 0 100-1.5.75.75 0 000 1.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 15a.75.75 0 100-1.5.75.75 0 000 1.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

export const BotIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <rect x="5" y="6" width="14" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M9 11h0.01M15 11h0.01M9 14.5c.5.8 1.5 1.5 3 1.5s2.5-.7 3-1.5"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10H3a1 1 0 00-1 1v2a1 1 0 001 1h2M19 10h2a1 1 0 011 1v2a1 1 0 01-1 1h-2"/>
    </svg>
);