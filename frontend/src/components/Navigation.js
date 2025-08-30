import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  History, 
  Zap, 
  Menu, 
  X
} from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'down' | 'checking'
  const [lastChecked, setLastChecked] = useState(null);

  const navItems = [
    { path: '/', label: 'Home', icon: Zap },
    { path: '/playground', label: 'Playground', icon: MessageSquare },
    { path: '/history', label: 'History', icon: History },
  ];

  const isActive = (path) => location.pathname === path;

  // Lightweight health check: ping twice per 5-minute cycle
  useEffect(() => {
    let intervalId;
    let timeoutId;

    const fetchWithTimeout = async (url, options = {}, ms = 4000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
        return res;
      } finally {
        clearTimeout(id);
      }
    };

    const checkOnce = async () => {
      try {
        const res = await fetchWithTimeout('/api/models', {}, 4000);
        if (res && res.ok) return true;
      } catch (e) {}
      return false;
    };

    const runCycle = async () => {
      setBackendStatus('checking');
      const first = await checkOnce();
      if (first) {
        setBackendStatus('online');
        setLastChecked(new Date());
        return;
      }
      // second attempt shortly after
      timeoutId = setTimeout(async () => {
        const second = await checkOnce();
        setBackendStatus(second ? 'online' : 'down');
        setLastChecked(new Date());
      }, 1500);
    };

    // initial check
    runCycle();
    // every 5 minutes
    intervalId = setInterval(runCycle, 5 * 60 * 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const renderStatusPill = () => {
    const base = 'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium';
    if (backendStatus === 'online') {
      return (
        <div className={`${base} bg-green-100 text-green-800`} title={lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : ''}>
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
          <span>Online</span>
        </div>
      );
    }
    if (backendStatus === 'down') {
      return (
        <div className={`${base} bg-red-100 text-red-800`} title={lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : ''}>
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
          <span>Down</span>
        </div>
      );
    }
    // checking
    return (
      <div className={`${base} bg-yellow-100 text-yellow-800`}>
        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span>Checking…</span>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              AI Nexus
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700 shadow-sm'
                        : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Right side: Backend status (replaces external links) */}
          <div className="hidden md:flex items-center space-x-4">
            {renderStatusPill()}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/20"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-4">
                {renderStatusPill()}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
