
import { Language } from "../translations";

export const getDailyVerse = async (language: Language = 'en'): Promise<{ text: string; reference: string } | null> => {
  try {
    const response = await fetch('/api/daily-verse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language })
    });

    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching verse:", error);
    return null;
  }
};
