import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Star, MessageCircle, ThumbsUp, ThumbsDown, Minus, RotateCw } from 'lucide-react';
import { StorageService } from '../services/storage';
import { analyzeSentiment } from '../services/geminiService';
import { Review } from '../types';

const Customers: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState('Analyzing feedback...');
  const [loading, setLoading] = useState(false);

  const settings = StorageService.getSettings();
  const cacheKey = useMemo(() => `customers_sentiment_${settings.aiResponseStyle}`, [settings.aiResponseStyle]);

  const fetchSentiment = useCallback(async (force: boolean = false) => {
    const data = StorageService.getReviews();
    setReviews(data);

    const cached = StorageService.getCachedInsight(cacheKey);
    if (cached && !force) {
        setSummary(cached);
        return;
    }

    setLoading(true);
    const text = await analyzeSentiment(data);
    setSummary(text);
    StorageService.setCachedInsight(cacheKey, text);
    setLoading(false);
  }, [cacheKey]);

  useEffect(() => {
    fetchSentiment();
  }, [fetchSentiment]);

  const getSentimentIcon = (rating: number) => {
      if (rating >= 4) return <ThumbsUp className="w-4 h-4 text-green-500" />;
      if (rating <= 2) return <ThumbsDown className="w-4 h-4 text-red-500" />;
      return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Insights</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sentiment analysis from recent feedback.</p>
        </div>
        <button 
            onClick={() => fetchSentiment(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recalculate AI Sentiment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <RotateCw className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Sentiment Summary</h3>
                </div>
                <div 
                    className="prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: summary }}
                />
             </div>

             <div className="space-y-4">
                {reviews.map(r => (
                    <div key={r.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                            {r.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium text-slate-900 dark:text-white">{r.author}</h4>
                                <span className="text-xs text-slate-400">{r.date}</span>
                            </div>
                            <div className="flex items-center gap-1 my-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{r.text}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg min-w-[3rem]">
                            {getSentimentIcon(r.rating)}
                        </div>
                    </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
              <div className="bg-primary-600 rounded-xl p-6 text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-1">4.2</h3>
                  <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_,i) => <Star key={i} className={`w-4 h-4 ${i<4 ? 'fill-white' : 'opacity-30'}`} />)}
                  </div>
                  <p className="text-sm opacity-90">Average Rating</p>
                  <div className="mt-4 pt-4 border-t border-white/20 text-xs">
                      Based on recent data analysis
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Customers;