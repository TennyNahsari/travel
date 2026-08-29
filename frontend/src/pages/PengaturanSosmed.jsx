import { useState, useEffect } from 'react';
import { socialService } from '../services/api';

export default function PengaturanSosmed() {
  const [formData, setFormData] = useState({
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    threadsUrl: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSocialSettings();
  }, []);

  const fetchSocialSettings = async () => {
    try {
      setLoading(true);
      const res = await socialService.getSocialSettings();
      if (res.success && res.data) {
        setFormData({
          instagramUrl: res.data.instagramUrl || '',
          twitterUrl: res.data.twitterUrl || '',
          youtubeUrl: res.data.youtubeUrl || '',
          facebookUrl: res.data.facebookUrl || '',
          linkedinUrl: res.data.linkedinUrl || '',
          threadsUrl: res.data.threadsUrl || ''
        });
      }
    } catch (err) {
      console.error('Failed to load social settings:', err);
      setMessage({ type: 'error', text: 'Gagal memuat data media sosial' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const res = await socialService.updateSocialSettings(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Pengaturan Media Sosial berhasil disimpan!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Gagal menyimpan data' });
      }
    } catch (err) {
      console.error('Error saving social settings:', err);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan pengaturan' });
    } finally {
      setSaving(false);
    }
  };

  const socialItems = [
    {
      id: 'instagramUrl',
      label: 'Instagram',
      placeholder: 'https://instagram.com/username',
      color: 'from-purple-600 via-pink-500 to-amber-500',
      badgeBg: 'bg-pink-50 text-pink-600 border-pink-200',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      id: 'twitterUrl',
      label: 'Twitter / X',
      placeholder: 'https://twitter.com/username',
      color: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-50 text-sky-600 border-sky-200',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      id: 'youtubeUrl',
      label: 'YouTube',
      placeholder: 'https://youtube.com/@channel',
      color: 'from-red-600 to-rose-700',
      badgeBg: 'bg-red-50 text-red-600 border-red-200',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
        </svg>
      )
    },
    {
      id: 'facebookUrl',
      label: 'Facebook',
      placeholder: 'https://facebook.com/page',
      color: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-50 text-blue-600 border-blue-200',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
        </svg>
      )
    },
    {
      id: 'linkedinUrl',
      label: 'LinkedIn',
      placeholder: 'https://linkedin.com/company/name',
      color: 'from-sky-700 to-blue-800',
      badgeBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      )
    },
    {
      id: 'threadsUrl',
      label: 'Threads',
      placeholder: 'https://threads.net/@username',
      color: 'from-slate-800 to-black',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.186 24c-3.23 0-5.839-.997-7.755-2.965C2.518 19.07 1.5 16.084 1.5 12.14 1.5 8.196 2.52 5.21 4.434 3.243 6.35 1.275 8.958.278 12.186.278c3.228 0 5.836.997 7.752 2.965C21.854 5.21 22.87 8.196 22.87 12.14c0 1.251-.1 2.463-.3 3.636-.2.172-.44.258-.72.258-.24 0-.46-.086-.66-.258-.16-.138-.28-.31-.36-.516l-.28-1.032c-.92 1.24-2.12 2.14-3.6 2.7-.44.172-.94.258-1.5.258-2.04 0-3.67-.714-4.89-2.142-1.22-1.428-1.83-3.306-1.83-5.634 0-2.328.61-4.206 1.83-5.634 1.22-1.428 2.85-2.142 4.89-2.142 1.8 0 3.27.568 4.41 1.704 1.14 1.136 1.77 2.68 1.89 4.632h-2.1c-.12-1.408-.55-2.486-1.29-3.234-.74-.748-1.74-1.122-3.00-1.122-1.40 0-2.52.508-3.36 1.524-.84 1.016-1.26 2.404-1.26 4.164 0 1.76.42 3.148 1.26 4.164.84 1.016 1.96 1.524 3.36 1.524.96 0 1.8-.258 2.52-.774.72-.516 1.23-1.256 1.53-2.22h-4.05v-1.8h6.15v6.528c-.4.43-1.04.81-1.92 1.14-.88.33-1.87.495-2.97.495z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-deep-navy via-slate-800 to-travel-blue p-6 sm:p-8 rounded-3xl text-white shadow-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pengaturan Media Sosial Footer 🌐
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Atur dan perbarui link akun media sosial resmi (Instagram, Twitter/X, YouTube, Facebook, LinkedIn, Threads) yang ditampilkan di bagian footer landing page.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Live Config</span>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{message.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
          <button 
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-soft p-8 border border-slate-100 space-y-6">
          <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-deep-navy">Tautan Akun Media Sosial</h2>
                <p className="text-xs text-slate-500">Isi URL lengkap beserta `https://` untuk setiap platform.</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-travel-blue to-tropical-teal text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {socialItems.map(item => (
                <div key={item.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-travel-blue/40 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-sm`}>
                        {item.icon}
                      </div>
                      <label htmlFor={item.id} className="text-sm font-bold text-deep-navy">
                        {item.label}
                      </label>
                    </div>
                    {formData[item.id] ? (
                      <a
                        href={formData[item.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center gap-1 hover:underline ${item.badgeBg}`}
                      >
                        <span>Uji Link</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 italic">Belum diisi</span>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      type="url"
                      id={item.id}
                      name={item.id}
                      value={formData[item.id]}
                      onChange={handleChange}
                      placeholder={item.placeholder}
                      className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-travel-blue/30 focus:border-travel-blue outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-500">
                💡 <strong>Tips:</strong> Kosongkan field jika tidak ingin menampilkan icon platform tersebut di footer.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-travel-blue to-tropical-teal text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
