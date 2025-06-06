import React, { useState } from 'react';

export const Sidebar = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const [isLoggingOut, setIsLoggingOut] = useState(false);
    // Navigation items
  const navItems = [
    { name: 'Tematy', href: '/topics', icon: 'BookOpen' },
    { name: 'Powtórki', href: '/review', icon: 'RefreshCcw' },
    { name: 'Ustawienia', href: '/account/settings', icon: 'Settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/topics') {
      return pathname === '/topics' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Handle logout action
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Przekierowanie na stronę logowania po pomyślnym wylogowaniu
        window.location.href = '/login';
      } else {
        console.error('Błąd wylogowania:', data.error);
        alert('Wystąpił problem podczas wylogowywania. Spróbuj ponownie.');
      }
    } catch (error) {
      console.error('Nieoczekiwany błąd wylogowania:', error);
      alert('Wystąpił problem z połączeniem. Sprawdź połączenie i spróbuj ponownie.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="h-screen w-64 flex-shrink-0 bg-grays-950 relative hidden md:flex">
      {/* Right gradient border */}
      <div className="absolute right-0 top-0 w-[1px] h-full bg-gradient-to-r from-secondary-400/50 to-accent-200/50"></div>
      
      <div className="w-full flex flex-col">
        {/* Logo */}
        <div className="p-4 relative">
          {/* Bottom gradient border for logo section */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-primary/50 via-secondary-400/50 to-accent-200/50"></div>
          
          <a href="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-transparent bg-clip-text">
              10xFlashcards
            </span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary bg-opacity-10 text-primary'
                      : 'text-text hover:bg-gray-900'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <span className="mr-3">
                    {renderIcon(item.icon)}
                  </span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 relative">
          {/* Top gradient border for user section */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-primary/50 via-secondary-400/50 to-accent-200/50"></div>
          
          <button
            className="w-full flex items-center px-4 py-2 rounded-md text-text hover:bg-gray-900 transition-colors cursor-pointer"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <span className="mr-3">
              {renderIcon('LogOut')}
            </span>
            {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
          </button>
        </div>
      </div>
    </aside>
  );
};

// Simple icon rendering based on icon name
const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'BookOpen':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      );
    case 'RefreshCcw':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v6h6"></path>
          <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
          <path d="M21 22v-6h-6"></path>
          <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
        </svg>
      );
    case 'Settings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1-2 2 2 2 0 0 1-2-2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      );
    case 'LogOut':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      );
    default:
      return null;
  }
};