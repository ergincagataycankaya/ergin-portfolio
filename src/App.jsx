import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Github, Linkedin, Mail, MapPin, ExternalLink, ChevronDown, Code, Database, TreePine, Scan, Layers, Terminal, Award, BookOpen, Cloud, Cpu, Plane, FileText, GraduationCap } from 'lucide-react';

/**
 * UTILITIES & HOOKS
 * ------------------------------------------------------------------
 */

// Hook for smooth scrolling (simulating Lenis)
const useSmoothScroll = () => {
  const scrollRef = useRef(null);
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
 * Simulates a LiDAR Point Cloud Forest directly relevant to Ergin's CV
 * ------------------------------------------------------------------
 */
const LidarForest = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Dynamic import of Three.js from CDN for the single-file environment
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = initThree;
    document.body.appendChild(script);

    let scene, camera, renderer, particles, frameId;

    function initThree() {
      if (!mountRef.current) return;

      // 1. Scene Setup
      const THREE = window.THREE;
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02); // Dark fog for depth

      // 2. Camera
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 30;
      camera.position.y = 10;

      // 3. Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      // 4. Create "LiDAR" Particles (Trees and Terrain)
      const particleCount = 14000; // Increased density
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];

      const color1 = new THREE.Color(0x10b981); // Emerald Green
      const color2 = new THREE.Color(0x3b82f6); // Tech Blue
      const color3 = new THREE.Color(0x8b5cf6); // Violet for "Data" points

      for (let i = 0; i < particleCount; i++) {
        // Create a wavy terrain
        const x = (Math.random() - 0.5) * 160;
        const z = (Math.random() - 0.5) * 160;
        let y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5;

        // Chance to create a "Tree" trunk (vertical line of points)
        if (Math.random() > 0.98) {
          const treeHeight = Math.random() * 10 + 5;
          for (let j = 0; j < 25; j++) {
            positions.push(x + (Math.random() - 0.5), y + (j / 20) * treeHeight, z + (Math.random() - 0.5));
            colors.push(color1.r, color1.g, color1.b);
          }
        } else {
          // Ground points
          positions.push(x, y, z);
          // Gradient color based on height
          if (y > 3) {
            colors.push(color1.r * 0.8, color1.g * 0.8, color1.b * 0.8); 
          } else if (y < -2) {
             colors.push(color3.r, color3.g, color3.b); // Deep data layer
          } else {
            colors.push(color2.r * 0.5, color2.g * 0.5, color2.b * 0.5);
          }
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      // Animation Loop
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        // Slow rotation simulating a drone scan
        particles.rotation.y += 0.0005;
        
        renderer.render(scene, camera);
      };
      animate();

      // Resize Handler
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
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none opacity-60" />;
};

/**
 * UI COMPONENTS
 * ------------------------------------------------------------------
 */

const Section = ({ title, children, className = "" }) => (
  <section className={`py-24 px-6 relative z-10 max-w-6xl mx-auto ${className}`}>
    {title && (
      <h2 className="text-4xl md:text-5xl font-bold mb-16 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 inline-block">
        {title}
      </h2>
    )}
    {children}
  </section>
);

const Card = ({ title, subtitle, date, children, icon: Icon, tags = [] }) => (
  <div className="group relative p-8 bg-gray-900/60 backdrop-blur-lg border border-gray-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-2xl shadow-black/50">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors leading-tight">{title}</h3>
          {subtitle && <p className="text-emerald-200/80 font-medium text-sm">{subtitle}</p>}
        </div>
        {date && <span className="text-xs font-mono text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700 whitespace-nowrap ml-2">{date}</span>}
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
        <Icon className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-800/30 group-hover:text-emerald-900/20 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12" />
      )}
    </div>
  </div>
);

