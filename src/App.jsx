import React, { useEffect, useRef, useState } from 'react';
import { Github, Linkedin, Mail, ChevronDown, Code, Database, TreePine, Scan, Layers, Terminal, Award, BookOpen, Cloud, Cpu, Plane, FileText, GraduationCap, Globe, Link as LinkIcon, Send, ArrowUp } from 'lucide-react';

/**
 * UTILITIES & HOOKS
 * ------------------------------------------------------------------
 */

// Hook for smooth scrolling and Scroll Progress
const useSmoothScroll = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollY };
};

/**
 * 3D BACKGROUND COMPONENT (Three.js)
 * Features Dynamic Texture Switching based on Scroll
 * ------------------------------------------------------------------
 */
const LidarForest = ({ scrollY }) => {
  const mountRef = useRef(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    scrollRef.current = scrollY;
  }, [scrollY]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = initThree;
    document.body.appendChild(script);

    let scene, camera, renderer, frameId;
    let terrainSystem, treeSystem, globeGroup, sphereSystem;
    let earthMeshNight, earthMeshDay, atmoMesh;
    let sat1, sat2, sat3;

    function initThree() {
      if (!mountRef.current) return;

      const THREE = window.THREE;
      const isMobile = window.innerWidth < 768;

      // 1. Scene Setup
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050505, isMobile ? 0.02 : 0.015);

      // 2. Camera
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 8, isMobile ? 45 : 35); 

      // 3. Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      // --- LAYER 1: LiDAR TERRAIN ---
      const groundGeo = new THREE.BufferGeometry();
      const groundCount = isMobile ? 6000 : 16000; 
      const gPos = [];
      const gCols = [];
      const cWater = new THREE.Color(0x1e40af);
      const cGround = new THREE.Color(0x064e3b);
      const cHigh = new THREE.Color(0x10b981);

      for (let i = 0; i < groundCount; i++) {
        const x = (Math.random() - 0.5) * (isMobile ? 200 : 400);
        const z = (Math.random() - 0.5) * (isMobile ? 200 : 400);
        const y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 6 - 10;

        gPos.push(x, y, z);

        let color = cWater;
        if (y > -11) color = cGround;
        if (y > -7) color = cHigh;
        gCols.push(color.r, color.g, color.b);
      }
      groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPos, 3));
      groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(gCols, 3));
      const groundMat = new THREE.PointsMaterial({ size: isMobile ? 0.25 : 0.18, vertexColors: true, transparent: true, opacity: 0.6 });
      terrainSystem = new THREE.Points(groundGeo, groundMat);
      scene.add(terrainSystem);

      // Trees
      const treeGeo = new THREE.BufferGeometry();
      const treeCount = isMobile ? 800 : 2500;
      const tPos = [];
      const tCols = [];

      for (let i = 0; i < treeCount; i++) {
        const x = (Math.random() - 0.5) * (isMobile ? 200 : 400);
        const z = (Math.random() - 0.5) * (isMobile ? 200 : 400);
        const y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 6 - 10;

        if (y > -8) { 
            const h = Math.random() * 5 + 3;
            tPos.push(x, y, z);
            tPos.push(x, y + h, z);
            tCols.push(0.02, 0.3, 0.2); 
            tCols.push(0.2, 0.9, 0.5); 
        }
      }
      treeGeo.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3));
      treeGeo.setAttribute('color', new THREE.Float32BufferAttribute(tCols, 3));
      const treeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 });
      treeSystem = new THREE.LineSegments(treeGeo, treeMat);
      scene.add(treeSystem);

      // --- LAYER 2: DYNAMIC EARTH GLOBE ---
      globeGroup = new THREE.Group();
      globeGroup.position.set(isMobile ? 0 : 25, 10, -15); 
      scene.add(globeGroup);

      // Load Textures
      const textureLoader = new THREE.TextureLoader();
      // Night Texture (Start)
      const nightTex = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/1024px-The_earth_at_night.jpg');
      // Day/Topo Texture (Scroll Goal)
      const dayTex = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Blue_Marble_2002.png/1024px-Blue_Marble_2002.png');

      const earthGeo = new THREE.SphereGeometry(15, 64, 64); 

      // Mesh 1: Night (Always visible initially)
      const nightMat = new THREE.MeshBasicMaterial({ map: nightTex, transparent: true, opacity: 1, color: 0xffffff });
      earthMeshNight = new THREE.Mesh(earthGeo, nightMat);
      globeGroup.add(earthMeshNight);

      // Mesh 2: Day (Fades in on scroll)
      const dayMat = new THREE.MeshBasicMaterial({ map: dayTex, transparent: true, opacity: 0, color: 0xdddddd });
      earthMeshDay = new THREE.Mesh(earthGeo, dayMat);
      // Slightly larger to prevent z-fighting, or render order trick
      earthMeshDay.scale.set(1.001, 1.001, 1.001); 
      globeGroup.add(earthMeshDay);

      // Atmospheric Glow
      const atmoGeo = new THREE.SphereGeometry(16.5, 64, 64);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      globeGroup.add(atmoMesh);

      // Satellites
      const satGeo = new THREE.SphereGeometry(isMobile ? 0.4 : 0.25, 16, 16);
      const satMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      sat1 = new THREE.Mesh(satGeo, satMat);
      sat2 = new THREE.Mesh(satGeo, satMat);
      sat3 = new THREE.Mesh(satGeo, satMat);
      globeGroup.add(sat1);
      globeGroup.add(sat2);
      globeGroup.add(sat3);

      // Orbital Rings
      const ringGeo = new THREE.TorusGeometry(19, 0.1, 64, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.2 });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      ring1.rotation.x = Math.PI / 2.2;
      globeGroup.add(ring1);


      // 4. Animation Loop
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        const currentScroll = scrollRef.current;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const scrollProgress = maxScroll > 0 ? Math.min(currentScroll / maxScroll, 1) : 0;
        const time = Date.now() * 0.0005;

        // --- DYNAMIC TEXTURE BLENDING ---
        if (earthMeshDay && earthMeshNight) {
            const fadeStart = 0.2;
            const fadeEnd = 0.8;
            let opacity = 0;
            
            if (scrollProgress > fadeStart) {
                opacity = (scrollProgress - fadeStart) / (fadeEnd - fadeStart);
                opacity = Math.min(Math.max(opacity, 0), 1);
            }
            
            earthMeshDay.material.opacity = opacity;
        }

        // --- CAMERA MOVEMENT ---
        let targetCamPos = { x: 0, y: 8, z: 35 };
        let targetCamRot = { x: 0, y: 0, z: 0 };

        if(isMobile) {
             if (currentScroll < 500) {
                targetCamPos = { x: 0, y: 8, z: 45 }; 
             } else if (currentScroll < 2000) {
                targetCamPos = { x: 0, y: 20, z: 50 }; 
                targetCamRot = { x: -0.3, y: 0, z: 0 }; 
             } else {
                targetCamPos = { x: 0, y: 30, z: 60 }; 
                targetCamRot = { x: -0.2, y: 0, z: 0 };
             }
        } else {
            if (currentScroll < 800) {
                targetCamPos = { x: 0, y: 8 + (currentScroll * 0.01), z: 35 };
            } else if (currentScroll < 1800) {
                targetCamPos = { x: 0, y: 30, z: 15 };
                targetCamRot = { x: -0.5, y: 0, z: 0 };
            } else if (currentScroll < 2800) {
                targetCamPos = { x: -20, y: 15, z: 30 };
                targetCamRot = { x: -0.2, y: -0.5, z: 0 };
            } else {
                targetCamPos = { x: 0, y: 40, z: 60 };
                targetCamRot = { x: -0.4, y: 0, z: 0 };
            }
        }

        camera.position.x += (targetCamPos.x - camera.position.x) * 0.03;
        camera.position.y += (targetCamPos.y - camera.position.y) * 0.03;
        camera.position.z += (targetCamPos.z - camera.position.z) * 0.03;
        
        camera.rotation.x += (targetCamRot.x - camera.rotation.x) * 0.03;
        camera.rotation.y += (targetCamRot.y - camera.rotation.y) * 0.03;

        // Terrain
        const speed = 0.1 + (scrollProgress * 0.2); 
        if(terrainSystem) {
            const pos = terrainSystem.geometry.attributes.position.array;
            for(let i=2; i<pos.length; i+=3) {
                pos[i] += speed;
                if(pos[i] > 50) pos[i] -= (isMobile ? 200 : 400);
            }
            terrainSystem.geometry.attributes.position.needsUpdate = true;
        }
        if(treeSystem) {
             const pos = treeSystem.geometry.attributes.position.array;
             for(let i=2; i<pos.length; i+=3) {
                 pos[i] += speed;
                 if(pos[i] > 50) pos[i] -= (isMobile ? 200 : 400);
             }
             treeSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Globe & Satellites
        if(globeGroup) {
            globeGroup.rotation.y += 0.002 + (scrollProgress * 0.005); 
            if(isMobile) {
                globeGroup.position.y = 12 + (scrollProgress * 20);
            }

            if(sat1) { sat1.position.x = Math.cos(time * 2) * 18; sat1.position.z = Math.sin(time * 2) * 18; }
            if(sat2) { sat2.position.x = Math.cos(time * 1.5) * 20; sat2.position.y = Math.sin(time * 1.5) * 20; }
            if(sat3) { sat3.position.y = Math.cos(time * 2.5) * 19; sat3.position.z = Math.sin(time * 2.5) * 19; }
        }

        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', () => {});
      if (mountRef.current && mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    };
  }, []); 

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none opacity-100" />;
};

