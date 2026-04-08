
import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Search, Bell, CheckCircle2, AlertCircle, Loader2, Send, Settings, Save, X as XIcon } from 'lucide-react';
import { db } from '../services/firebase';
import { Event } from '../types';
import { findContactByName, getWhatsAppLink, generateReminderMessage, ContactInfo, getReminderTemplate, updateReminderTemplate } from '../services/notificationService';
import { useLanguage } from '../contexts/LanguageContext';

interface ReminderDashboardProps {
  events: Event[];
  onClose: () => void;
}

interface PersonnelReminder {
  name: string;
  role: string;
  eventTitle: string;
  eventDate: string;
  contact?: ContactInfo | null;
  status: 'pending' | 'searching' | 'found' | 'not_found';
}

const ReminderDashboard: React.FC<ReminderDashboardProps> = ({ events, onClose }) => {
  const { language } = useLanguage();
  const [reminders, setReminders] = useState<PersonnelReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [template, setTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    const init = async () => {
      const t = await getReminderTemplate(language);
      setTemplate(t);
    };
    init();
  }, [language]);

  useEffect(() => {
    const prepareReminders = async () => {
      setLoading(true);
      const list: PersonnelReminder[] = [];
      
      // Filter events for this week (or upcoming)
      const now = new Date();
      const upcomingEvents = events.filter(ev => {
        const evDate = new Date(ev.date);
        return evDate >= new Date(now.setHours(0,0,0,0));
      }).slice(0, 10); // Limit to next 10 events

      for (const ev of upcomingEvents) {
        if (ev.program) {
          const roles = [
            { key: 'hruaitu', label: 'Hruaitu' },
            { key: 'tantu', label: 'Tantu' },
            { key: 'thuhriltu', label: 'Thuhriltu' }
          ];

          for (const role of roles) {
            const name = ev.program[role.key];
            if (name && name.trim().length > 1) {
              list.push({
                name: name.trim(),
                role: role.label,
                eventTitle: ev.title,
                eventDate: ev.date,
                status: 'searching'
              });
            }
          }
        }
      }

      // Find contacts for each
      const updatedList = await Promise.all(list.map(async (item) => {
        const contact = await findContactByName(item.name);
        return {
          ...item,
          contact,
          status: contact ? 'found' : 'not_found'
        } as PersonnelReminder;
      }));

      setReminders(updatedList);
      setLoading(false);
    };

    prepareReminders();
  }, [events]);

  const handleSendReminder = (reminder: PersonnelReminder) => {
    if (!reminder.contact) return;
    
    const message = generateReminderMessage(
      template,
      reminder.name,
      reminder.eventTitle,
      reminder.eventDate,
      reminder.role
    );
    
    const link = getWhatsAppLink(reminder.contact.phone, message);
    window.open(link, '_blank');
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    await updateReminderTemplate(template, language);
    setSavingTemplate(false);
    setShowSettings(false);
  };

  const isMonday = new Date().getDay() === 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-church-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center">
              <Bell className="mr-2" size={24} />
              {language === 'mizo' ? 'Hriattirna Dashboard' : 'Notification Dashboard'}
            </h3>
            <p className="text-church-100 text-sm mt-1">
              {language === 'mizo' 
                ? 'Inkhawm chanvo neite hriattirna thawnna' 
                : 'Send reminders to personnel for upcoming services'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded-full transition ${showSettings ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Settings"
            >
              <Settings size={24} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <XIcon size={24} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="p-6 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900 flex items-center">
                <Settings className="mr-2" size={18} />
                {language === 'mizo' ? 'Message Template Siamremna' : 'Edit Message Template'}
              </h4>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {language === 'mizo' 
                ? 'Heng variable-te hi hman theih an ni: {name}, {date}, {event}, {role}' 
                : 'Available variables: {name}, {date}, {event}, {role}'}
            </p>
            <textarea 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-32 p-3 text-sm border rounded-xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none resize-none bg-white"
              placeholder="Enter message template..."
            />
            <div className="flex justify-end mt-4">
              <button 
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition disabled:opacity-50"
              >
                {savingTemplate ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                {language === 'mizo' ? 'Vawngtha Rawh' : 'Save Template'}
              </button>
            </div>
          </div>
        )}

        {isMonday && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-start space-x-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {language === 'mizo' ? 'Vawiin hi Thawhtanni a ni!' : "Today is Monday!"}
              </p>
              <p className="text-xs text-amber-700">
                {language === 'mizo' 
                  ? 'Kar thar inkhawm chanvo neite hriattir hun a ni e.' 
                  : 'It is time to notify personnel for this week\'s services.'}
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-church-600 mb-4" size={40} />
              <p className="text-slate-500">
                {language === 'mizo' ? 'Contact-te zawn mek a ni...' : 'Searching for contacts...'}
              </p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium">
                {language === 'mizo' ? 'Hriattir tur an awm rih lo.' : 'No upcoming personnel to notify.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-church-200 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-bold text-slate-900">{reminder.name}</span>
                      <span className="mx-2 text-slate-300">•</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-church-100 text-church-700 rounded uppercase">
                        {reminder.role}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {reminder.eventTitle} — {reminder.eventDate}
                    </div>
                    {reminder.contact ? (
                      <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                        <Phone size={12} className="mr-1" />
                        {reminder.contact.phone} 
                        <span className="ml-2 text-slate-400 font-normal">({reminder.contact.source})</span>
                      </div>
                    ) : (
                      <div className="flex items-center mt-2 text-xs text-red-500 font-medium">
                        <AlertCircle size={12} className="mr-1" />
                        {language === 'mizo' ? 'Phone number hmuh a ni lo' : 'Phone number not found'}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    {reminder.contact ? (
                      <button 
                        onClick={() => handleSendReminder(reminder)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-sm"
                      >
                        <MessageCircle size={18} />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    ) : (
                      <button 
                        className="p-2 text-slate-400 hover:text-church-600 transition"
                        title="Search manually"
                      >
                        <Search size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-white transition"
          >
            {language === 'mizo' ? 'Kharkuap' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default ReminderDashboard;
