
import React from 'react';
import { LEADERS_DATA } from '../constants';
import Card from '../components/Card';

const Leaders: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-900">Our Leaders</h2>
        <p className="mt-2 text-gray-600">Meet the dedicated leaders of our church.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {LEADERS_DATA.map((leader, index) => (
          <Card key={index} className="text-center">
            <img 
              src={leader.imageUrl} 
              alt={leader.name} 
              className="w-full h-56 object-cover" 
            />
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800">{leader.name}</h3>
              <p className="text-blue-800 font-semibold">{leader.role}</p>
              {leader.tenure && (
                <p className="text-sm text-gray-500 mt-1">{leader.tenure}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Leaders;
