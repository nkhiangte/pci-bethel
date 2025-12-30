
import React from 'react';
import { SERMONS_DATA } from '../constants';
import Card from '../components/Card';
import { ScriptureIcon, MicrophoneIcon, UserIcon } from '../components/Icon';

const Sermons: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-900">Recent Sermons</h2>
        <p className="mt-2 text-gray-600">Listen to messages from our pastors and elders.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SERMONS_DATA.map((sermon, index) => (
          <Card key={index}>
            <div className="p-6">
              <p className="text-sm font-medium text-blue-700">{sermon.date}</p>
              <h3 className="text-xl font-bold text-gray-800 mt-2">{sermon.title}</h3>
              
              <div className="mt-4 space-y-2 text-gray-600">
                <div className="flex items-center space-x-2">
                  <UserIcon />
                  <span>{sermon.speaker}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ScriptureIcon />
                  <span>{sermon.scripture}</span>
                </div>
              </div>
            </div>
            {sermon.audioUrl && (
              <div className="bg-gray-50 px-6 py-3 border-t">
                <a 
                  href={sermon.audioUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center space-x-2 text-blue-800 font-semibold hover:text-blue-600 transition-colors"
                >
                  <MicrophoneIcon />
                  <span>Listen Now</span>
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Sermons;
