import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../lib/api';

export default function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!query) {
      setResults([
        { id: 'dash', title: 'Go to Dashboard', type: 'page', url: '/dashboard' },
        { id: 'proj', title: 'Go to Projects', type: 'page', url: '/projects' },
      ]);
      return;
    }

    const fetchSearch = async () => {
      try {
        // Quick local filter for pages, but we could search tasks/projects via API
        const filtered = [
          { id: 'dash', title: 'Go to Dashboard', type: 'page', url: '/dashboard' },
          { id: 'proj', title: 'Go to Projects', type: 'page', url: '/projects' },
        ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()));
        setResults(filtered);
      } catch (err) {
        // Error
      }
    };
    const timeoutId = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (url) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-navy-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No results found.</div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.id}
                onClick={() => handleSelect(r.url)}
                className="px-4 py-3 cursor-pointer rounded-lg hover:bg-indigo-600/20 hover:text-indigo-400 text-gray-300 transition-colors flex items-center"
              >
                {r.title}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
