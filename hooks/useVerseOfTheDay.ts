
import { useState, useEffect } from 'react';
import { getDailyVerse } from '../services/geminiService';

interface VerseData {
  verse: string;
  date: string;
}

export const useVerseOfTheDay = () => {
  const [verse, setVerse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getVerse = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split('T')[0];
        const cachedData = localStorage.getItem('verseOfTheDay');

        if (cachedData) {
          const { verse: cachedVerse, date }: VerseData = JSON.parse(cachedData);
          if (date === today) {
            setVerse(cachedVerse);
            setLoading(false);
            return;
          }
        }
        
        const verseObj = await getDailyVerse();
        
        if (verseObj) {
            const newVerse = `${verseObj.text} - ${verseObj.reference}`;
            setVerse(newVerse);
            const verseData: VerseData = { verse: newVerse, date: today };
            localStorage.setItem('verseOfTheDay', JSON.stringify(verseData));
        } else {
             const fallbackVerse = "The Lord is my shepherd, I lack nothing. - Psalm 23:1";
             setVerse(fallbackVerse);
             const verseData: VerseData = { verse: fallbackVerse, date: today };
             localStorage.setItem('verseOfTheDay', JSON.stringify(verseData));
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
  }, []);

  return { verse, loading, error };
};
