
import React from 'react';
import { ANNOUNCEMENTS_DATA } from '../constants';
import Card from '../components/Card';

const Announcements: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-900">Announcements</h2>
        <p className="mt-2 text-gray-600">Stay updated with the latest news and information.</p>
      </div>
      <div className="space-y-6 max-w-4xl mx-auto">
        {ANNOUNCEMENTS_DATA.map((announcement, index) => (
          <Card key={index}>
            <div className="p-6">
              <p className="text-sm font-medium text-blue-700">{announcement.date}</p>
              <h3 className="text-xl font-bold text-gray-800 mt-1">{announcement.title}</h3>
              <p className="text-gray-600 mt-3">{announcement.content}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