/**
 * SCROLL TO TOP COMPONENT
 * ------------------------------------------------------------------
 */
const ScrollToTop = ({ scrollY }) => {
  const isVisible = scrollY > 500;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/50 transition-all duration-500 transform hover:scale-110 hover:bg-emerald-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  );
};

/**
 * CONTACT FORM COMPONENT
 * ------------------------------------------------------------------
 */
const ContactForm = () => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = "ergincagataycankaya@gmail.com";
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject || "Portfolio Inquiry")}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoLink;
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto mt-8 p-6 bg-[#0a0a0a]/80 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Send className="w-5 h-5 text-emerald-400" />
        Send a Direct Message
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1">Subject</label>
          <input 
            type="text" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Project Inquiry / Hello"
            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1">Message</label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows="4"
            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20"
        >
          Send Email <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

/**
 * UI COMPONENTS
 * ------------------------------------------------------------------
 */

const Section = ({ title, children, className = "", id = "" }) => (
  <section id={id} className={`py-16 md:py-24 px-6 relative z-10 max-w-6xl mx-auto ${className}`}>
    {title && (
      <h2 className="text-3xl md:text-5xl font-bold mb-12 md:mb-16 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 inline-block">
        {title}
      </h2>
    )}
    {children}
  </section>
);

const Card = ({ title, subtitle, date, children, icon: Icon, tags = [] }) => (
  <div className="group relative p-6 md:p-8 bg-gray-900/60 backdrop-blur-lg border border-gray-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-2xl shadow-black/50">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-2">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors leading-tight">{title}</h3>
          {subtitle && <p className="text-emerald-200/80 font-medium text-sm">{subtitle}</p>}
        </div>
        {date && <span className="text-xs font-mono text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700 whitespace-nowrap w-fit">{date}</span>}
      </div>
      <div className="text-gray-400 leading-relaxed text-sm md:text-base mb-6">
        {children}
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.map((tag, i) => (
            <span key={i} className="text-xs border border-emerald-500/20 text-emerald-300/90 px-2 py-1 rounded bg-emerald-500/5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {Icon && (
        <Icon className="absolute -bottom-6 -right-6 w-24 h-24 md:w-32 md:h-32 text-gray-800/30 group-hover:text-emerald-900/20 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12" />
      )}
    </div>
  </div>
);

const SkillBadge = ({ icon: Icon, name, color = "text-emerald-400", category }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-emerald-500/30 hover:bg-gray-800/50 transition-all duration-300 group h-full">
    <Icon className={`w-8 h-8 ${color} mb-3 group-hover:scale-110 transition-transform`} />
    <span className="text-gray-300 font-medium text-center text-sm">{name}</span>
  </div>
);

/**
 * MAIN APP COMPONENT
 * ------------------------------------------------------------------
 */
const App = () => {
  const { scrollY } = useSmoothScroll();

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      
      {/* 3D Background - Now Responsive & Dynamic Textures */}
      <LidarForest scrollY={scrollY} />
      
      {/* Scroll To Top Button */}
      <ScrollToTop scrollY={scrollY} />

      {/* Navigation - Removed main headings as they are now in hero */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="text-xl md:text-2xl font-bold tracking-tighter">
          EC<span className="text-emerald-500">.</span>
        </div>
        
        <div className="flex gap-4">
          <a href="https://www.linkedin.com/in/ergincagataycankaya/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            <Linkedin className="w-5 h-5" />
          </a>
          <a 
            href="mailto:ergin@ualberta.ca" 
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all duration-300 text-xs md:text-sm font-medium tracking-wide"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex flex-col justify-center px-6 md:px-20 z-10 pt-20">
        <div 
          className="max-w-5xl"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }} 
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-mono mb-6 md:mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Geospatial Data Scientist • 10+ Years Experience
          </div>
          
          {/* Responsive Text Sizes */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] md:leading-[0.9] mb-6 md:mb-8 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Ergin C.<br />Cankaya
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl leading-relaxed mb-8 md:mb-12">
            I architect <strong>cloud-ready geospatial data lakes</strong> and <strong>ML/DL pipelines</strong> for precision forestry. 
            Specializing in fusing <span className="text-emerald-400">multi-platform LiDAR</span> with <span className="text-blue-400">digital intelligence</span> to quantify natural resources at scale.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href="#projects" className="group relative px-6 py-3 bg-emerald-500 text-black font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 text-center shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative group-hover:text-black">Explore Work</span>
            </a>
            
            <a href="#certifications" className="px-6 py-3 rounded-full border border-white/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 text-center group">
              <Award className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
              <span className="group-hover:text-white transition-colors">Certifications</span>
            </a>
            
            {/* Formatted Buttons: Same style as Certifications */}
            <a href="#technical" className="px-6 py-3 rounded-full border border-white/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 text-center group text-white">
              <Terminal className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
              <span className="group-hover:text-white transition-colors">Technology</span>
            </a>
            
            <a href="#projects" className="px-6 py-3 rounded-full border border-white/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 text-center group text-white">
              <Database className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
              <span className="group-hover:text-white transition-colors">Research</span>
            </a>
            
            <a href="#education" className="px-6 py-3 rounded-full border border-white/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 text-center group text-white">
              <GraduationCap className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
              <span className="group-hover:text-white transition-colors">Education</span>
            </a>
            
            <a href="#honors" className="px-6 py-3 rounded-full border border-white/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 text-center group text-white">
              <Award className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
              <span className="group-hover:text-white transition-colors">Honors</span>
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 w-full flex justify-center animate-bounce opacity-50">
          <ChevronDown className="w-8 h-8 text-gray-600" />
        </div>
      </header>

      {/* Content Wrapper */}
      <div className="relative z-20">
        
        {/* Technical Stack - Added ID */}
        <Section title="Technical Stack" id="technical">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            {/* Languages & Scripting */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8 hover:border-emerald-500/30 transition-colors backdrop-blur-sm">
               <div className="flex items-center gap-3 mb-6 text-emerald-400">
                  <Terminal className="w-6 h-6" />
                  <h3 className="text-lg md:text-xl font-bold text-white">Languages</h3>
               </div>
               <ul className="space-y-3 text-gray-400 text-sm md:text-base">
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>R Programming (Advanced)</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Python (Geospatial/ML)</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>SQL / PostgreSQL</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>Bash / Shell Scripting</li>
               </ul>
            </div>

            {/* Geospatial & Deep Learning */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8 hover:border-blue-500/30 transition-colors backdrop-blur-sm">
               <div className="flex items-center gap-3 mb-6 text-blue-400">
                  <Cpu className="w-6 h-6" />
                  <h3 className="text-lg md:text-xl font-bold text-white">Geospatial & DL</h3>
               </div>
               <ul className="space-y-3 text-gray-400 text-sm md:text-base">
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>LiDAR (ALS/TLS/MLS)</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>ArcGIS Pro / QGIS</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>PyTorch / TensorFlow</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>Computer Vision (CNNs)</li>
               </ul>
            </div>

            {/* DevOps & Cloud */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8 hover:border-purple-500/30 transition-colors backdrop-blur-sm">
               <div className="flex items-center gap-3 mb-6 text-purple-400">
                  <Cloud className="w-6 h-6" />
                  <h3 className="text-lg md:text-xl font-bold text-white">DevOps & Cloud</h3>
               </div>
               <ul className="space-y-3 text-gray-400 text-sm md:text-base">
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>Docker / Containers</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>Distributed Computing</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white"></div>Git / CI/CD Pipelines</li>
                  <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>Cloud Architecture</li>
               </ul>
            </div>

          </div>
        </Section>

        {/* Research & Projects - Added ID */}
        <Section title="Research & Development" id="projects">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card 
              title="Big Data LiDAR Analysis" 
              subtitle="Ph.D. Research • University of Alberta"
              date="2023 - Present"
              icon={Database}
              tags={["Distributed Computing", "10 TB+ Datasets", "Cloud Storage", "R/Python"]}
            >
              <p>Analyzing ~10 TB of LiDAR data using distributed computing frameworks to examine forest growth, yield, and biomass. Architecting scalable data storage systems for massive geospatial datasets.</p>
            </Card>

            <Card 
              title="Automated Inventory Extraction" 
              subtitle="Project Leader • GDF"
              date="2021 - 2022"
              icon={Scan}
              tags={["Computer Vision", "Machine Learning", "Automation", "Mobile LiDAR"]}
            >
              <p>Developed an automated pipeline for extracting individual tree metrics (DBH, height, stem position) from handheld mobile laser scanners. Overcame big data challenges using optimized ML algorithms.</p>
            </Card>

            <Card 
              title="Turkish NFI Web Application" 
              subtitle="Full Stack GIS Development"
              date="2019 - 2020"
              icon={Code}
              tags={["R Shiny", "Web GIS", "PostgreSQL", "Database Design"]}
            >
              <p>Engineered a full-stack web application for the National Forest Inventory. Managed QA/QC protocols and database architecture for nationwide forest monitoring data.</p>
            </Card>

            <Card 
              title="FVS Calibration Methods" 
              subtitle="M.Sc. Thesis • Virginia Tech"
              date="2016 - 2018"
              icon={TreePine}
              tags={["Biometric Modeling", "Statistical Analysis", "Simulation"]}
            >
              <p>Evaluated local calibration methods for improving diameter growth predictions in the Southern Variant of the Forest Vegetation Simulator (FVS).</p>
            </Card>
          </div>
        </Section>

        {/* Education Background - Added ID */}
        <Section title="Education Background" id="education">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Ph.D. - University of Alberta */}
            <a href="https://www.ualberta.ca" target="_blank" rel="noopener noreferrer" className="flex gap-4 md:gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors backdrop-blur-sm cursor-pointer hover:border-emerald-500/30">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-emerald-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src="https://logo.clearbit.com/ualberta.ca" alt="UAlberta Logo" className="w-full h-full object-contain p-1" />
               </div>
               <div>
                  <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Ph.D. in Renewable Resources</h3>
                  <p className="text-emerald-200/80 font-mono text-xs md:text-sm mb-2">University of Alberta • 2023 - Present</p>
                  <p className="text-gray-400 text-xs md:text-sm">Thesis: Advancing Precision Forestry with Proximal Sensing. <br/>Advisor: Dr. Robert E. Froese</p>
               </div>
            </a>

            {/* M.Sc. - Virginia Tech */}
            <a href="https://www.vt.edu" target="_blank" rel="noopener noreferrer" className="flex gap-4 md:gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors backdrop-blur-sm cursor-pointer hover:border-blue-500/30">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src="https://logo.clearbit.com/vt.edu" alt="Virginia Tech Logo" className="w-full h-full object-contain p-1" />
               </div>
               <div>
                  <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">M.Sc. in Forestry</h3>
                  <p className="text-blue-200/80 font-mono text-xs md:text-sm mb-2">Virginia Tech • 2016 - 2018</p>
                  <p className="text-gray-400 text-xs md:text-sm">Thesis: <span className="hover:underline hover:text-blue-400 transition-colors">Testing methods for calibrating Forest Vegetation Simulator (FVS) diameter growth predictions</span><br/>Advisor: Dr. Harold Burkhart</p>
               </div>
            </a>

            {/* B.Sc. - Sutcu Imam & Anadolu */}
            <a href="https://www.ksu.edu.tr" target="_blank" rel="noopener noreferrer" className="flex gap-4 md:gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors backdrop-blur-sm cursor-pointer hover:border-yellow-500/30">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-yellow-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src="https://logo.clearbit.com/ksu.edu.tr" alt="KSU Logo" className="w-full h-full object-contain p-1" />
               </div>
               <div>
                  <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-gray-200 transition-colors">B.Sc. Degrees</h3>
                  <p className="text-gray-400 text-xs md:text-sm mt-2 flex items-center gap-2">
                    <span className="text-white font-bold">Forest Engineering</span> • Sutcu Imam Univ.
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-3">
                     <img src="https://logo.clearbit.com/anadolu.edu.tr" className="w-5 h-5 rounded-full bg-white p-0.5" alt="Anadolu" />
                     <p className="text-gray-400 text-xs md:text-sm">
                        <span className="text-white font-bold">Intl. Relations</span> • Anadolu Univ.
                     </p>
                  </div>
               </div>
            </a>

            {/* International - BOKU & UGA */}
            <a href="https://boku.ac.at" target="_blank" rel="noopener noreferrer" className="flex gap-4 md:gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors backdrop-blur-sm cursor-pointer hover:border-purple-500/30">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src="https://logo.clearbit.com/boku.ac.at" alt="BOKU Logo" className="w-full h-full object-contain p-1" />
               </div>
               <div>
                  <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-purple-400 transition-colors">International Programs</h3>
                  <p className="text-purple-200/80 font-mono text-xs md:text-sm mb-2">BOKU Vienna • Erasmus Internship</p>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-3">
                     <img src="https://logo.clearbit.com/uga.edu" className="w-5 h-5 rounded-full bg-white p-0.5" alt="UGA" />
                     <p className="text-gray-400 text-xs md:text-sm">
                        Intensive English • <span className="text-white font-bold">UGA</span>
                     </p>
                  </div>
               </div>
            </a>

          </div>
        </Section>

        {/* Experience Timeline - Added ID */}
        <Section title="Professional Journey" id="experience">
          <div className="relative border-l border-gray-800 ml-3 md:ml-6 space-y-12">
            
            {[
              {
                role: "Ph.D. Candidate & Researcher",
                org: "University of Alberta",
                loc: "Edmonton, AB",
                date: "Jan 2023 - Present",
                desc: "Processing 10TB+ LiDAR datasets via distributed computing. Graduate Teaching Assistant for GIS, Hydrology, and Environmental Assessment.",
                active: true
              },
              {
                role: "Forest Carbon Technical Expert",
                org: "UNFCCC",
                loc: "Bonn, Germany",
                date: "Dec 2019 - May 2024",
                desc: "Technical assessment of forest reference emission levels for REDD+ activities. Review of GHG inventories and National Communications.",
                active: false
              },
              {
                role: "Remote Sensing Analyst",
                org: "General Directorate of Forestry",
                loc: "Ankara, Turkey",
                date: "Nov 2012 - Apr 2023",
                desc: "Lead for mobile LiDAR automation projects. Developed RShiny web applications for National Forest Inventory data management.",
                active: false
              },
              {
                role: "Forest Engineer",
                org: "USDA Forest Service",
                loc: "Utah, USA",
                date: "Apr 2019 - Sep 2019",
                desc: "Conducted biomass sampling and measurements across Utah, Arizona, and Nevada.",
                active: false
              }
            ].map((item, idx) => (
              <div key={idx} className="relative pl-8 md:pl-12 group">
                <div className={`absolute -left-[5px] top-2 w-3 h-3 rounded-full border border-gray-900 ${item.active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`} />
                <h3 className={`text-lg md:text-xl font-bold ${item.active ? 'text-white' : 'text-gray-300'}`}>{item.role}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-xs md:text-sm mb-2 mt-1">
                  <span className="font-medium text-gray-400">{item.org}</span>
                  <span className="hidden md:inline">•</span>
                  <span>{item.loc}</span>
                </div>
                <span className="inline-block text-xs font-mono text-emerald-400/80 border border-emerald-500/10 bg-emerald-500/5 px-2 py-0.5 rounded mb-3">
                  {item.date}
                </span>
                <p className="text-gray-400 max-w-2xl text-xs md:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}

          </div>
        </Section>

        {/* Certifications Section - Added ID */}
        <Section title="Certifications & Licenses" id="certifications">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl hover:bg-emerald-900/10 transition-colors backdrop-blur-sm">
              <Plane className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-bold text-white mb-1">RPAS Pilot Certificate</h3>
              <p className="text-gray-400 text-sm">Small Remotely Piloted Aircraft System (VLOS)</p>
              <p className="text-xs text-gray-500 mt-2">Transport Canada (2023)</p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl hover:bg-emerald-900/10 transition-colors backdrop-blur-sm">
              <FileText className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-bold text-white mb-1">GIS & Remote Sensing</h3>
              <p className="text-gray-400 text-sm">Advanced ArcGIS & Data Manipulation in R</p>
              <p className="text-xs text-gray-500 mt-2">Multiple Certifications</p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl hover:bg-emerald-900/10 transition-colors backdrop-blur-sm">
              <Code className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="font-bold text-white mb-1">R Programming</h3>
              <p className="text-gray-400 text-sm">Kodex IT R&D Unit</p>
              <p className="text-xs text-gray-500 mt-2">Middle East Technical University</p>
            </div>
          </div>
        </Section>

        {/* Awards Section - Added ID */}
        <Section id="honors">
          <div className="bg-gradient-to-r from-gray-900 to-gray-900/50 border border-gray-800 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
                <Award className="text-emerald-400" /> Honors & Recognition
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                {[
                   { title: "Best Presentation Award (2025)", desc: "Western Mensurationists Meeting ($100 USD)" },
                   { title: "Best Poster Award (2024)", desc: "Forest Industry Lecture Series" },
                   { title: "Graduate Recruitment Scholarship", desc: "University of Alberta ($5,000 CAD)" },
                   { title: "Study Abroad Scholarship (2015)", desc: "Ministry of National Education ($200,000 USD Award)" }
                ].map((award, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium text-lg">{award.title}</h4>
                      <p className="text-gray-500 text-sm mt-1">{award.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="py-16 md:py-20 px-6 border-t border-gray-900 bg-black/40 backdrop-blur-xl relative overflow-hidden">
          {/* ... existing footer code ... */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-8 tracking-tighter text-white">Let's Collaborate</h2>
            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl mx-auto">
              Have a project or research inquiry? I'd love to hear from you.
            </p>
            
            {/* Contact Form */}
            <ContactForm />

            {/* Social & Academic Links */}
            <div className="flex flex-wrap justify-center gap-4 mt-16 mb-8">
              <a href="https://www.linkedin.com/in/ergincagataycankaya/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white border border-gray-800 rounded-full hover:border-emerald-500 transition-colors text-sm md:text-base">
                <Linkedin className="w-4 h-4 md:w-5 md:h-5" />
                LinkedIn
              </a>
              <a href="https://github.com/ergincagataycankaya" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white border border-gray-800 rounded-full hover:border-emerald-500 transition-colors text-sm md:text-base">
                <Github className="w-4 h-4 md:w-5 md:h-5" />
                GitHub
              </a>
              
              <a href="https://orcid.org/0000-0003-2553-8707" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white border border-gray-800 rounded-full hover:border-emerald-500 transition-colors text-sm md:text-base">
                <LinkIcon className="w-4 h-4 md:w-5 md:h-5" />
                ORCID
              </a>
              <a href="https://www.growthandyield.ca/people" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white border border-gray-800 rounded-full hover:border-emerald-500 transition-colors text-sm md:text-base">
                <TreePine className="w-4 h-4 md:w-5 md:h-5" />
                Group
              </a>
              <a href="https://apps.ualberta.ca/directory/person/ergin" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white border border-gray-800 rounded-full hover:border-emerald-500 transition-colors text-sm md:text-base">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                UAlberta
              </a>
            </div>

            <div className="mt-12 text-gray-600 text-xs md:text-sm flex flex-col items-center gap-2">
              <p>© {new Date().getFullYear()} Ergin C. Cankaya.</p>
              <p className="opacity-50">Built with React, Three.js, & Tailwind</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;