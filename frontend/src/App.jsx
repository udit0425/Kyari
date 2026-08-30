import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Star, 
  RefreshCw, 
  MapPin, 
  Coffee, 
  Car, 
  Compass, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight,
  Flame,
  Moon,
  Phone,
  ChevronDown,
  Wind,
  Leaf
} from 'lucide-react';

const API_BASE = 'https://kyari.onrender.com/api';
const WA_NUMBER = '919989750728';

/* ─────────────────── Icon helpers ─────────────────── */
const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

/* ─────────────────── Floating WhatsApp button ─────────────────── */
const FloatingWhatsApp = () => (
  <a
    href={`https://wa.me/${WA_NUMBER}?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20stay%20at%20Malbagadh%20Homestay.`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat on WhatsApp"
    style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: '#25D366',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
      zIndex: 9999,
      textDecoration: 'none',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,211,102,0.6)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.45)'; }}
  >
    <WhatsAppIcon size={26} />
  </a>
);

/* ─────────────────── Main App ─────────────────── */
function App() {
  const today = new Date();
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [galleryImages, setGalleryImages] = useState([]);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(6);
  const [navScrolled, setNavScrolled] = useState(false);

  // Gallery lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showMorePhotos, setShowMorePhotos] = useState(false);

  // Booking states
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [userPhone, setUserPhone] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [overlappingBooking, setOverlappingBooking] = useState(null);
  const [bookingTab, setBookingTab] = useState('dates');

  // Custom date picker
  const [datePickerOpen, setDatePickerOpen] = useState(false); // false | 'in' | 'out'
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const pickerRef = React.useRef(null);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setDatePickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Navigate picker months
  const pickerPrevMonth = () => {
    if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(y => y - 1); }
    else setPickerMonth(m => m - 1);
  };
  const pickerNextMonth = () => {
    if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(y => y + 1); }
    else setPickerMonth(m => m + 1);
  };

  const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const todayStr = today.toISOString().slice(0, 10);

  // Availability calendar
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchBookings();
    fetchGalleryImages();
  }, []);

  // All images for lightbox: gallery first, then local fallbacks
  const allImages = galleryImages.length > 0 ? galleryImages : [
    '/assets/exterior.png', '/assets/bedroom.png', '/assets/nature.png', '/assets/lounge.png'
  ];

  const openLightbox = (idx) => { setLightboxIndex(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const nextPhoto = () => setLightboxIndex(i => (i + 1) % allImages.length);
  const prevPhoto = () => setLightboxIndex(i => (i - 1 + allImages.length) % allImages.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  const fetchReviews = async (platform = 'All') => {
    try {
      const url = platform === 'All' ? `${API_BASE}/reviews` : `${API_BASE}/reviews?platform=${encodeURIComponent(platform)}`;
      const data = await fetch(url).then(r => r.json());
      setReviews(data);
    } catch { /* silent */ }
  };

  const fetchBookings = async () => {
    try {
      const data = await fetch(`${API_BASE}/bookings`).then(r => r.json());
      setBookings(data);
    } catch { /* silent */ }
  };

  const fetchGalleryImages = async () => {
    try {
      const data = await fetch(`${API_BASE}/gallery`).then(r => r.json());
      setGalleryImages(data.map(item => item.url));
    } catch { /* silent */ }
  };

  // Availability & Booking request submit (Internal API submission, no redirection)
  const checkAvailability = async (e) => {
    e.preventDefault();
    setDatePickerOpen(false);
    if (!checkIn || !checkOut) {
      setAvailabilityStatus('missing-dates');
      return;
    }
    if (checkIn >= checkOut) {
      setAvailabilityStatus('bad-dates');
      return;
    }
    if (!userPhone || userPhone.trim().replace(/\D/g, '').length < 10) {
      setAvailabilityStatus('missing-phone');
      return;
    }

    setAvailabilityStatus('checking');

    try {
      await fetch(`${API_BASE}/booking-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in: checkIn,
          check_out: checkOut,
          guest_phone: userPhone.trim(),
          guest_count: guestCount
        })
      });
      setAvailabilityStatus('request-sent');
    } catch {
      setAvailabilityStatus('request-sent');
    }
  };

  const getNights = () => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000));
  };

  /* ── Build WhatsApp prefilled message ── */
  const waAvailableMsg = () => {
    const nights = getNights();
    const msg = `Hi! I would like to request a booking for Malbagadh Homestay.\n\n📱 Guest Mobile: ${userPhone.trim()}\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n👥 Guests: ${guestCount}\n🌙 Duration: ${nights} night(s)\n\nPlease confirm availability and details. Thank you!`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  // Calendar
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

  const renderCalendar = () => {
    const totalDays = getDaysInMonth(currentMonth, currentYear);
    const startDay = getFirstDayOfMonth(currentMonth, currentYear);
    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`e-${i}`} className="calendar-cell" style={{ opacity: 0.15 }} />);
    }
    for (let day = 1; day <= totalDays; day++) {
      const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => ds >= b.check_in && ds < b.check_out);
      const isToday = ds === today.toISOString().slice(0, 10);
      cells.push(
        <div key={day} className={`calendar-cell${dayBookings.length ? ' booked-cell' : ''}${isToday ? ' today-cell' : ''}`}>
          <span className="calendar-cell-date">{day}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
            {dayBookings.map(b => (
              <span key={b.id} className={`booking-badge badge-${b.platform.toLowerCase().replace(/\s+/g, '')}`} title={b.platform}>
                {b.platform === 'Rent By Owner' ? 'RBO' : b.platform.slice(0, 7)}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // Reviews sort
  const sortedReviews = [...reviews].sort((a, b) => {
    if (activeFilter !== 'All') return b.date.localeCompare(a.date);
    const priority = { Airbnb: 1, JustDial: 2, 'Rent By Owner': 3, Instagram: 4, Skyscanner: 5 };
    const pA = priority[a.platform] || 99, pB = priority[b.platform] || 99;
    return pA !== pB ? pA - pB : b.date.localeCompare(a.date);
  });

  const handleFilterChange = (platform) => {
    setActiveFilter(platform);
    fetchReviews(platform);
    setVisibleReviewsCount(6);
  };


  /* ─────────────────── JSX ─────────────────── */
  return (
    <div>
      <FloatingWhatsApp />

      {/* ── Navigation ── */}
      <nav className="navbar" id="main-nav" style={{
        background: navScrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(12px)' : 'none',
        boxShadow: navScrolled ? '0 1px 24px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div className="container navbar-container">
          <a href="#" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/assets/malbagadh_sign.jpg"
              alt="Malbagadh"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--secondary-accent)', flexShrink: 0 }}
            />
            <span style={{ color: navScrolled ? 'var(--primary-deep)' : '#fff', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', transition: 'color 0.3s' }}>
              Malbagadh Homestay
            </span>
          </a>
          <ul className="nav-links">
            <li><a href="#about" className="nav-link-item" style={{ color: navScrolled ? 'var(--text-dark)' : 'rgba(255,255,255,0.9)' }}>Our Story</a></li>
            <li><a href="#gallery" className="nav-link-item" style={{ color: navScrolled ? 'var(--text-dark)' : 'rgba(255,255,255,0.9)' }}>Gallery</a></li>
            <li><a href="#booking" className="nav-link-item" style={{ color: navScrolled ? 'var(--text-dark)' : 'rgba(255,255,255,0.9)' }}>Book a Stay</a></li>
            <li><a href="#reviews" className="nav-link-item" style={{ color: navScrolled ? 'var(--text-dark)' : 'rgba(255,255,255,0.9)' }}>Guest Reviews</a></li>
          </ul>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20Malbagadh%20Homestay.`}
              target="_blank" rel="noopener noreferrer"
              aria-label="WhatsApp"
              style={{ color: '#25D366', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <WhatsAppIcon size={22} />
            </a>
            <a
              href="https://www.instagram.com/malbagadh/"
              target="_blank" rel="noopener noreferrer"
              aria-label="Instagram"
              style={{ color: '#E1306C', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <InstagramIcon size={22} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" style={{ backgroundImage: `url('/assets/exterior.png')` }}>
        <div className="hero-overlay" />
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero-content">
            <div style={{ display: 'flex', gap: '8px', color: 'var(--secondary-accent)', marginBottom: '16px', alignItems: 'center' }}>
              <Sparkles size={18} />
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>
                Kumaon Forest Homestay · Jim Corbett
              </span>
            </div>
            <h1>Malbagadh —<br />Where the Forest Speaks</h1>
            <p style={{ maxWidth: '520px' }}>
              A secluded hilltop bungalow above Kyari village, deep in the Betalghat forests of Kumaon.
              Homemade meals, wildlife trails, and true silence await.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
              <a href="#booking" className="btn-primary">Check Availability</a>
              <a href="#gallery" className="btn-secondary" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>View Gallery</a>
            </div>
          </div>
        </div>
        <a href="#about" style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', zIndex: 10, fontSize: '0.75rem', letterSpacing: '1px', animation: 'bob 2s ease-in-out infinite' }}>
          <span>SCROLL</span>
          <ChevronDown size={18} />
        </a>
      </section>

      {/* ── Highlights strip ── */}
      <div style={{ background: 'var(--primary-deep)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { icon: <MapPin size={16}/>, text: 'Kyari Village, Almora' },
            { icon: <Users size={16}/>, text: 'Up to 12 Guests' },
            { icon: <Coffee size={16}/>, text: 'Homemade Kumaoni Cuisine' },
            { icon: <Leaf size={16}/>, text: 'Forest Trails & Birdwatching' },
            { icon: <Car size={16}/>, text: 'Gypsy Pick-up Included' }
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.82)', fontSize: '0.85rem', fontWeight: 500 }}>
              <span style={{ color: 'var(--secondary-accent)' }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── About Section ── */}
      <section id="about" className="container" style={{ padding: '96px 24px' }}>
        <div className="grid-cols-2" style={{ alignItems: 'center', gap: '64px' }}>
          <div>
            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', background: 'var(--bg-cream)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '6px 14px', marginBottom: '24px' }}>
              <Sparkles size={14} style={{ color: 'var(--secondary-accent)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-light)', letterSpacing: '1px', textTransform: 'uppercase' }}>Our Story</span>
            </div>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '20px', color: 'var(--primary-deep)', lineHeight: 1.25 }}>
              A Wilderness Retreat Above the Clouds
            </h2>
            <p style={{ marginBottom: '18px', fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-muted)' }}>
              Malbagadh sits perched on the ridge above Kyari village, 20km from Dhangari Gate on the edge of Jim Corbett National Park. The final stretch up is a steep forest trail — our Gypsy will meet you at the Kyari parking and bring you up in style.
            </p>
            <p style={{ marginBottom: '28px', fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-muted)' }}>
              Bunty ji and Balam Singh ji, our resident caretaker and cook, will guide you through the forests and prepare fresh Kumaoni meals three times a day. Sambar deer and barking deer are regulars on our viewing deck at dusk.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
              {['Homemade Kumaoni Meals', 'Private Forest Trails', 'Bird-watching Deck', 'Bonfire Evenings', 'Gypsy Pickup Service', 'Pet-friendly Stay'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Check size={16} style={{ color: 'var(--secondary-accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-dark)' }}>{f}</span>
                </div>
              ))}
            </div>
            <a href="#booking" className="btn-primary">Reserve Your Spot</a>
          </div>
          <div style={{ position: 'relative' }}>
            <img
              src="/assets/lounge.png"
              alt="Malbagadh Lounge"
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
            />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '-20px',
              background: '#fff', border: '1px solid var(--border-light)',
              padding: '18px 22px', borderRadius: 'var(--radius-md)',
              display: 'flex', gap: '12px', alignItems: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              <Coffee size={26} style={{ color: 'var(--primary-deep)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem' }}>Homemade Cuisine</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Local Kumaoni delicacies, 3x daily</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery Section ── */}
      <section id="gallery" className="gallery-section" style={{ background: '#FAF9F6', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--primary-deep)', marginBottom: '12px' }}>Life at Malbagadh</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>Stone walls, forest air, and the hum of birds — glimpses of what awaits you</p>
          </div>

          {/* Hero grid — first 4 images */}
          <div className="gallery-grid">
            {[
              { fallback: '/assets/exterior.png', label: 'The Bungalow', sub: 'Warm stone and forest canopy' },
              { fallback: '/assets/bedroom.png',  label: 'Forest Bedroom', sub: 'Wake up to birdsong' },
              { fallback: '/assets/nature.png',   label: 'Valley View Deck', sub: 'Dusk & dawn wildlife spotting' },
              { fallback: '/assets/lounge.png',   label: 'The Living Room', sub: 'Evenings by the fireplace' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`gallery-item${idx === 0 ? ' gallery-item-large' : ''}${idx === 3 ? ' gallery-span-2' : ''}`}
                style={idx === 3 ? { gridColumn: 'span 2' } : {}}
                onClick={() => openLightbox(idx)}
              >
                <img src={allImages[idx] || item.fallback} alt={item.label} />
                <div className="gallery-overlay">
                  <h4>{item.label}</h4>
                  <p>{item.sub}</p>
                </div>
                {/* Click hint */}
                <div className="gallery-zoom-hint">🔍 View</div>
              </div>
            ))}
          </div>

          {/* View All Photos toggle */}
          {allImages.length > 4 && (
            <div style={{ marginTop: '32px' }}>
              <div style={{ textAlign: 'center', marginBottom: showMorePhotos ? '24px' : '0' }}>
                <button
                  onClick={() => setShowMorePhotos(p => !p)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: showMorePhotos ? 'var(--primary-deep)' : '#fff',
                    color: showMorePhotos ? '#fff' : 'var(--primary-deep)',
                    border: '1.5px solid var(--primary-deep)',
                    padding: '11px 28px', borderRadius: '30px',
                    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', transition: 'all 0.25s ease'
                  }}
                >
                  <Sparkles size={15} />
                  {showMorePhotos ? 'Show Less' : `View All ${allImages.length} Photos`}
                  <ChevronDown size={15} style={{ transform: showMorePhotos ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s' }} />
                </button>
              </div>

              {/* Expanded photo grid */}
              {showMorePhotos && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {allImages.slice(4).map((url, idx) => (
                    <div
                      key={idx}
                      className="gallery-item"
                      style={{ height: '150px', cursor: 'pointer' }}
                      onClick={() => openLightbox(idx + 4)}
                    >
                      <img src={url} alt={`Malbagadh photo ${idx + 5}`} />
                      <div className="gallery-zoom-hint">🔍</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Lightbox Modal ── */}
      {lightboxOpen && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(5,10,8,0.96)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: '20px', right: '24px',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', width: '44px', height: '44px', borderRadius: '50%',
              fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >✕</button>

          {/* Counter */}
          <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); prevPhoto(); }}
            style={{
              position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', width: '52px', height: '52px', borderRadius: '50%',
              fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          ><ChevronLeft size={22} /></button>

          {/* Image */}
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <img
              src={allImages[lightboxIndex]}
              alt={`Malbagadh ${lightboxIndex + 1}`}
              style={{
                maxWidth: '100%', maxHeight: '80vh',
                objectFit: 'contain', borderRadius: '12px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                transition: 'opacity 0.2s'
              }}
            />
            {/* Thumbnail strip */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '80vw', paddingBottom: '4px' }}>
              {allImages.map((url, i) => (
                <div
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                  style={{
                    width: '56px', height: '40px', flexShrink: 0, borderRadius: '6px',
                    overflow: 'hidden', cursor: 'pointer',
                    border: i === lightboxIndex ? '2px solid var(--secondary-accent)' : '2px solid transparent',
                    opacity: i === lightboxIndex ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); nextPhoto(); }}
            style={{
              position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', width: '52px', height: '52px', borderRadius: '50%',
              fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          ><ChevronRight size={22} /></button>
        </div>
      )}

      {/* ── Booking Section ── */}
      <section id="booking" style={{ padding: '0', background: 'linear-gradient(160deg, #0D1612 0%, #1A3E2D 60%, #2A5A43 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* Background texture overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('/assets/nature.png')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />

        <div className="container" style={{ position: 'relative', zIndex: 2, padding: '80px 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', background: 'rgba(197,168,128,0.15)', border: '1px solid rgba(197,168,128,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
              <CalendarIcon size={14} style={{ color: 'var(--secondary-accent)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--secondary-accent)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Plan Your Visit</span>
            </div>
            <h2 style={{ fontSize: '2.8rem', color: '#fff', marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>Reserve Your Stay</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: '460px', margin: '0 auto' }}>Check availability and secure your dates at Malbagadh</p>
          </div>

          {/* Tab switcher - commented out as requested */}
          {/* 
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '4px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {[{ id: 'dates', label: 'Check Dates', icon: <ShieldCheck size={15} /> }, { id: 'calendar', label: 'View Calendar', icon: <CalendarIcon size={15} /> }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setBookingTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '10px 24px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.88rem',
                    transition: 'all 0.25s ease',
                    background: bookingTab === tab.id ? '#fff' : 'transparent',
                    color: bookingTab === tab.id ? 'var(--primary-deep)' : 'rgba(255,255,255,0.65)',
                    boxShadow: bookingTab === tab.id ? '0 2px 12px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
          */}

          {/* ── TAB: Check Dates ── */}
          {bookingTab === 'dates' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', maxWidth: '1000px', margin: '0 auto', alignItems: 'start' }}>
              {/* Left — Image + info */}
              <div style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', height: '580px' }}>
                <img
                  src="/assets/exterior.png"
                  alt="Malbagadh"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Overlay gradient */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,25,18,0.88) 0%, rgba(10,25,18,0.1) 55%)' }} />
                {/* Info pills at bottom */}
                <div style={{ position: 'absolute', bottom: '28px', left: '24px', right: '24px' }}>
                  <h3 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '16px' }}>Malbagadh Homestay</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { icon: '🌿', text: 'Betalghat Forest' },
                      { icon: '🏔️', text: 'Kyari Village, Almora' },
                      { icon: '👥', text: 'Up to 12 Guests' },
                      { icon: '⭐', text: '4.94 on Airbnb' }
                    ].map(({ icon, text }) => (
                      <span key={text} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.78rem', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                        {icon} {text}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--secondary-accent)', fontSize: '0.82rem', fontWeight: 600 }}>From ₹12,000 / night</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Direct booking available</span>
                  </div>
                </div>
              </div>

              {/* Right — Form */}
              <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '20px', padding: '36px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--primary-deep)', marginBottom: '6px' }}>Request Booking</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>Select your dates & enter your number to notify the owner</p>

                <form onSubmit={checkAvailability} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  {/* ── Custom date range picker ── */}
                  <div ref={pickerRef} style={{ position: 'relative' }}>
                    {/* Trigger row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {/* Check In trigger */}
                      <div
                        onClick={() => { setDatePickerOpen(datePickerOpen === 'in' ? false : 'in'); if (datePickerOpen !== 'in') { setPickerMonth(checkIn ? new Date(checkIn + 'T00:00:00').getMonth() : today.getMonth()); setPickerYear(checkIn ? new Date(checkIn + 'T00:00:00').getFullYear() : today.getFullYear()); } }}
                        style={{
                          border: `2px solid ${datePickerOpen === 'in' ? 'var(--primary-deep)' : 'rgba(42,90,67,0.2)'}`,
                          borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                          background: '#fff', transition: 'border-color 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Check In</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: checkIn ? 'var(--primary-deep)' : '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarIcon size={14} style={{ color: 'var(--secondary-accent)', flexShrink: 0 }} />
                          {checkIn ? fmt(checkIn) : 'Add date'}
                        </div>
                      </div>
                      {/* Check Out trigger */}
                      <div
                        onClick={() => { setDatePickerOpen(datePickerOpen === 'out' ? false : 'out'); if (datePickerOpen !== 'out') { setPickerMonth(checkOut ? new Date(checkOut + 'T00:00:00').getMonth() : (checkIn ? new Date(checkIn + 'T00:00:00').getMonth() : today.getMonth())); setPickerYear(checkOut ? new Date(checkOut + 'T00:00:00').getFullYear() : today.getFullYear()); } }}
                        style={{
                          border: `2px solid ${datePickerOpen === 'out' ? 'var(--primary-deep)' : 'rgba(42,90,67,0.2)'}`,
                          borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                          background: '#fff', transition: 'border-color 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Check Out</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: checkOut ? 'var(--primary-deep)' : '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarIcon size={14} style={{ color: 'var(--secondary-accent)', flexShrink: 0 }} />
                          {checkOut ? fmt(checkOut) : 'Add date'}
                        </div>
                      </div>
                    </div>

                    {/* Calendar dropdown */}
                    {datePickerOpen && (() => {
                      const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                      const firstDay = new Date(pickerYear, pickerMonth, 1).getDay();
                      const cells = [];
                      for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                      for (let d = 1; d <= daysInMonth; d++) {
                        const ds = `${pickerYear}-${String(pickerMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                        const isPast = ds < todayStr;
                        const isCheckIn = ds === checkIn;
                        const isCheckOut = ds === checkOut;
                        const inRange = checkIn && checkOut && ds > checkIn && ds < checkOut;
                        const isToday = ds === todayStr;
                        const isMinOut = datePickerOpen === 'out' && checkIn && ds <= checkIn;
                        const disabled = isPast || isMinOut;
                        cells.push(
                          <div
                            key={d}
                            onClick={() => {
                              if (disabled) return;
                              if (datePickerOpen === 'in') {
                                setCheckIn(ds);
                                if (checkOut && ds >= checkOut) setCheckOut('');
                                setAvailabilityStatus(null);
                                setDatePickerOpen('out');
                                setPickerMonth(new Date(ds + 'T00:00:00').getMonth());
                                setPickerYear(new Date(ds + 'T00:00:00').getFullYear());
                              } else {
                                setCheckOut(ds);
                                setAvailabilityStatus(null);
                                setDatePickerOpen(false);
                              }
                            }}
                            style={{
                              height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: isCheckIn || isCheckOut ? '50%' : inRange ? '0' : '50%',
                              background: isCheckIn || isCheckOut ? 'var(--primary-deep)' : inRange ? 'rgba(26,62,45,0.1)' : 'transparent',
                              color: isCheckIn || isCheckOut ? '#fff' : disabled ? '#ccc' : isToday ? 'var(--primary-deep)' : 'var(--text-dark)',
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              fontWeight: isCheckIn || isCheckOut || isToday ? 700 : 400,
                              fontSize: '0.85rem',
                              transition: 'background 0.15s',
                              position: 'relative',
                              outline: isToday && !isCheckIn && !isCheckOut ? '2px solid var(--secondary-accent)' : 'none',
                            }}
                            onMouseEnter={e => { if (!disabled && !isCheckIn && !isCheckOut) e.currentTarget.style.background = 'rgba(26,62,45,0.12)'; }}
                            onMouseLeave={e => { if (!disabled && !isCheckIn && !isCheckOut) e.currentTarget.style.background = inRange ? 'rgba(26,62,45,0.1)' : 'transparent'; }}
                          >
                            {d}
                          </div>
                        );
                      }
                      return (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                          background: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                          border: '1px solid rgba(0,0,0,0.08)', zIndex: 1000, padding: '20px',
                          animation: 'dropIn 0.18s ease'
                        }}>
                          {/* Month nav */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <button type="button" onClick={pickerPrevMonth} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: '#f8f8f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={14} /></button>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-deep)' }}>{monthNames[pickerMonth]} {pickerYear}</span>
                            <button type="button" onClick={pickerNextMonth} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: '#f8f8f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={14} /></button>
                          </div>
                          {/* Weekday headers */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '6px' }}>
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
                            ))}
                          </div>
                          {/* Days grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>{cells}</div>
                          {/* Hint */}
                          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                            {datePickerOpen === 'in' ? '👆 Select your check-in date' : '👆 Now pick check-out'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Guest counter ── */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Guests</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid rgba(42,90,67,0.2)', borderRadius: '10px', padding: '10px 16px', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={16} style={{ color: 'var(--secondary-accent)' }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-deep)' }}>
                          {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>max 12</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button"
                          onClick={() => setGuestCount(n => Math.max(1, n - 1))}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: '1.5px solid rgba(42,90,67,0.3)', background: guestCount <= 1 ? '#f5f5f5' : '#fff',
                            color: guestCount <= 1 ? '#ccc' : 'var(--primary-deep)',
                            fontSize: '1.2rem', cursor: guestCount <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', fontWeight: 600, lineHeight: 1
                          }}
                          disabled={guestCount <= 1}
                        >−</button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--primary-deep)' }}>{guestCount}</span>
                        <button type="button"
                          onClick={() => setGuestCount(n => Math.min(12, n + 1))}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: '1.5px solid rgba(42,90,67,0.3)', background: guestCount >= 12 ? '#f5f5f5' : 'var(--primary-deep)',
                            color: guestCount >= 12 ? '#ccc' : '#fff',
                            fontSize: '1.2rem', cursor: guestCount >= 12 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', fontWeight: 600, lineHeight: 1
                          }}
                          disabled={guestCount >= 12}
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* ── Mobile number field ── */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Your Mobile Number</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid rgba(42,90,67,0.2)', borderRadius: '10px', padding: '10px 16px', background: '#fff' }}>
                      <Phone size={16} style={{ color: 'var(--secondary-accent)' }} />
                      <input
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={userPhone}
                        onChange={e => { setUserPhone(e.target.value); setAvailabilityStatus(null); }}
                        style={{
                          border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem',
                          fontWeight: 600, color: 'var(--primary-deep)', fontFamily: 'var(--font-sans)', background: 'transparent'
                        }}
                      />
                    </div>
                  </div>

                  {checkIn && checkOut && (
                    <div style={{ background: 'var(--bg-cream)', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{getNights()} night{getNights() !== 1 ? 's' : ''} · {guestCount} guest{guestCount !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-deep)' }}>from ₹{(getNights() * 12000).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <button type="submit" style={{
                    width: '100%', padding: '15px', borderRadius: '10px',
                    background: 'var(--primary-deep)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontWeight: 700,
                    fontFamily: 'var(--font-sans)', fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(26,62,45,0.25)'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-deep)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <ShieldCheck size={18} /> Submit Booking Request
                  </button>
                </form>

                {/* Inline validation errors */}
                {availabilityStatus === 'missing-dates' && (
                  <div style={{ marginTop: '14px', background: '#FFFBEB', padding: '12px 16px', borderRadius: '10px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>📅</span>
                    <span style={{ fontSize: '0.88rem', color: '#92400E', fontWeight: 500 }}>Please pick both check-in and check-out dates above.</span>
                  </div>
                )}
                {availabilityStatus === 'bad-dates' && (
                  <div style={{ marginTop: '14px', background: '#FFFBEB', padding: '12px 16px', borderRadius: '10px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>⚠️</span>
                    <span style={{ fontSize: '0.88rem', color: '#92400E', fontWeight: 500 }}>Check-out must be after check-in. Please adjust your dates.</span>
                  </div>
                )}
                {availabilityStatus === 'missing-phone' && (
                  <div style={{ marginTop: '14px', background: '#FFFBEB', padding: '12px 16px', borderRadius: '10px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>📱</span>
                    <span style={{ fontSize: '0.88rem', color: '#92400E', fontWeight: 500 }}>Please enter a valid 10-digit mobile number to proceed.</span>
                  </div>
                )}

                {/* Checking */}
                {availabilityStatus === 'checking' && (
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', justifyContent: 'center' }}>
                    <RefreshCw className="animate-spin" size={15} />
                    <span style={{ fontSize: '0.9rem' }}>Sending booking request…</span>
                  </div>
                )}

                {/* Request Sent Success Card */}
                {availabilityStatus === 'request-sent' && (
                  <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', padding: '22px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <ShieldCheck size={22} style={{ color: '#16A34A', flexShrink: 0 }} />
                      <strong style={{ fontSize: '1rem', color: '#14532D' }}>Booking Request Received! 🎉</strong>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#166534', marginBottom: '14px', lineHeight: 1.5 }}>
                      Thank you! Your request has been logged. We will contact you at <strong>{userPhone}</strong> shortly to confirm your reservation.
                    </p>
                    <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #BBF7D0', fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: 1.6 }}>
                      <div><strong>Mobile Number:</strong> {userPhone}</div>
                      <div><strong>Check-in → Check-out:</strong> {fmt(checkIn)} → {fmt(checkOut)} ({getNights()} night{getNights() !== 1 ? 's' : ''})</div>
                      <div><strong>Guests:</strong> {guestCount} guest{guestCount !== 1 ? 's' : ''}</div>
                      <div><strong>Estimated Total:</strong> ₹{(getNights() * 12000).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Calendar - commented out as requested ── */}
          {/* 
          {bookingTab === 'calendar' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '20px', padding: '36px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--primary-deep)', marginBottom: '4px' }}>Availability Calendar</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time view of bookings across all platforms</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={handlePrevMonth} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
                    <span style={{ fontWeight: 600, color: 'var(--primary-deep)', minWidth: '140px', textAlign: 'center' }}>{monthNames[currentMonth]} {currentYear}</span>
                    <button onClick={handleNextMonth} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
                  </div>
                </div>

                <div className="calendar-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="calendar-day-header">{d}</div>
                  ))}
                  {renderCalendar()}
                </div>

                <div className="calendar-legend" style={{ marginTop: '24px' }}>
                  <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#FF5A5F' }} /><span>Airbnb</span></div>
                  <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#00778B' }} /><span>Skyscanner</span></div>
                  <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#385E8A' }} /><span>Rent By Owner</span></div>
                  <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#F89B2B' }} /><span>JustDial</span></div>
                  <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: 'var(--primary-deep)' }} /><span>Direct</span></div>
                </div>
              </div>
            </div>
          )}
          */}
        </div>
      </section>

      {/* ── Reviews Section ── */}
      <section id="reviews" className="reviews-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--primary-deep)', marginBottom: '10px' }}>What Our Guests Say</h2>
            <p style={{ color: 'var(--text-muted)' }}>Verified reviews from real guests who've stayed at Malbagadh</p>
          </div>

          <div className="platform-filter-bar" style={{ justifyContent: 'center' }}>
            {['All', 'Airbnb', 'Rent By Owner', 'JustDial', 'Skyscanner'].map(plat => (
              <button
                key={plat}
                className={`filter-btn ${activeFilter === plat ? 'active' : ''}`}
                onClick={() => handleFilterChange(plat)}
              >
                {plat}
              </button>
            ))}
          </div>

          <div className="grid-cols-2">
            {sortedReviews.slice(0, visibleReviewsCount).map(r => (
              <div key={r.id} className="review-card">
                <div>
                  <div className="review-header">
                    <div className="review-author">
                      <img src={r.avatar} alt={r.author} className="review-avatar" />
                      <div>
                        <div className="author-name">{r.author}</div>
                        <div className="review-date">{r.date}</div>
                      </div>
                    </div>
                    <span className={`platform-tag tag-${r.platform.toLowerCase().replace(/\s+/g, '')}`}>
                      {r.platform}
                    </span>
                  </div>
                  <div className="review-stars">
                    {Array.from({ length: Math.round(r.rating) }).map((_, i) => <span key={i}>★</span>)}
                    {Array.from({ length: 5 - Math.round(r.rating) }).map((_, i) => <span key={i} style={{ color: '#ddd' }}>★</span>)}
                  </div>
                  <p className="review-comment">"{r.comment}"</p>
                </div>
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', textAlign: 'right' }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    View original review <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {sortedReviews.length > visibleReviewsCount && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                onClick={() => setVisibleReviewsCount(p => p + 10)}
                className="btn-secondary"
                style={{ padding: '12px 32px', borderColor: 'var(--primary-deep)', color: 'var(--primary-deep)', fontWeight: 600 }}
              >
                Show More Reviews
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Find Us Section ── */}
      <section id="listings" style={{ padding: '80px 0', background: 'var(--bg-cream)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--primary-deep)', marginBottom: '12px' }}>Also Listed On</h2>
            <p style={{ color: 'var(--text-muted)' }}>Find and book Malbagadh on your preferred travel platform</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { name: 'Airbnb', color: '#FF5A5F', badge: 'Guest Favourite', rating: '4.94', votes: '49 Reviews', url: 'https://www.airbnb.co.in/rooms/15366399', cta: 'View on Airbnb' },
              { name: 'Rent By Owner', color: '#385E8A', badge: 'Verified', rating: '10.0', votes: '3 Reviews', url: 'https://www.rentbyowner.com/property/corbett-malbagadh-an-experience-with-nature/AB-15366399', cta: 'View on RBO' },
              { name: 'Skyscanner', color: '#00778B', badge: 'Boutique', rating: '5.0', votes: '1 Rating', url: 'https://www.skyscanner.qa/hotels/india/almora-hotels/corbett-malbagadh/ht-225130046', cta: 'View on Skyscanner' },
              { name: 'JustDial', color: '#F89B2B', badge: 'Local Favourite', rating: '5.0', votes: '22 Votes', url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET', cta: 'View on JustDial' }
            ].map(p => (
              <div key={p.name} style={{
                background: '#fff', borderRadius: 'var(--radius-md)', padding: '28px',
                border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: p.color }}>{p.name}</span>
                    <span style={{ background: `${p.color}15`, color: p.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '10px', textTransform: 'uppercase' }}>{p.badge}</span>
                  </div>
                  <div style={{ color: '#FFC107', marginBottom: '6px' }}>★★★★★ <span style={{ color: 'var(--text-dark)', fontSize: '0.88rem', fontWeight: 600 }}>{p.rating}</span></div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>{p.votes}</p>
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  border: `1.5px solid ${p.color}`, color: p.color,
                  padding: '10px', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem',
                  transition: 'background 0.2s', background: 'transparent'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${p.color}12`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {p.cta} <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <img src="/assets/malbagadh_sign.jpg" alt="Malbagadh" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--secondary-accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Malbagadh Homestay</h3>
              </div>
              <p style={{ marginBottom: '16px', color: 'rgba(244,246,245,0.55)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                A secluded hilltop sanctuary above Kyari village, deep inside the Betalghat forests of Kumaon. Solitude, homemade meals, and wildlife — just as nature intended.
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--secondary-accent)' }}>📍 Jakh, Almora, Uttarakhand (Near Jim Corbett)</p>
            </div>
            <div>
              <h4 style={{ marginBottom: '16px' }}>Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#about">Our Story</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#booking">Book a Stay</a></li>
                <li><a href="#reviews">Guest Reviews</a></li>
                <li><a href="#listings">Other Platforms</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '16px' }}>Contact Us</h4>
              <ul className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>
                  <a href={`https://wa.me/${WA_NUMBER}?text=Hi%2C%20I'd%20like%20to%20enquire%20about%20Malbagadh%20Homestay.`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25D366' }}>
                    <WhatsAppIcon size={16} /> +91 99897 50728
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/malbagadh/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E1306C' }}>
                    <InstagramIcon size={16} /> @malbagadh
                  </a>
                </li>
                <li>
                  <a href="https://www.airbnb.co.in/rooms/15366399" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExternalLink size={14} /> Airbnb Listing
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(244,246,245,0.35)' }}>
            <p>© {new Date().getFullYear()} Malbagadh Homestay · Kyari Village, Almora, Uttarakhand</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
