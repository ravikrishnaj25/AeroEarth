import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const letsGoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const features = [
    { id: 'aqi', title: 'AQI', description: 'Real-time air quality monitoring and pollution tracking across cities', route: '/aqi' },
    { id: 'water', title: 'Water', description: 'Comprehensive water resource management and quality analysis', route: '/water' },
    { id: 'solar', title: 'Solar', description: 'Solar energy potential mapping and renewable power insights', route: '/solar' },
  ];

  const [activeCard, setActiveCard] = useState(0);
  const [activeAqiOption, setActiveAqiOption] = useState('tree');

  const competitors = [
    {
      name: 'Solargis / Augos',
      icon: '☀️',
      strengths: 'Highly accurate PV yield estimations and established industry reputation.',
      weaknesses: 'Restricted to 2D mapping environment, Absence of rain/pollution integration',
      edgeTitle: 'Democratized 3D analysis with click-to-predict multi-feature overlays.',
      edgeDesc: 'Instant visual intelligence that transcends legacy 2D spreadsheets.',
    },
    {
      name: 'Esri ArcGIS Urban',
      icon: '🏙️',
      strengths: 'Procedural city generation with deep GIS integration capabilities.',
      weaknesses: 'Expensive ($10K+/yr), Steep learning curve for new users',
      edgeTitle: 'CesiumJS web-free platform with gamified UX for homeowners.',
      edgeDesc: 'No enterprise lock-in. Accessible environmental insights for everyone.',
    },
    {
      name: 'Ladybug / SimStadt',
      icon: '🐞',
      strengths: 'Advanced solar simulations in Rhino/Grasshopper environments.',
      weaknesses: 'Offline-only, Architect-focused, No commercial pitch tools',
      edgeTitle: 'Real-time Cesium + commercial ROI calculator built-in.',
      edgeDesc: 'From simulation to sales pitch in one seamless workflow.',
    },
    {
      name: 'DROP (Rain)',
      icon: '💧',
      strengths: 'Rainwater harvest sizing calculations and water management.',
      weaknesses: '2D static visualizations, No 3D or solar integration',
      edgeTitle: 'Integrated 3D with wind & groundwater visualization.',
      edgeDesc: 'Unified environmental intelligence across all resource types.',
    },
    {
      name: 'CleanMax (India)',
      icon: '🏠',
      strengths: 'Established rooftop solar installation network in India.',
      weaknesses: 'No visualization tools, Limited digital engagement',
      edgeTitle: 'Your SaaS platform convinces their leads.',
      edgeDesc: 'White-label ready. Turn installers into digital-first sellers.',
    },
  ];

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Title animation (letter by letter)
    if (titleRef.current) {
      const letters = titleRef.current.querySelectorAll('.title-letter');
      tl.fromTo(letters,
        { opacity: 0, y: 80, rotateX: -90 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.06 },
        0.2
      );
    }

    // Description animation
    if (descRef.current) {
      tl.fromTo(descRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1 },
        0.8
      );
    }

    // Let's Go animation
    if (letsGoRef.current) {
      tl.fromTo(letsGoRef.current,
        { opacity: 0, scale: 0.8, x: 50 },
        { opacity: 1, scale: 1, x: 0, duration: 1, ease: 'elastic.out(1, 0.6)' },
        1.2
      );
    }
  }, []);

  // Handle video and audio synchronization
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (!video || !audio) return;

    // Function to play audio when video plays
    const handleVideoPlay = () => {
      audio.play().catch(() => {
        // Autoplay may be blocked, user interaction needed
      });
    };

    // Function to pause audio when video pauses
    const handleVideoPause = () => {
      audio.pause();
    };

    // Loop both video and audio when video ends
    const handleVideoEnded = () => {
      video.currentTime = 0;
      audio.currentTime = 0;
      video.play();
      audio.play().catch(() => {});
    };

    // Start playing on user interaction (click anywhere)
    const handleUserInteraction = () => {
      if (video.paused) {
        video.play();
      }
      audio.play().catch(() => {});
      document.removeEventListener('click', handleUserInteraction);
    };

    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);
    video.addEventListener('ended', handleVideoEnded);
    document.addEventListener('click', handleUserInteraction);

    // Try to autoplay
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('pause', handleVideoPause);
      video.removeEventListener('ended', handleVideoEnded);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  const handleLetsGoClick = () => {
    setIsPopupOpen(true);
  };

  const handleBackdropClick = () => {
    setIsPopupOpen(false);
  };

  const handleOptionClick = (route: string) => {
    setIsPopupOpen(false);
    setTimeout(() => navigate(route), 200);
  };
  const titleText = 'AEROEARTH';

  // Helper component for stats rows
  const StatRow = ({ label, value, valueColor = 'rgba(255, 255, 255, 0.9)' }: { label: string; value: string; valueColor?: string }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
      }}
    >
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.95rem',
          fontWeight: 500,
          color: valueColor,
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <>
      {/* Hero Section */}
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          padding: '4rem',
        }}
      >
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/assets/aqi/nature.mp4" type="video/mp4" />
        </video>
        {/* Background Audio */}
        <audio ref={audioRef} src="/assets/aqi/nature.mp3" preload="auto" />
        {/* Dark Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7))',
            zIndex: 1,
          }}
        />
        {/* Top Center - AeroEarth Title */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '6rem',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            ref={titleRef}
            style={{
              display: 'flex',
              perspective: '1000px',
            }}
          >
            {titleText.split('').map((letter, index) => (
              <span
                key={index}
                className="title-letter"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(3rem, 10vw, 8rem)',
                  fontWeight: 900,
                  color: '#00ff55',
                  display: 'inline-block',
                  textShadow: '0 0 80px rgba(0, 255, 85, 0.4)',
                  willChange: 'transform, opacity',
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Content Area - Description (left-center) + Let's Go (right of center) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            paddingLeft: '2rem',
            paddingRight: '8rem',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Description - Left to Center */}
          <div
            style={{
              maxWidth: '55%',
            }}
          >
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  width: '40px',
                  height: '2px',
                  backgroundColor: '#00ff55',
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.85rem',
                  color: '#00ff55',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                }}
              >
                Earth Intelligence Platform
              </span>
            </motion.div>

            {/* Long Description */}
            <p
              ref={descRef}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.9,
                margin: 0,
                opacity: 0,
              }}
            >
              Experience the future of environmental monitoring with our high-fidelity
              autonomous climate tracking system. We combine advanced geospatial intelligence
              with precision bio-seeding technology to redefine planetary health.
              Monitor air quality, harness solar potential, and track urban ecosystem vitality
              — all through a unified digital twin platform.
            </p>
          </div>

          {/* Let's Go - Slightly left of right edge */}
          <motion.div
            ref={letsGoRef}
            onClick={handleLetsGoClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            style={{
              cursor: 'pointer',
              opacity: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 900,
                color: 'transparent',
                WebkitTextStroke: '2px #00ff55',
                letterSpacing: '-0.02em',
                display: 'block',
                lineHeight: 1.1,
                textAlign: 'right',
              }}
            >
              LET'S
            </span>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 900,
                color: '#00ff55',
                letterSpacing: '-0.02em',
                display: 'block',
                lineHeight: 1.1,
                textAlign: 'right',
                textShadow: '0 0 60px rgba(0, 255, 85, 0.6)',
              }}
            >
              GO.
            </span>
            <motion.div
              animate={{ x: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{
                marginTop: '0.75rem',
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.75rem',
                  color: '#00ff55',
                }}
              >
                →
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Competitive Landscape Section - Separate Black Background */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#000000',
          padding: '6rem 2rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          style={{
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {/* Left Side - Title & Description */}
          <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 280px' }}>
              {/* Section Label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <span
                  style={{
                    width: '30px',
                    height: '2px',
                    backgroundColor: '#00ff55',
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.75rem',
                    color: '#00ff55',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                  }}
                >
                  Intelligence Stack
                </span>
              </div>

              {/* Section Title */}
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: '0 0 0.5rem 0',
                  lineHeight: 1.1,
                }}
              >
                Market
              </h2>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 700,
                  color: '#00ff55',
                  margin: '0 0 2rem 0',
                  lineHeight: 1.1,
                  fontStyle: 'italic',
                }}
              >
                Synthesis
              </h2>

              {/* Section Description */}
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: '0 0 3rem 0',
                  lineHeight: 1.7,
                }}
              >
                Evaluating the legacy landscape against our next-generation environmental intelligence framework.
              </p>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <motion.button
                  onClick={() => setActiveCard((prev) => (prev === 0 ? competitors.length - 1 : prev - 1))}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  ←
                </motion.button>
                <motion.button
                  onClick={() => setActiveCard((prev) => (prev === competitors.length - 1 ? 0 : prev + 1))}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '2px solid #00ff55',
                    background: 'rgba(0, 255, 85, 0.1)',
                    color: '#00ff55',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  →
                </motion.button>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginLeft: '0.5rem',
                  }}
                >
                  {String(activeCard + 1).padStart(2, '0')} / {String(competitors.length).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Right Side - Stacked Cards */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                height: '500px',
                perspective: '1000px',
              }}
            >
              <AnimatePresence mode="popLayout">
                {competitors.map((competitor, index) => {
                  const position = (index - activeCard + competitors.length) % competitors.length;
                  const isActive = position === 0;
                  const offset = position * 15;
                  const scale = 1 - position * 0.04;
                  const zIndex = competitors.length - position;
                  const opacity = position > 2 ? 0 : 1 - position * 0.25;

                  return (
                    <motion.div
                      key={competitor.name}
                      onClick={() => isActive && setActiveCard((prev) => (prev === competitors.length - 1 ? 0 : prev + 1))}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{
                        opacity,
                        x: offset,
                        y: offset,
                        scale,
                        zIndex,
                      }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        height: '460px',
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        cursor: isActive ? 'pointer' : 'default',
                        transformOrigin: 'top left',
                      }}
                    >
                      {/* Left Side - Competitor Info */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(30, 35, 30, 0.95) 0%, rgba(20, 25, 20, 0.98) 100%)',
                          backdropFilter: 'blur(20px)',
                          padding: '2.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRight: 'none',
                          borderRadius: '24px 0 0 24px',
                        }}
                      >
                        {/* Company Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '12px',
                              background: 'rgba(0, 255, 85, 0.1)',
                              border: '1px solid rgba(0, 255, 85, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                            }}
                          >
                            {competitor.icon}
                          </div>
                          <div>
                            <h3
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: '#ffffff',
                                margin: 0,
                              }}
                            >
                              {competitor.name}
                            </h3>
                            <span
                              style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: '0.75rem',
                                color: 'rgba(255, 255, 255, 0.4)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                              }}
                            >
                              Status: Legacy Standard
                            </span>
                          </div>
                        </div>

                        {/* Core Strengths */}
                        <div style={{ marginBottom: '2rem' }}>
                          <span
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: '0.7rem',
                              color: 'rgba(255, 255, 255, 0.4)',
                              letterSpacing: '0.15em',
                              textTransform: 'uppercase',
                              display: 'block',
                              marginBottom: '0.75rem',
                            }}
                          >
                            Core Strengths
                          </span>
                          <p
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: '1.1rem',
                              color: 'rgba(255, 255, 255, 0.8)',
                              margin: 0,
                              lineHeight: 1.6,
                            }}
                          >
                            {competitor.strengths}
                          </p>
                        </div>

                        {/* Known Limitations */}
                        <div style={{ flex: 1 }}>
                          <span
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: '0.7rem',
                              color: 'rgba(255, 255, 255, 0.4)',
                              letterSpacing: '0.15em',
                              textTransform: 'uppercase',
                              display: 'block',
                              marginBottom: '0.75rem',
                            }}
                          >
                            Known Limitations
                          </span>
                          <ul
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: '1rem',
                              color: 'rgba(255, 255, 255, 0.5)',
                              margin: 0,
                              paddingLeft: '1.25rem',
                              lineHeight: 1.8,
                            }}
                          >
                            {competitor.weaknesses.split(', ').map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <span
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: '0.7rem',
                              color: 'rgba(255, 255, 255, 0.3)',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                            }}
                          >
                            System Analytics v4.0.1
                          </span>
                        </div>
                      </div>

                      {/* Right Side - Our Edge */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 30, 15, 0.95) 0%, rgba(0, 20, 10, 0.98) 100%)',
                          backdropFilter: 'blur(20px)',
                          padding: '2.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid rgba(0, 255, 85, 0.2)',
                          borderLeft: '1px solid rgba(0, 255, 85, 0.3)',
                          borderRadius: '0 24px 24px 0',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '0.7rem',
                            color: '#00ff55',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginBottom: '1.5rem',
                          }}
                        >
                          Our Edge
                        </span>

                        <h3
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                            fontWeight: 700,
                            color: '#00ff55',
                            margin: '0 0 2rem 0',
                            lineHeight: 1.2,
                            textShadow: '0 0 40px rgba(0, 255, 85, 0.3)',
                          }}
                        >
                          {competitor.edgeTitle}
                        </h3>

                        <p
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '1rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            margin: 0,
                            lineHeight: 1.7,
                            flex: 1,
                          }}
                        >
                          {competitor.edgeDesc}
                        </p>

                        {/* Dots Indicator */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                          {competitors.map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: i === activeCard ? '#00ff55' : 'rgba(0, 255, 85, 0.2)',
                                transition: 'background 0.3s ease',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#000000',
          padding: '6rem 2rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          style={{
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ width: '30px', height: '2px', backgroundColor: '#00ff55' }} />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.75rem',
                  color: '#00ff55',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                }}
              >
                Environmental Solutions
              </span>
              <span style={{ width: '30px', height: '2px', backgroundColor: '#00ff55' }} />
            </div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: '#ffffff',
                margin: '0 0 1rem 0',
              }}
            >
              Explore Our <span style={{ color: '#00ff55' }}>Features</span>
            </h2>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              Comprehensive environmental intelligence tools for sustainable living
            </p>
          </div>

          {/* ===== AQI FEATURE ===== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '4rem' }}
          >
            {/* AQI Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>🌿</span>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#00ff55',
                  margin: 0,
                }}
              >
                Air Quality Solutions
              </h3>
            </div>

            {/* AQI Sub-options */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { id: 'tree', label: 'Tree Planting', icon: '🌳' },
                { id: 'garden', label: 'Vertical Garden', icon: '🌿' },
                { id: 'purifier', label: 'Air Purifiers', icon: '💨' },
              ].map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => setActiveAqiOption(option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '20px',
                    border: activeAqiOption === option.id ? '1px solid #00ff55' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: activeAqiOption === option.id ? 'rgba(0, 255, 85, 0.15)' : 'transparent',
                    color: activeAqiOption === option.id ? '#00ff55' : 'rgba(255, 255, 255, 0.5)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </motion.button>
              ))}
            </div>

            {/* AQI Content Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                background: 'linear-gradient(135deg, rgba(20, 25, 20, 0.9) 0%, rgba(10, 15, 10, 0.95) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(0, 255, 85, 0.2)',
                overflow: 'hidden',
                minHeight: '400px',
              }}
            >
              {/* Left - Image Area */}
              <div
                style={{
                  padding: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle at center, rgba(0, 255, 85, 0.05) 0%, transparent 70%)',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeAqiOption}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    style={{ textAlign: 'center' }}
                  >
                    {activeAqiOption === 'tree' && (
                      <>
                        <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🌳</div>
                        <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', color: '#00ff55', margin: 0 }}>Mango Tree</h4>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0' }}>Best for streets + open areas</p>
                      </>
                    )}
                    {activeAqiOption === 'garden' && (
                      <>
                        <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🌿</div>
                        <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', color: '#00ff55', margin: 0 }}>Vertical Garden</h4>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0' }}>Urban wall installation</p>
                      </>
                    )}
                    {activeAqiOption === 'purifier' && (
                      <>
                        <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>💨</div>
                        <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', color: '#00ff55', margin: 0 }}>Air Purifier</h4>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0' }}>Indoor air quality solution</p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right - Stats Panel */}
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeAqiOption}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'rgba(0, 255, 85, 0.1)',
                          border: '1px solid rgba(0, 255, 85, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        {activeAqiOption === 'tree' ? '🌳' : activeAqiOption === 'garden' ? '🌿' : '💨'}
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                          {activeAqiOption === 'tree' ? 'Tree Impact Summary' : activeAqiOption === 'garden' ? 'Vertical Garden Impact' : 'Air Purifier Impact'}
                        </h3>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            background: activeAqiOption === 'purifier' ? 'rgba(100, 150, 255, 0.2)' : 'rgba(0, 255, 85, 0.15)',
                            color: activeAqiOption === 'purifier' ? '#6496ff' : '#00ff55',
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '0.7rem',
                            marginTop: '0.5rem',
                          }}
                        >
                          {activeAqiOption === 'purifier' ? '🏠 Indoor Impact' : '🌿 Outdoor Impact'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activeAqiOption === 'tree' && (
                        <>
                          <StatRow label="Tree Type" value="Mango" />
                          <StatRow label="AQI Improvement" value="-2 points" valueColor="#00ff55" />
                          <StatRow label="PM2.5 Reduction" value="-0.33 µg/m³" valueColor="#00ff55" />
                          <StatRow label="PM10 Reduction" value="-0.49 µg/m³" valueColor="#00ff55" />
                          <StatRow label="Coverage Radius" value="20m" />
                          <StatRow label="CO₂ Absorbed" value="18 kg/year" valueColor="#00ff55" />
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
                          <StatRow label="One-time Cost" value="₹768" />
                          <StatRow label="Maintenance" value="₹60/month" valueColor="#00ff55" />
                        </>
                      )}
                      {activeAqiOption === 'garden' && (
                        <>
                          <StatRow label="Area Installed" value="14 m²" />
                          <StatRow label="AQI Improvement" value="-15 points" valueColor="#00ff55" />
                          <StatRow label="PM2.5 Reduction" value="-6.29 µg/m³" valueColor="#00ff55" />
                          <StatRow label="Temperature Drop" value="-1.9°C" valueColor="#00ff55" />
                          <StatRow label="Noise Reduction" value="-4.8 dB" valueColor="#00ff55" />
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
                          <StatRow label="Cost per m²" value="₹1,861" />
                          <StatRow label="Total Cost" value="₹26,054" />
                          <StatRow label="Maintenance" value="₹431/month" valueColor="#00ff55" />
                        </>
                      )}
                      {activeAqiOption === 'purifier' && (
                        <>
                          <StatRow label="Room Coverage" value="369 sq ft" />
                          <StatRow label="Indoor PM2.5 Drop" value="-86%" valueColor="#00ff55" />
                          <StatRow label="CADR" value="386 m³/hr" />
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
                          <StatRow label="Device Cost" value="₹15,299" />
                          <StatRow label="Filter Replacement" value="₹2,406 / 6 months" valueColor="#00ff55" />
                        </>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ===== WATER FEATURE ===== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '4rem' }}
          >
            {/* Water Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>💧</span>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#6496ff',
                  margin: 0,
                }}
              >
                Water Harvesting
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.9) 0%, rgba(10, 15, 20, 0.95) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(100, 150, 255, 0.2)',
                overflow: 'hidden',
                minHeight: '400px',
              }}
            >
              {/* Left - Water Visual */}
              <div
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle at center, rgba(100, 150, 255, 0.05) 0%, transparent 70%)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#6496ff', lineHeight: 1 }}>4492</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>LITERS / DAY</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 600, color: '#6496ff', marginBottom: '0.5rem' }}>85% Efficiency</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Estimated Collection</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginTop: '0.5rem' }}>Rainwater Harvesting Model</div>
                </div>
              </div>

              {/* Right - Water Stats */}
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(100, 150, 255, 0.1)',
                      border: '1px solid rgba(100, 150, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    💧
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', color: '#fff', margin: 0 }}>Water Harvesting Summary</h3>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(100, 150, 255, 0.15)',
                        color: '#6496ff',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '0.7rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      💧 Active System
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <StatRow label="Daily Collection" value="4,492 L" valueColor="#6496ff" />
                  <StatRow label="System Efficiency" value="85%" valueColor="#6496ff" />
                  <StatRow label="Roof Area" value="250 m²" />
                  <StatRow label="Tank Capacity" value="10,000 L" />
                  <StatRow label="Annual Savings" value="₹42,000" valueColor="#6496ff" />
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
                  <StatRow label="Installation Cost" value="₹85,000" />
                  <StatRow label="Payback Period" value="~2 years" valueColor="#6496ff" />
                  <StatRow label="Maintenance" value="₹500/month" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ===== SOLAR FEATURE ===== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Solar Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>☀️</span>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#ff9632',
                  margin: 0,
                }}
              >
                Solar Energy
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                background: 'linear-gradient(135deg, rgba(30, 25, 15, 0.9) 0%, rgba(20, 15, 10, 0.95) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 150, 50, 0.2)',
                overflow: 'hidden',
                minHeight: '400px',
              }}
            >
              {/* Left - Solar Visual */}
              <div
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle at center, rgba(255, 150, 50, 0.05) 0%, transparent 70%)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☀️</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', color: '#ff9632', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>SOLAR YIELD</div>
                  <div style={{ fontSize: '4rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#ff9632', lineHeight: 1 }}>19.66 kW</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '1.5rem' }}>Estimated System Size</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 700, color: '#ffffff' }}>₹21,045</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>SAVINGS / MONTH</div>
                </div>
              </div>

              {/* Right - Solar Stats */}
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(255, 150, 50, 0.1)',
                      border: '1px solid rgba(255, 150, 50, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    ☀️
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', color: '#fff', margin: 0 }}>Solar Energy Summary</h3>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(255, 150, 50, 0.15)',
                        color: '#ff9632',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '0.7rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      ⚡ Active Generation
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <StatRow label="System Size" value="19.66 kW" valueColor="#ff9632" />
                  <StatRow label="Energy/Year" value="31,563 kWh" valueColor="#ff9632" />
                  <StatRow label="Sun Hours" value="4.1 hrs/day" />
                  <StatRow label="Roof Area" value="374 m²" />
                  <StatRow label="Monthly Savings" value="₹21,045" valueColor="#ff9632" />
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
                  <StatRow label="Installation Cost" value="₹9,83,000" />
                  <StatRow label="Payback Period" value="~4 years" valueColor="#ff9632" />
                  <StatRow label="Panel Efficiency" value="80% fill" />
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Popup Menu */}
      <AnimatePresence>
        {isPopupOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleBackdropClick}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.92)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                zIndex: 40,
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                inset: 0,
                margin: 'auto',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3rem',
                padding: '4rem 5rem',
                borderRadius: '32px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 255, 85, 0.3)',
                boxShadow: '0 0 150px rgba(0, 255, 85, 0.15), 0 25px 80px rgba(0, 0, 0, 0.5)',
                maxWidth: '90vw',
                width: '900px',
                height: 'fit-content',
                maxHeight: '80vh',
              }}
            >
              {/* Video Background for Popup */}
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                }}
              >
                <source src="/assets/aqi/nature.mp4" type="video/mp4" />
              </video>
              {/* Dark Overlay for Popup */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(rgba(0, 15, 8, 0.85), rgba(0, 15, 8, 0.9))',
                  zIndex: 1,
                }}
              />
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                  fontWeight: 700,
                  color: '#00ff55',
                  margin: 0,
                  letterSpacing: '0.05em',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                Choose Your Experience
              </motion.h2>

              <div style={{ display: 'flex', gap: '1.5rem', width: '100%', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                {features.map((feature, index) => (
                  <motion.button
                    key={feature.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{
                      scale: 1.03,
                      backgroundColor: 'rgba(0, 255, 85, 0.12)',
                      borderColor: '#00ff55',
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleOptionClick(feature.route)}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 255, 85, 0.05)',
                      border: '1px solid rgba(0, 255, 85, 0.2)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      padding: '2rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.3s ease',
                      minHeight: '180px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                        fontWeight: 800,
                        color: '#00ff55',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {feature.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                        fontWeight: 400,
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.6,
                        textAlign: 'center',
                      }}
                    >
                      {feature.description}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.5 }}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.85rem',
                  color: '#00ff55',
                  margin: 0,
                  letterSpacing: '0.1em',
                }}
              >
                Click outside to close
              </motion.p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingPage;
