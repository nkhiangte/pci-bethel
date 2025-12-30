
import { useState, useEffect } from 'react';
import { fetchVerseOfTheDay } from '../services/geminiService';

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

        const newVerse = await fetchVerseOfTheDay();
        setVerse(newVerse);
        const verseData: VerseData = { verse: newVerse, date: today };
        localStorage.setItem('verseOfTheDay', JSON.stringify(verseData));
      } catch (err) {
        setError('Failed to fetch verse of the day.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getVerse();
  }, []);

  return { verse, loading, error };
};
