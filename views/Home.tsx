
import React from 'react';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import Card from '../components/Card';

const Home: React.FC = () => {
  const { verse, loading, error } = useVerseOfTheDay();

  const renderVerseContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }
    if (verse) {
      // Simple regex to find a scripture reference at the end
      const verseParts = verse.match(/(.*) - ([\w\s]+ \d+:\d+.*)/);
      if (verseParts) {
        return (
          <>
            <p className="text-lg md:text-xl italic text-gray-700">"{verseParts[1]}"</p>
            <p className="mt-2 text-md font-semibold text-blue-800">{verseParts[2]}</p>
          </>
        );
      }
      return <p className="text-lg md:text-xl italic text-gray-700">"{verse}"</p>;
    }
    return null;
  };
  
  return (
    <div className="space-y-12">
      <section className="text-center bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-blue-100">
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900">Welcome to Bethel Kohhran</h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          "For where two or three gather in my name, there am I with them." - Matthew 18:20
        </p>
      </section>

      <section>
        <Card className="border border-yellow-200 bg-yellow-50">
            <div className="p-8 text-center">
                <h3 className="text-2xl font-bold text-yellow-900 mb-4">Verse of the Day</h3>
                <div className="min-h-[6rem] flex flex-col justify-center">
                  {renderVerseContent()}
                </div>
            </div>
        </Card>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-center text-blue-900 mb-6">Church Service Timings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="p-6 bg-blue-800 text-white">
              <h4 className="font-bold text-xl">Sunday School</h4>
            </div>
            <div className="p-6">
              <p className="text-2xl font-bold text-gray-800">10:00 AM</p>
              <p className="text-gray-600">Every Sunday</p>
            </div>
          </Card>
          <Card className="text-center">
            <div className="p-6 bg-blue-800 text-white">
              <h4 className="font-bold text-xl">Worship Service</h4>
            </div>
            <div className="p-6">
              <p className="text-2xl font-bold text-gray-800">1:30 PM</p>
              <p className="text-gray-600">Every Sunday</p>
            </div>
          </Card>
          <Card className="text-center">
            <div className="p-6 bg-blue-800 text-white">
              <h4 className="font-bold text-xl">Evening Service</h4>
            </div>
            <div className="p-6">
              <p className="text-2xl font-bold text-gray-800">7:00 PM</p>
              <p className="text-gray-600">Every Sunday</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