const SkillBadge = ({ icon: Icon, name, color = "text-emerald-400", category }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-emerald-500/30 hover:bg-gray-800/50 transition-all duration-300 group h-full">
    <Icon className={`w-8 h-8 ${color} mb-3 group-hover:scale-110 transition-transform`} />
    <span className="text-gray-300 font-medium text-center text-sm">{name}</span>
    {category && <span className="text-gray-600 text-[10px] uppercase tracking-widest mt-1">{category}</span>}
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
      
      {/* 3D Background */}
      <LidarForest />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="text-2xl font-bold tracking-tighter">
          EC<span className="text-emerald-500">.</span>
        </div>
        <div className="flex gap-4">
          <a href="https://www.linkedin.com/in/ergincagataycankaya/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            <Linkedin className="w-5 h-5" />
          </a>
          <a 
            href="mailto:ergin@ualberta.ca" 
            className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all duration-300 text-sm font-medium tracking-wide"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex flex-col justify-center px-6 md:px-20 z-10 pt-20">
        <div 
          className="max-w-5xl"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }} // Parallax effect
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Geospatial Data Scientist • 10+ Years Experience
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-8 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Ergin C.<br />Cankaya
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed mb-12">
            I architect <strong>cloud-ready geospatial data lakes</strong> and <strong>ML/DL pipelines</strong> for precision forestry. 
            Specializing in fusing <span className="text-emerald-400">multi-platform LiDAR</span> with <span className="text-blue-400">digital intelligence</span> to quantify natural resources at scale.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#projects" className="group relative px-8 py-4 bg-emerald-500 text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105">
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative group-hover:text-black">Explore Work</span>
            </a>
            <a href="#certifications" className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 backdrop-blur-md transition-all flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 w-full flex justify-center animate-bounce opacity-50">
          <ChevronDown className="w-8 h-8 text-gray-600" />
        </div>
      </header>

      {/* Content Wrapper */}
      <div className="relative z-20 bg-[#050505]">
        <div className="h-32 bg-gradient-to-b from-transparent to-[#050505] -mt-32 relative z-20 pointer-events-none" />
        
        {/* Technical Stack */}
        <Section title="Technical Arsenal">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <SkillBadge icon={Terminal} name="R & Python" color="text-blue-400" category="Core" />
            <SkillBadge icon={Cloud} name="Distributed Computing" color="text-sky-300" category="Cloud & DevOps" />
            <SkillBadge icon={Database} name="ETL & Data Lakes" color="text-yellow-400" category="Big Data" />
            <SkillBadge icon={Scan} name="LiDAR (ALS/TLS/MLS)" color="text-red-400" category="Remote Sensing" />
            <SkillBadge icon={Cpu} name="Machine Learning/DL" color="text-purple-400" category="AI" />
            <SkillBadge icon={Layers} name="PostgreSQL/GIS" color="text-green-400" category="Database" />
            <SkillBadge icon={Github} name="CI/CD & Git" color="text-white" category="DevOps" />
            <SkillBadge icon={TreePine} name="Forest Modeling" color="text-emerald-500" category="Domain" />
          </div>
        </Section>

        {/* Research & Projects */}
        <Section title="Research & Development" id="projects">
          <div className="grid md:grid-cols-2 gap-8">
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

        {/* Education Background (NEW) */}
        <Section title="Education Background">
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="flex gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors">
               <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  <GraduationCap className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Ph.D. in Renewable Resources</h3>
                  <p className="text-emerald-200/80 font-mono text-sm mb-2">University of Alberta • 2023 - Present</p>
                  <p className="text-gray-400 text-sm">Thesis: Advancing Precision Forestry with Proximal Sensing. <br/>Advisor: Dr. Robert E. Froese</p>
               </div>
            </div>

            <div className="flex gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors">
               <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 group-hover:text-black transition-all">
                  <GraduationCap className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">M.Sc. in Forestry</h3>
                  <p className="text-blue-200/80 font-mono text-sm mb-2">Virginia Tech • 2016 - 2018</p>
                  <p className="text-gray-400 text-sm">Major: Forest Resources & Environmental Conservation.<br/>Advisor: Dr. Harold Burkhart</p>
               </div>
            </div>

            <div className="flex gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors">
               <div className="w-12 h-12 rounded-full bg-gray-500/10 border border-gray-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-400 group-hover:text-black transition-all">
                  <BookOpen className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-gray-200 transition-colors">B.Sc. Degrees</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    <strong className="text-white">Forest Engineering</strong> • Sutcu Imam Univ. (2008-2012)
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    <strong className="text-white">International Relations</strong> • Anadolu Univ. (2009-2013)
                  </p>
               </div>
            </div>

            <div className="flex gap-6 items-start group bg-gray-900/20 p-6 rounded-2xl border border-white/5 hover:bg-gray-900/40 transition-colors">
               <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 group-hover:text-black transition-all">
                  <Plane className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">International Programs</h3>
                  <p className="text-purple-200/80 font-mono text-sm mb-2">BOKU Vienna • Erasmus Internship</p>
                  <p className="text-gray-400 text-sm">
                    Also completed Intensive English programs at <strong>University of Georgia</strong> (2016-2017).
                  </p>
               </div>
            </div>

          </div>
        </Section>

        {/* Experience Timeline */}
        <Section title="Professional Journey">
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
                role: "Reviewer",
                org: "Elsevier (Dendrochronologia)",
                loc: "Remote",
                date: "Apr 2020 - Present",
                desc: "Peer reviewer for high-quality research related to tree-ring science and woody plant growth.",
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
                <h3 className={`text-xl font-bold ${item.active ? 'text-white' : 'text-gray-300'}`}>{item.role}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-sm mb-2 mt-1">
                  <span className="font-medium text-gray-400">{item.org}</span>
                  <span className="hidden md:inline">•</span>
                  <span>{item.loc}</span>
                </div>
                <span className="inline-block text-xs font-mono text-emerald-400/80 border border-emerald-500/10 bg-emerald-500/5 px-2 py-0.5 rounded mb-3">
                  {item.date}
                </span>
                <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}

          </div>
        </Section>

        {/* Certifications Section */}
        <Section title="Certifications & Licenses" id="certifications">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl hover:bg-emerald-900/10 transition-colors">
              <Plane className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-bold text-white mb-1">RPAS Pilot Certificate</h3>
              <p className="text-gray-400 text-sm">Small Remotely Piloted Aircraft System (VLOS)</p>
              <p className="text-xs text-gray-500 mt-2">Transport Canada (2023)</p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl hover:bg-emerald-900/10 transition-colors">
              <FileText className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-bold text-white mb-1">GIS & Remote Sensing</h3>
              <p className="text-gray-400 text-sm">Advanced ArcGIS & Data Manipulation in R</p>
              <p className="text-xs text-gray-500 mt-2">Multiple Certifications</p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl hover:bg-emerald-900/10 transition-colors">
              <Code className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="font-bold text-white mb-1">R Programming</h3>
              <p className="text-gray-400 text-sm">Kodex IT R&D Unit</p>
              <p className="text-xs text-gray-500 mt-2">Middle East Technical University</p>
            </div>
          </div>
        </Section>

        {/* Awards Section */}
        <Section>
          <div className="bg-gradient-to-r from-gray-900 to-gray-900/50 border border-gray-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Award className="text-emerald-400" /> Honors & Recognition
              </h2>
              <div className="grid md:grid-cols-2 gap-y-8 gap-x-12">
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
        <footer className="py-20 px-6 border-t border-gray-900 bg-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter text-white">Let's Collaborate</h2>
            <p className="text-lg text-gray-400 mb-12 max-w-xl mx-auto">
              Open to opportunities in Geospatial Data Science, Remote Sensing, and Precision Forestry.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <a href="mailto:ergin@ualberta.ca" className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-emerald-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                ergin@ualberta.ca
              </a>
              <a href="https://www.linkedin.com/in/ergincagataycankaya/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white border border-gray-800 rounded-full hover:border-emerald-500 transition-colors">
                <Linkedin className="w-5 h-5" />
                LinkedIn Profile
              </a>
            </div>
            
            <div className="mt-24 text-gray-600 text-sm flex flex-col items-center gap-2">
              <p>© {new Date().getFullYear()} Ergin C. Cankaya.</p>
              <p className="text-xs opacity-50">Built with React, Three.js, & Tailwind</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;