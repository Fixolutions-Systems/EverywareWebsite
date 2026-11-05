import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SocialProof from './components/SocialProof';
import HowItWorks from './components/HowItWorks';
import ThreeHeroCanvas from './components/ThreeHeroCanvas';
import FeaturesStack from './components/FeaturesStack';
import BentoGrid from './components/BentoGrid';
import StatsBand from './components/StatsBand';
import TestimonialsGrid from './components/TestimonialsGrid';
import FaqSection from './components/FaqSection';
import ContactSection from './components/ContactSection';
import DownloadCTA from './components/DownloadCTA';
import EditorialFooter from './components/EditorialFooter';
import ExperiencesPage from './components/ExperiencesPage';
import InfoDirectoryPage from './components/InfoDirectoryPage';
import SEOMetaManager from './components/SEOMetaManager';

export default function App() {
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('home');
  const [activePersonaId, setActivePersonaId] = useState(null);

  // Hash route change handler
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      if (hash.startsWith('#experiences')) {
        setCurrentRoute('experiences');
        const match = hash.match(/#experiences\/(\d+)/);
        if (match) {
          setActivePersonaId(Number(match[1]));
        } else {
          setActivePersonaId(null);
        }
      } else if (hash === '#info') {
        setCurrentRoute('info');
        setActivePersonaId(null);
      } else {
        setCurrentRoute('home');
        setActivePersonaId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectPersona = (id) => {
    setActivePersonaId(id);
    if (id) {
      window.location.hash = `#experiences/${id}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = '#experiences';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <SEOMetaManager currentRoute={currentRoute} activePersonaId={activePersonaId} />
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
        <Analytics />
        <SpeedInsights />
        <Navbar
          onOpenQrModal={() => setShowQrModal(true)}
          currentView={currentRoute}
        />

        <main style={{ position: 'relative' }}>
          {currentRoute === 'home' && (
            <>
              <ThreeHeroCanvas />
              <Hero onOpenQrModal={() => setShowQrModal(true)} />
              <SocialProof />
              <HowItWorks />
              <FeaturesStack />
              <BentoGrid />
              <StatsBand />
              <TestimonialsGrid />
              <FaqSection />
              <ContactSection />
            </>
          )}

          {currentRoute === 'experiences' && (
            <ExperiencesPage
              activePersonaId={activePersonaId}
              onSelectPersona={handleSelectPersona}
              onOpenQrModal={() => setShowQrModal(true)}
            />
          )}

          {currentRoute === 'info' && (
            <InfoDirectoryPage
              onOpenQrModal={() => setShowQrModal(true)}
            />
          )}

          <DownloadCTA
            showModal={showQrModal}
            onCloseModal={() => setShowQrModal(false)}
          />
        </main>

        <EditorialFooter onOpenQrModal={() => setShowQrModal(true)} />
      </div>
    </LazyMotion>
  );
}
