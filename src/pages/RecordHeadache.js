// First, you'll need to import ALL the images at the top of RecordHeadache.js:

import migrainerHeadacheImg from '../assets/headache-types/migraine-headache.png';
import tensionHeadacheImg from '../assets/headache-types/tension-headache.png';
import reboundHeadacheImg from '../assets/headache-types/rebound-headache.png';
import exertionHeadacheImg from '../assets/headache-types/exertion-headache.png';
import caffeineHeadacheImg from '../assets/headache-types/caffeine-headache.png';
import hormoneHeadacheImg from '../assets/headache-types/hormone-headache.png';
import clusterHeadacheImg from '../assets/headache-types/cluster-headache.png';
import sinusHeadacheImg from '../assets/headache-types/sinus-headache.png';
import hemicraniaHeadacheImg from '../assets/headache-types/hemicrania-continua.png';
import hypertensionHeadacheImg from '../assets/headache-types/hypertension-headache.png';
import postTraumaticHeadacheImg from '../assets/headache-types/post-traumatic-headache.png';
import spinalHeadacheImg from '../assets/headache-types/spinal-headache.png';
import thunderclapHeadacheImg from '../assets/headache-types/thunderclap-headache.png';
import icePickHeadacheImg from '../assets/headache-types/ice-pick-headache.png';

// Then update the headacheTypes array with all images:

const headacheTypes = [
  {
    id: 'tension',
    name: 'Tension Headache',
    description: 'Band around head/forehead',
    icon: 'fas fa-head-side-virus',
    image: tensionHeadacheImg,
    pattern: 'Band-like pressure around the entire head'
  },
  {
    id: 'migraine',
    name: 'Migraine Headache',
    description: 'One side of head',
    icon: 'fas fa-head-side-cough',
    image: migrainerHeadacheImg,
    pattern: 'Throbbing pain, usually on one side'
  },
  {
    id: 'rebound',
    name: 'Medication Overuse Headache',
    description: 'All over/top (rebound)',
    icon: 'fas fa-pills',
    image: reboundHeadacheImg,
    pattern: 'Medication overuse headache'
  },
  {
    id: 'exertion',
    name: 'Exertion Headache',
    description: 'Back/all over',
    icon: 'fas fa-running',
    image: exertionHeadacheImg,
    pattern: 'Exercise-induced headache'
  },
  {
    id: 'caffeine',
    name: 'Caffeine Headache',
    description: 'Front/temples',
    icon: 'fas fa-coffee',
    image: caffeineHeadacheImg,
    pattern: 'Dull ache at temples and front of head'
  },
  {
    id: 'hormone',
    name: 'Hormone Headache',
    description: 'One side (menstrual migraine)',
    icon: 'fas fa-moon',
    image: hormoneHeadacheImg,
    pattern: 'Related to hormonal changes'
  },
  {
    id: 'cluster',
    name: 'Cluster Headache',
    description: 'Around one eye',
    icon: 'fas fa-eye',
    image: clusterHeadacheImg,
    pattern: 'Severe pain around or behind one eye'
  },
  {
    id: 'sinus',
    name: 'Allergy or Sinus',
    description: 'Forehead/cheek area',
    icon: 'fas fa-head-side-mask',
    image: sinusHeadacheImg,
    pattern: 'Not a headache disorder but symptom description'
  },
  {
    id: 'hemicrania',
    name: 'Hemicrania Continua',
    description: 'One side continuous',
    icon: 'fas fa-clock',
    image: hemicraniaHeadacheImg,
    pattern: 'Continuous one-sided headache'
  },
  {
    id: 'hypertension',
    name: 'Hypertension Headache',
    description: 'Back of head/neck',
    icon: 'fas fa-heartbeat',
    image: hypertensionHeadacheImg,
    pattern: 'Back of head related to high blood pressure'
  },
  {
    id: 'post-traumatic',
    name: 'Post-Traumatic Headache',
    description: 'Multiple scattered areas',
    icon: 'fas fa-brain',
    image: postTraumaticHeadacheImg,
    pattern: 'Following head injury or trauma'
  },
  {
    id: 'spinal',
    name: 'Spinal Headache',
    description: 'Back of head/neck',
    icon: 'fas fa-spine',
    image: spinalHeadacheImg,
    pattern: 'Related to spinal fluid pressure'
  },
  {
    id: 'thunderclap',
    name: 'Thunderclap Headache',
    description: 'Sudden severe (multiple spots)',
    icon: 'fas fa-bolt',
    image: thunderclapHeadacheImg,
    pattern: 'Sudden, severe headache (seek immediate medical attention)'
  },
  {
    id: 'ice-pick',
    name: 'Ice Pick Headache',
    description: 'Sharp isolated spots',
    icon: 'fas fa-map-pin',
    image: icePickHeadacheImg,
    pattern: 'Brief, sharp, stabbing pains'
  }
];

// Update the image container and styling in the 'headache-location' case:

case 'headache-location':
  const currentType = headacheTypes[currentSlide];
  
  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      {/* ... other code remains the same ... */}

      {/* Content - Clean, no cards */}
      <div style={{ textAlign: 'center', padding: '0 4rem', width: '100%' }}>
        {/* Image/Icon Area - BIGGER SIZE */}
        <div style={{ 
          height: '200px', // Increased from 140px
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {currentType.image ? (
            <img 
              src={currentType.image} 
              alt={currentType.name}
              style={{ 
                maxHeight: '180px', // Increased from 120px
                maxWidth: '180px',  // Increased from 120px
                objectFit: 'contain',
                transition: 'all 0.3s ease',
                filter: formData.location === currentType.name ? 'none' : 'grayscale(30%)', // Reduced grayscale for better visibility
                transform: formData.location === currentType.name ? 'scale(1.05)' : 'scale(1)', // Add slight scale effect
                boxShadow: formData.location === currentType.name ? '0 8px 25px rgba(70, 130, 180, 0.3)' : 'none' // Add shadow when selected
              }}
            />
          ) : (
            <i 
              className={currentType.icon} 
              style={{ 
                fontSize: '6rem', // Increased from 5rem
                color: formData.location === currentType.name ? '#4682B4' : '#9CA3AF',
                transition: 'all 0.3s ease'
              }}
            ></i>
          )}
        </div>
        
        {/* ... rest of the content remains the same ... */}
      </div>
      
      {/* ... rest of the slider code remains the same ... */}
    </div>
  );
