import React, { useState } from 'react';
import { X, Sparkles, MapPin, Calendar, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TripPlannerModal = ({ isOpen, onClose, initialCity = 'Bali' }) => {
  const [city, setCity] = useState(initialCity);
  const [days, setDays] = useState('3');
  const [style, setStyle] = useState('Balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedItinerary({
        destination: city || 'Bali',
        days: days,
        style: style,
        highlights: [
          `Day 1: Arrival & ${city} Sunset Spot Welcome Dinner`,
          `Day 2: Full Day Cultural & Nature Exploration tour`,
          `Day 3: Culinary Walk & Souvenir Shopping before departure`,
        ],
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-left">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-soft-sky hover:bg-slate-200 text-deep-navy flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-travel-blue to-tropical-teal text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-deep-navy tracking-tight">
              AI Quick Trip Planner
            </h3>
            <p className="text-xs text-slate-gray">
              Buat rute itinerary instan untuk liburan impian Anda.
            </p>
          </div>
        </div>

        {!generatedItinerary ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* City Field */}
            <div>
              <label className="text-xs font-bold text-deep-navy block mb-1">
                Destination City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-travel-blue absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bali, Tokyo, Yogyakarta"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-soft-sky border border-slate-200 rounded-xl text-xs font-semibold text-deep-navy focus:outline-none focus:border-travel-blue"
                />
              </div>
            </div>

            {/* Days Field */}
            <div>
              <label className="text-xs font-bold text-deep-navy block mb-1">
                Trip Duration (Days)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['2 Days', '3 Days', '5 Days', '7 Days'].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDays(d.split(' ')[0])}
                    className={`py-2 text-xs font-bold rounded-xl transition-colors border ${
                      days === d.split(' ')[0]
                        ? 'bg-travel-blue text-white border-travel-blue shadow-sm'
                        : 'bg-soft-sky text-slate-gray border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Pace / Style */}
            <div>
              <label className="text-xs font-bold text-deep-navy block mb-1">
                Travel Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Relaxed', 'Balanced', 'Adventurous'].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`py-2 text-xs font-bold rounded-xl transition-colors border ${
                      style === s
                        ? 'bg-tropical-teal text-white border-tropical-teal shadow-sm'
                        : 'bg-soft-sky text-slate-gray border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate CTA */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 bg-travel-blue hover:bg-travel-blue-hover text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 mt-4 transition-all"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Generating Smart Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Itinerary Now</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-soft-sky rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <span className="text-xs font-extrabold text-travel-blue uppercase">
                  📍 {generatedItinerary.destination} Trip Preview
                </span>
                <span className="text-[10px] bg-tropical-teal/10 text-tropical-teal font-bold px-2 py-0.5 rounded">
                  {generatedItinerary.days} Days • {generatedItinerary.style}
                </span>
              </div>

              <div className="space-y-2">
                {generatedItinerary.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-tropical-teal shrink-0 mt-0.5" />
                    <span className="font-semibold text-deep-navy">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setGeneratedItinerary(null)}
                className="flex-1 py-2.5 bg-soft-sky hover:bg-slate-200 text-deep-navy text-xs font-bold rounded-xl border border-slate-200"
              >
                ← Regenerate
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 bg-travel-blue hover:bg-travel-blue-hover text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1"
              >
                <span>Save to App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TripPlannerModal;
