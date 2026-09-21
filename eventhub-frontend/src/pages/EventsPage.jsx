import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  Ticket,
  Loader2,
  Zap,
} from 'lucide-react';

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { addToast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.events.getAll();
      setEvents(data);
      if (data?.message) {
        addToast({ title: 'Events updated', message: data.message, type: 'info' });
      }
    } catch (err) {
      console.error('Error fetching events catalog:', err);
      addToast({
        title: 'Unable to load events',
        message: err.response?.data?.message || err.message || 'Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' ||
      (selectedCategory === 'SPORTS' && evt.title.includes('IPL')) ||
      (selectedCategory === 'CONCERTS' && evt.title.includes('Coldplay')) ||
      (selectedCategory === 'TECH' && evt.title.includes('Tech'));
    return matchesSearch && matchesCat;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-12 border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Find your next experience</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Reserve your perfect seat with <span className="text-indigo-400">confidence</span>
          </h1>
          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            Explore live events, compare seat options, and complete your booking in a few simple steps.
          </p>

          {/* Search bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event title, stadium or city..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              />
            </div>
            <div className="flex gap-2">
              {['ALL', 'SPORTS', 'CONCERTS', 'TECH'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all border ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-glow'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Available Events</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Showing {filteredEvents.length} events
          </p>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="mt-3 text-sm text-slate-400">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">No events found matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-glow"
            >
              {/* Event Image Banner with Overlay */}
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img
                  src={
                    event.banner ||
                    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                {/* Badge Category */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 backdrop-blur-md">
                    {event.category || 'Live Event'}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{formatDate(event.startTime)}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{formatTime(event.startTime)}</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Venue Details */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">{event.venue?.name}</span>
                      <p className="text-[11px] text-slate-400">{event.venue?.address || event.venue?.city}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Capacity: {event.venue?.totalCapacity || 70}</span>
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      From ₹{event.startingPrice ? event.startingPrice.toLocaleString('en-IN') : '1,500'}
                    </span>
                  </div>
                </div>

                {/* CTA Action */}
                <Link
                  to={`/events/${event.id}`}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                >
                  <Ticket className="w-4 h-4 text-indigo-400 group-hover/btn:text-white transition-colors" />
                  <span>Interactive Stadium Seating</span>
                  <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
