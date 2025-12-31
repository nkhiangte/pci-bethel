
import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Map Header */}
      <div className="h-96 w-full bg-slate-200">
        <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.849280860851!2d93.3283253!3d23.4735394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374d810056637385%3A0x6a2c3c6f24056250!2sPCI%20Champhai%20Bethel%20Kohhran!5e0!3m2!1sen!2sin!4v1709568000000!5m2!1sen!2sin" 
            width="100%" 
            height="100%" 
            style={{border:0}} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
            {/* Info Cards */}
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
                <div className="p-3 bg-church-50 text-church-600 rounded-full mb-4"><MapPin size={32} /></div>
                <h3 className="font-bold text-lg mb-2">Our Location</h3>
                <p className="text-slate-600">Bethel Veng, Champhai<br/>Mizoram 796321</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
                <div className="p-3 bg-green-50 text-green-600 rounded-full mb-4"><Phone size={32} /></div>
                <h3 className="font-bold text-lg mb-2">Phone & Email</h3>
                <p className="text-slate-600">+91 98620 12345<br/>office@bethelkohhran.pci</p>
            </div>
             <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-full mb-4"><Clock size={32} /></div>
                <h3 className="font-bold text-lg mb-2">Office Hours</h3>
                <p className="text-slate-600">Tue - Fri: 10am - 4pm<br/>Sat: 10am - 1pm</p>
            </div>
        </div>

        {/* Contact Form */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-100 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Send us a Message</h2>
            <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                        <input className="w-full border border-slate-300 rounded p-2.5" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                        <input className="w-full border border-slate-300 rounded p-2.5" />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
                     <textarea className="w-full border border-slate-300 rounded p-2.5 h-32" required></textarea>
                </div>
                <button className="w-full bg-church-600 text-white font-bold py-3 rounded hover:bg-church-700 transition">Send Message</button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;