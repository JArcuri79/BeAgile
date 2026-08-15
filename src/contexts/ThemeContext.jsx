import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('isDark') === 'true');
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || 'BeAgile');
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('logoUrl') || '');
  const [companyWebsiteUrl, setCompanyWebsiteUrl] = useState(() => localStorage.getItem('companyWebsiteUrl') || 'https://example.com');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || (isDark ? '#ccff00' : '#7e22ce'));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'Inter');
  const [customColors, setCustomColors] = useState(() => {
    const saved = localStorage.getItem('customColors');
    return saved ? JSON.parse(saved) : Array(10).fill('#7e22ce');
  });

  const getContrastColor = (hexcolor) => {
    if (!hexcolor || hexcolor.length < 6) return '#ffffff';
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');

    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--accent-foreground', getContrastColor(accentColor));
    root.style.setProperty('--font-family', `'${fontFamily}', sans-serif`);

    localStorage.setItem('isDark', isDark);
    localStorage.setItem('companyName', companyName);
    localStorage.setItem('logoUrl', logoUrl);
    localStorage.setItem('companyWebsiteUrl', companyWebsiteUrl);
    localStorage.setItem('accentColor', accentColor);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('customColors', JSON.stringify(customColors));
  }, [isDark, companyName, accentColor, fontFamily, logoUrl, companyWebsiteUrl, customColors]);

  return (
    <ThemeContext.Provider value={{
      isDark, setIsDark, toggleTheme: () => setIsDark(!isDark),
      companyName, setCompanyName,
      logoUrl, setLogoUrl,
      companyWebsiteUrl, setCompanyWebsiteUrl,
      accentColor, setAccentColor,
      fontFamily, setFontFamily,
      customColors, setCustomColors,
      getContrastColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);