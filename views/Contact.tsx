
import React from 'react';
import Card from '../components/Card';

const Contact: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-900">Contact Us</h2>
        <p className="mt-2 text-gray-600">We would love to hear from you. Get in touch with us.</p>
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Church Location</h3>
            <p className="text-gray-600 font-semibold">Champhai Bethel Presbyterian Church</p>
            <p className="text-gray-600">Vengsang, Champhai</p>
            <p className="text-gray-600">Mizoram, India - 796321</p>
          </div>
          <div className="bg-gray-50 p-6 border-t">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
            <p className="text-gray-600">
              <strong>Bialtu Pastor:</strong> [Pastor's Phone Number]
            </p>
            <p className="text-gray-600">
              <strong>Kohhran Secretary:</strong> [Secretary's Phone Number]
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Email:</strong> champhai.bethel@gmail.com
            </p>
          </div>
        </Card>
        <Card className="overflow-hidden">
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3637.784462111867!2d93.3283313149921!3d23.46820098469592!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374c100000000001%3A0x6b8b0e515d0d9d6e!2sPresbyterian%20Church%20of%20India%2C%20Bethel%20Kohhran!5e0!3m2!1sen!2sin!4v1662991866345!5m2!1sen!2sin" 
                width="100%" 
                height="450" 
                style={{border:0}} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Church Location Map"
            ></iframe>
        </Card>
      </div>
    </div>
  );
};

export default Contact;
