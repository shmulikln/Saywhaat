import React from 'react';
import { Link } from 'react-router-dom';
import AppHeader from './AppHeader';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-safe-top text-white">
      <AppHeader />
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[30px] shadow-2xl border border-white/10 relative z-10 mb-8">
        <h1 className="text-3xl font-black mb-6 text-center text-white uppercase tracking-wider">Privacy Policy for "Say WHAAAT"</h1>
        <div className="prose prose-invert max-w-none">
          <p>
             Effective Date: 01/03/2026.
          </p>
          <h2 className="text-2xl font-bold mt-8">​1. Introduction</h2>
          <p>
            Shmuel Klein built the "Say WHAAAT" app as a free app. This SERVICE is provided by Shmuel Klein at no cost and is intended for use as is. This page is used to inform visitors regarding our policies with the collection, use, and disclosure of Personal Information.
          </p>
          <h2 className="text-2xl font-bold mt-8">2. Information Collection and Use</h2>
           <p>
            For a better experience while using our Service, we require certain information to ensure the app functions correctly.
​            Game Lobby Data: To connect players, the app requires users to enter a "Player Name" and a "Room Code." This information is processed temporarily to facilitate multiplayer connectivity and is not linked to a persistent user identity or account.
          </p>
          <h2 className="text-2xl font-bold mt-8">​3. Third-Party Services</h2>
            <p>
            The app does use third-party services that may collect information used to identify you.
​Google AdMob: We use Google AdMob to display ads. AdMob uses tracking technologies, such as the Android Advertising ID, to serve personalized ads. You can learn more at Google's Partner Sites Policy.
​Google Firebase: We use Firebase Realtime Database to manage game lobbies, sync game states, and connect players in real time.
          </p>
          <h2 className="text-2xl font-bold mt-8">4. Log Data</h2>
          <p>
          Whenever you use our Service, in a case of an error in the app, we collect data and information (through third-party products) on your phone called Log Data. This Log Data may include information such as your device Internet Protocol ("IP") address, device name, operating system version, the configuration of the app when utilizing our Service, the time and date of your use of the Service, and other statistics.
          </p>
          <h2 className="text-2xl font-bold mt-8">​5. Links to Other Sites</h2>
          <p>
          This Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites.
          </p>
          <h2 className="text-2xl font-bold mt-8">​6. Children’s Privacy</h2>
          <p>
          These Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
          </p>
          <h2 className="text-2xl font-bold mt-8">7. Data Deletion and User Rights</h2>
          <p>
              Although "SayWhaaat" does not require a formal user account to play, we collect 
              limited guest data (such as Nicknames and Game Scores) which is stored in our 
              cloud database to provide core game functionality and leaderboards.
          </p>
          <p>
              In accordance with Google Play policies and data protection regulations, you have 
              the right to request the permanent deletion of this data at any time. Because 
              this data is not linked to an email login, we process these requests manually 
              to ensure the correct data is removed.
          </p>
          <p>
              To request the deletion of your guest data, please fill out our 
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSeZgpvKrEEoKHBp1bTlhpHGBYtOMZr4C0RAhsCYQs5YhORNrQ/viewform?usp=publish-editor" target="_blank" rel="noopener noreferrer">Data Deletion Request Form</a>. 
              You will be asked to provide your in-game Nickname and your approximate current score 
              so that we can identify and verify your specific entry. Once verified, your data 
              will be permanently deleted from our servers within 30 days.
          </p>
          <h2 className="text-2xl font-bold mt-8">8. Changes to This Privacy Policy</h2>
          <p>
          We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes.
          </p>
          <h2 className="text-2xl font-bold mt-8">9. Contact Us</h2>
          <p>
          If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at saywhaaatapp@gmail.com.
          </p>
        </div>
        <div className="text-center mt-8">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all active:scale-95 shadow-md">
                Go Back Home
            </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
