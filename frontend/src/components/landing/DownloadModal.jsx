import React, { useState } from 'react';
import { X, Smartphone, QrCode, CheckCircle2, Send, Sparkles } from 'lucide-react';

const DownloadModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  if (!isOpen) return null;

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setJoined(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-soft-sky hover:bg-slate-200 text-deep-navy flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-travel-blue/10 text-travel-blue flex items-center justify-center mx-auto shadow-sm">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-extrabold text-deep-navy tracking-tight">
            Get TravelApp Today
          </h3>
          <p className="text-xs text-slate-gray">
            Pilih platform ponsel Anda atau pindai kode QR di bawah untuk mengunduh aplikasi secara langsung.
          </p>
        </div>

        {/* Store Buttons */}
        <div className="space-y-3 mb-6">
          <a
            href="#appstore"
            onClick={(e) => { e.preventDefault(); alert("Redirecting to App Store..."); }}
            className="flex items-center justify-between p-4 bg-soft-sky hover:bg-travel-blue/10 border border-slate-200 hover:border-travel-blue rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl"></span>
              <div className="text-left">
                <p className="text-xs font-bold text-deep-navy">iOS App Store</p>
                <p className="text-[11px] text-slate-gray">Requires iOS 14.0 or later</p>
              </div>
            </div>
            <span className="text-xs font-bold text-travel-blue group-hover:translate-x-1 transition-transform">Download →</span>
          </a>

          <a
            href="#playstore"
            onClick={(e) => { e.preventDefault(); alert("Redirecting to Google Play..."); }}
            className="flex items-center justify-between p-4 bg-soft-sky hover:bg-tropical-teal/10 border border-slate-200 hover:border-tropical-teal rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl text-tropical-teal">▶</span>
              <div className="text-left">
                <p className="text-xs font-bold text-deep-navy">Google Play Store</p>
                <p className="text-[11px] text-slate-gray">Requires Android 8.0 or later</p>
              </div>
            </div>
            <span className="text-xs font-bold text-tropical-teal group-hover:translate-x-1 transition-transform">Download →</span>
          </a>
        </div>

        {/* QR Code Divider */}
        <div className="bg-soft-sky p-4 rounded-2xl border border-slate-200/80 flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 shrink-0 flex items-center justify-center">
            <QrCode className="w-full h-full text-deep-navy" />
          </div>
          <div>
            <p className="text-xs font-bold text-deep-navy">Scan QR Code</p>
            <p className="text-[11px] text-slate-gray mt-0.5">
              Arahkan kamera ponsel Anda ke QR Code untuk langsung membuka link unduhan.
            </p>
          </div>
        </div>

        {/* Join Waitlist Form */}
        {!joined ? (
          <form onSubmit={handleWaitlistSubmit} className="space-y-2">
            <label className="text-xs font-bold text-deep-navy block">
              Or Get VIP Beta Link via Email
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 bg-soft-sky text-xs font-medium border border-slate-200 rounded-xl text-deep-navy focus:outline-none focus:border-travel-blue"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-travel-blue hover:bg-travel-blue-hover text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-tropical-teal/10 border border-tropical-teal/30 rounded-xl text-center text-xs font-bold text-tropical-teal flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Success! We have sent the download link to {email}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default DownloadModal;
