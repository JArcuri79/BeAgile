import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const CompanySettings = () => {
  const { 
    logoUrl, setLogoUrl, 
    accentColor, setAccentColor, 
    fontFamily, setFontFamily, 
    customColors, setCustomColors, 
    companyName, setCompanyName,
    companyWebsiteUrl, setCompanyWebsiteUrl
  } = useTheme();

  const [tempLogo, setTempLogo] = useState(logoUrl);
  const [tempName, setTempName] = useState(companyName);
  const [tempWebsite, setTempWebsite] = useState(companyWebsiteUrl);

  const fonts = [
    'Inter', 'Poppins', 'Exo', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Oswald', 
    'Raleway', 'Ubuntu', 'Merriweather', 'Playfair Display', 'Kanit', 'Lora', 
    'Fira Sans', 'Quicksand', 'Josefin Sans', 'Arvo', 'Anton', 'Pacifico'
  ];

  const lightPresets = ['#7e22ce', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#14b8a6'];
  const darkPresets = ['#ccff00', '#00f2ff', '#ff00ff', '#70ff00', '#ffea00', '#ff4d00', '#00ff95', '#0084ff', '#ff0055', '#ffffff'];

  const handleCustomColorChange = (index, color) => {
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
  };

  return (
    <div className="w-full p-10 space-y-12 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--text-main)]">Company Settings</h1>
        <p className="text-[var(--text-muted)] font-bold">Manage your workspace branding and visual personality.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Identity Section */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiImage} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Logo & Identity</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Company Name</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  placeholder="e.g. BeAgile" 
                  className="flex-1 px-6 py-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 font-bold text-[var(--text-main)]" 
                />
                <button onClick={() => setCompanyName(tempName)} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all">SAVE</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Workspace Logo URL</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={tempLogo} 
                  onChange={(e) => setTempLogo(e.target.value)} 
                  placeholder="https://example.com/logo.png" 
                  className="flex-1 px-6 py-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 font-bold text-[var(--text-main)]" 
                />
                <button onClick={() => setLogoUrl(tempLogo)} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all">SAVE</button>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Presence Section */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiGlobe} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Digital Presence</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Company Website URL</label>
              <p className="text-xs text-[var(--text-muted)] font-bold mb-2">This link will be visible to Guests and Users in the navigation bar.</p>
              <div className="flex gap-3">
                <input 
                  type="url" 
                  value={tempWebsite} 
                  onChange={(e) => setTempWebsite(e.target.value)} 
                  placeholder="https://yourcompany.com" 
                  className="flex-1 px-6 py-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 font-bold text-[var(--text-main)]" 
                />
                <button onClick={() => setCompanyWebsiteUrl(tempWebsite)} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all">SAVE</button>
              </div>
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-8 xl:col-span-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiType} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Typography Engine</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fonts.map(f => (
              <button 
                key={f} 
                onClick={() => setFontFamily(f)} 
                style={{ fontFamily: f }}
                className={`p-4 text-sm font-bold rounded-2xl border transition-all ${fontFamily === f ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg scale-[1.05]' : 'border-transparent bg-[var(--bg-main)] hover:border-[var(--accent)]/50 text-[var(--text-main)]'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Color Section */}
        <div className="xl:col-span-2 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiDroplet} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Dynamic Color Framework</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border-color)] pb-4">Light Mode Presets</h4>
              <div className="grid grid-cols-5 gap-4">
                {lightPresets.map(c => <button key={c} onClick={() => setAccentColor(c)} style={{ backgroundColor: c }} className={`w-12 h-12 rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 ${accentColor === c ? 'border-[var(--text-main)] shadow-2xl scale-110' : 'border-transparent shadow-sm'}`} />)}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border-color)] pb-4">Dark Mode Presets</h4>
              <div className="grid grid-cols-5 gap-4">
                {darkPresets.map(c => <button key={c} onClick={() => setAccentColor(c)} style={{ backgroundColor: c }} className={`w-12 h-12 rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 ${accentColor === c ? 'border-[var(--text-main)] shadow-2xl scale-110' : 'border-transparent shadow-sm'}`} />)}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border-color)] pb-4">Custom Memory Slots</h4>
              <div className="grid grid-cols-5 gap-4">
                {customColors.map((c, i) => (
                  <div key={i} className="relative group">
                    <input type="color" value={c} onChange={(e) => handleCustomColorChange(i, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <button onClick={() => setAccentColor(c)} style={{ backgroundColor: c }} className={`w-12 h-12 rounded-2xl border-4 transition-all group-hover:scale-110 ${accentColor === c ? 'border-[var(--text-main)] shadow-2xl scale-110' : 'border-transparent shadow-sm'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;