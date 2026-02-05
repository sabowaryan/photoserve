'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Download, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Search,
  ChevronRight,
  Monitor,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { InstallationSection } from '@/components/docs/installation-section';
import { UsageSection } from '@/components/docs/usage-section';
import { TroubleshootingSection } from '@/components/docs/troubleshooting-section';
import { RequirementsSection, ChangelogSection } from '@/components/docs/requirements-changelog-section';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  keywords: string[];
}

const sections: Section[] = [
  { 
    id: 'overview', 
    title: 'Overview', 
    icon: <BookOpen size={16} />,
    keywords: ['overview', 'introduction', 'about', 'plugin', 'piksend', 'lightroom', 'features']
  },
  { 
    id: 'installation', 
    title: 'Installation', 
    icon: <Download size={16} />,
    keywords: ['install', 'setup', 'download', 'windows', 'macos', 'modules', 'folder', 'copy']
  },
  { 
    id: 'configuration', 
    title: 'Configuration', 
    icon: <Settings size={16} />,
    keywords: ['configure', 'setup', 'api key', 'authentication', 'settings', 'connect']
  },
  { 
    id: 'usage', 
    title: 'Usage', 
    icon: <Upload size={16} />,
    keywords: ['usage', 'upload', 'photos', 'gallery', 'create', 'manage', 'export']
  },
  { 
    id: 'troubleshooting', 
    title: 'Troubleshooting', 
    icon: <AlertCircle size={16} />,
    keywords: ['troubleshoot', 'error', 'problem', 'issue', 'fix', 'help', 'failed', 'not working']
  },
  { 
    id: 'requirements', 
    title: 'System Requirements', 
    icon: <Monitor size={16} />,
    keywords: ['requirements', 'system', 'compatibility', 'version', 'minimum', 'supported']
  },
  { 
    id: 'changelog', 
    title: 'Changelog', 
    icon: <CheckCircle size={16} />,
    keywords: ['changelog', 'version', 'history', 'updates', 'release', 'new features']
  },
];

export function LightroomDocsClient() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search with content matching
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const results = sections
        .filter(section => {
          // Search in title
          if (section.title.toLowerCase().includes(query)) return true;
          
          // Search in keywords
          if (section.keywords.some(keyword => keyword.includes(query))) return true;
          
          // Search in section content
          const element = document.getElementById(section.id);
          if (element) {
            const content = element.textContent?.toLowerCase() || '';
            return content.includes(query);
          }
          
          return false;
        })
        .map(section => section.id);
      
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setShowSearchResults(false);
      
      // Highlight the section briefly with inline styles
      const originalBg = element.style.backgroundColor;
      const originalBorderRadius = element.style.borderRadius;
      
      element.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
      element.style.borderRadius = '1rem';
      element.style.transition = 'background-color 1s ease-in-out';
      
      setTimeout(() => {
        element.style.backgroundColor = 'transparent';
        setTimeout(() => {
          element.style.backgroundColor = originalBg;
          element.style.borderRadius = originalBorderRadius;
        }, 1000);
      }, 1000);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative">
      {/* Highlight animation is handled via inline styles to avoid hydration issues */}
      
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
          <Link 
            href="/"
            className="text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link 
            href="/docs"
            className="text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Documentation
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-900 font-medium">Lightroom Plugin</span>
        </nav>

        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm mb-6 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" />
                Table of Contents
              </h2>

              {/* Search */}
              <div className="relative mb-4" ref={searchRef}>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  className="w-full pl-10 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  aria-label="Search documentation"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs text-slate-500 px-3 py-2">
                        Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                      </p>
                      {searchResults.map((sectionId) => {
                        const section = sections.find(s => s.id === sectionId);
                        if (!section) return null;
                        
                        return (
                          <button
                            key={sectionId}
                            onClick={() => scrollToSection(sectionId)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-indigo-50 text-left"
                          >
                            <span className="text-indigo-600">
                              {section.icon}
                            </span>
                            <span className="text-slate-900">{section.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* No Results */}
                {showSearchResults && searchQuery && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-4">
                    <p className="text-sm text-slate-600 text-center">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="space-y-1" aria-label="Documentation sections">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  const isSearchResult = searchResults.length > 0 && searchResults.includes(section.id);
                  const shouldShow = searchResults.length === 0 || isSearchResult;

                  if (!shouldShow) return null;

                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      aria-current={isActive ? 'location' : undefined}
                    >
                      <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                        {section.icon}
                      </span>
                      {section.title}
                    </button>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <Link
                  href="/download/lightroom"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  Download Plugin
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
                    <ImageIcon size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                      Lightroom Plugin Documentation
                    </h1>
                    <p className="text-indigo-100/80 text-sm mt-1">
                      Upload photos directly from Adobe Lightroom to PikSend
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-xl shadow-indigo-500/5 space-y-12">
              {/* Overview Section */}
              <section id="overview">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <BookOpen size={24} className="text-indigo-600" />
                  Overview
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed">
                    The PikSend Lightroom plugin allows you to seamlessly upload photos from Adobe Lightroom 
                    directly to your PikSend galleries. This integration streamlines your workflow, enabling 
                    you to share your work with clients without leaving Lightroom.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 mt-6 not-prose">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <Upload size={20} className="text-indigo-600 mb-2" />
                      <h3 className="font-bold text-slate-900 text-sm mb-1">Direct Upload</h3>
                      <p className="text-xs text-slate-600">Upload photos directly from Lightroom</p>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                      <Settings size={20} className="text-violet-600 mb-2" />
                      <h3 className="font-bold text-slate-900 text-sm mb-1">Easy Setup</h3>
                      <p className="text-xs text-slate-600">Simple configuration with API keys</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                      <CheckCircle size={20} className="text-purple-600 mb-2" />
                      <h3 className="font-bold text-slate-900 text-sm mb-1">Pro Feature</h3>
                      <p className="text-xs text-slate-600">Available for Pro plan subscribers</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Installation Section */}
              <section id="installation">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <Download size={24} className="text-indigo-600" />
                  Installation
                </h2>
                <InstallationSection />
              </section>

              {/* Configuration Section */}
              <section id="configuration">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <Settings size={24} className="text-indigo-600" />
                  Configuration & Usage
                </h2>
                <UsageSection />
              </section>

              {/* Usage Section - Combined with Configuration */}
              <section id="usage" className="sr-only">
                {/* This section is combined with configuration above for better flow */}
              </section>

              {/* Troubleshooting Section */}
              <section id="troubleshooting">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <AlertCircle size={24} className="text-indigo-600" />
                  Troubleshooting
                </h2>
                <TroubleshootingSection />
              </section>

              {/* System Requirements Section */}
              <section id="requirements">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <Monitor size={24} className="text-indigo-600" />
                  System Requirements
                </h2>
                <RequirementsSection />
              </section>

              {/* Changelog Section */}
              <section id="changelog">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <CheckCircle size={24} className="text-indigo-600" />
                  Changelog
                </h2>
                <ChangelogSection />
              </section>
            </div>

            {/* Footer Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Help Center
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium"
              >
                Contact Support
                <ChevronRight size={16} />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
