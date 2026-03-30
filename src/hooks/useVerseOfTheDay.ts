
import { useState, useEffect } from 'react';
import { getDailyVerse } from '../services/geminiService';
import { Language } from '../translations';

interface VerseData {
  verse: string;
  date: string;
}

export const useVerseOfTheDay = (language: Language) => {
  const [verse, setVerse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getVerse = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split('T')[0];
        // Create a language-specific cache key so EN/MZ verses don't overwrite each other
        const cacheKey = `verseOfTheDay_${language}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          const { verse: cachedVerse, date }: VerseData = JSON.parse(cachedData);
          if (date === today) {
            setVerse(cachedVerse);
            setLoading(false);
            return;
          }
        }
        
        const verseObj = await getDailyVerse(language);
        
        if (verseObj) {
            const newVerse = `${verseObj.text} - ${verseObj.reference}`;
            setVerse(newVerse);
            const verseData: VerseData = { verse: newVerse, date: today };
            localStorage.setItem(cacheKey, JSON.stringify(verseData));
        } else {
             // Fallback verses based on language
             const fallbackVerse = language === 'mizo' 
                ? "LALPA chu mi vengtu a ni a; ka tlachham lovang. - Sam 23:1"
                : "The Lord is my shepherd, I lack nothing. - Psalm 23:1";

             setVerse(fallbackVerse);
             const verseData: VerseData = { verse: fallbackVerse, date: today };
             localStorage.setItem(cacheKey, JSON.stringify(verseData));
             setError('Failed to fetch verse of the day, showing default.');
        }

      } catch (err) {
        setError('An error occurred while fetching the verse of the day.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getVerse();
  }, [language]); // Re-run effect when language changes

  return { verse, loading, error };
};
