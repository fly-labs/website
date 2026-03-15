
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { SmileLogo } from '@/components/SmileLogo.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, profile, logout } = useAuth();

  const navLinks = [
    { name: 'Explore', path: '/explore' },
    { name: 'Ideas', path: '/ideas' },
    { name: 'FlyBoard', path: '/flyboard' },
    { name: 'Prompts', path: '/prompts' },
    { name: 'Newsletter', path: '/newsletter' },
    { name: 'Library', path: '/library' },
    { name: 'About', path: '/about' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border py-3">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-xl"
          >
            <SmileLogo className="w-10 h-10 text-primary" />
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              Fly Labs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
            
            <div className="w-px h-6 bg-border mx-2"></div>
            
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2 pl-2 border-l border-border">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={profile?.avatar_url || currentUser?.user_metadata?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs"><User className="w-3 h-3" /></AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-bold max-w-[100px] truncate">
                    {profile?.name || currentUser?.email}
                  </span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  title="Logout"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="ml-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-sm transition-colors border border-transparent hover:border-border"
              >
                Log In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-4 p-4 bg-card border border-border rounded-2xl shadow-xl space-y-2 max-h-[80vh] overflow-y-auto"
            >
              {isAuthenticated && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 mb-2 bg-muted/30 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || currentUser?.user_metadata?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary"><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Logged in as</span>
                    <span className="text-sm font-bold truncate">{profile?.name || currentUser?.email}</span>
                  </div>
                </Link>
              )}
              
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl transition-colors font-medium text-lg ${
                    isActive(link.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-border mt-4">
                {isAuthenticated ? (
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-destructive font-bold text-lg hover:bg-destructive/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" /> Log Out
                  </button>
                ) : (
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-lg transition-colors border border-border"
                  >
                    Log In
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
