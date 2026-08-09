
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Ministry } from '../types';
import { Clock, Users, Loader, Edit, Save, Plus, Trash2, X } from 'lucide-react';
import { getConstants } from '../constants'; // For fallback

interface ServiceOrderItem {
  id: string;
  time: string;
  event: string;
  detail: string;
  order: number;
}

const Worship: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ministries');
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderItem[]>([]);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderItems, setEditingOrderItems] = useState<ServiceOrderItem[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    const fetchMinistries = async () => {
        setLoading(true);
        if (!db?.collection) {
            // Fallback to static data if firebase is not available
            setMinistries(getConstants(language).ministries);
            setLoading(false);
            return;
        }
        try {
            const snapshot = await db.collection('ministries').get();
            if (!snapshot.empty) {
                const fetchedData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Ministry[];
                setMinistries(fetchedData);
            } else {
                // Fallback if collection is empty
                setMinistries(getConstants(language).ministries);
            }
        } catch (error) {
            console.error("Error fetching ministries:", error);
            setMinistries(getConstants(language).ministries);
        }
        setLoading(false);
    };
    fetchMinistries();
  }, [language]);

  useEffect(() => {
    const fetchServiceOrder = async () => {
      if (!db?.collection) return;
      try {
        const snapshot = await db.collection('settings').doc('worshipServiceOrder').get();
        if (snapshot.exists) {
          const data = snapshot.data();
          if (data && data.items) {
            setServiceOrder(data.items);
            return;
          }
        }
        
        // Default seed if not exists
        const defaultItems = [
          { id: '1', time: '10:00 AM', event: t.worship.events.callToWorship, detail: 'Elder on Duty', order: 1 },
          { id: '2', time: '10:05 AM', event: t.worship.events.invocation, detail: '', order: 2 },
          { id: '3', time: '10:10 AM', event: t.worship.events.praise, detail: 'Worship Team', order: 3 },
          { id: '4', time: '10:30 AM', event: t.worship.events.reading, detail: 'Psalm 23', order: 4 },
          { id: '5', time: '10:40 AM', event: t.worship.events.special, detail: 'Sunday School Intermediates', order: 5 },
          { id: '6', time: '10:50 AM', event: t.worship.events.sermon, detail: 'Pastor', order: 6 },
          { id: '7', time: '11:30 AM', event: t.worship.events.offertory, detail: '', order: 7 },
          { id: '8', time: '11:40 AM', event: t.worship.events.closing, detail: 'Lengkhawm Zai', order: 8 },
          { id: '9', time: '11:45 AM', event: t.worship.events.benediction, detail: 'Pastor', order: 9 },
        ];
        setServiceOrder(defaultItems);
      } catch (error) {
        console.error("Error fetching service order:", error);
      }
    };
    fetchServiceOrder();
  }, [t]);

  const handleEditOrder = () => {
    setEditingOrderItems([...serviceOrder]);
    setIsEditingOrder(true);
  };

  const handleAddOrderItem = () => {
    const newItem: ServiceOrderItem = {
      id: Date.now().toString(),
      time: '',
      event: '',
      detail: '',
      order: editingOrderItems.length + 1
    };
    setEditingOrderItems([...editingOrderItems, newItem]);
  };

  const handleUpdateOrderItem = (id: string, field: keyof ServiceOrderItem, value: string) => {
    setEditingOrderItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveOrderItem = (id: string) => {
    setEditingOrderItems(items => items.filter(item => item.id !== id));
  };

  const handleSaveOrder = async () => {
    if (!db?.collection) return;
    setSavingOrder(true);
    try {
      // reassign order numbers
      const sortedItems = editingOrderItems.map((item, index) => ({ ...item, order: index + 1 }));
      await db.collection('settings').doc('worshipServiceOrder').set({
        items: sortedItems
      });
      setServiceOrder(sortedItems);
      setIsEditingOrder(false);
    } catch (error) {
      console.error("Error saving service order:", error);
      alert("Failed to save. Please try again.");
    }
    setSavingOrder(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-serif font-bold text-church-900">{t.worship.title}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
          <button 
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'ministries' ? 'border-church-500 text-church-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('ministries')}
          >
            {t.worship.tabMinistries}
          </button>
          <button 
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'worship' ? 'border-church-500 text-church-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('worship')}
          >
            {t.worship.tabOrder}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'ministries' ? (
          loading ? (
            <div className="text-center py-10"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ministries.map((m) => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
                  <div className="h-48 overflow-hidden bg-slate-200">
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{m.name}</h3>
                      {m.acronym && <span className="bg-church-100 text-church-700 text-xs px-2 py-1 rounded font-bold">{m.acronym}</span>}
                    </div>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">{m.description}</p>
                    <div className="space-y-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" /> {m.leader}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" /> {m.schedule}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto relative">
            {isAdmin && !isEditingOrder && (
              <button 
                onClick={handleEditOrder}
                className="absolute top-8 right-8 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                title="Edit Service Order"
              >
                <Edit size={18} />
              </button>
            )}
            <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">{t.worship.serviceOrderTitle}</h2>
            
            {isEditingOrder ? (
              <div className="space-y-4 mt-8">
                {editingOrderItems.map((item, index) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                    <button 
                      onClick={() => handleRemoveOrderItem(item.id)}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-full"
                    >
                      <X size={14} />
                    </button>
                    <div className="w-full sm:w-1/4">
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Time</label>
                      <input 
                        type="text" 
                        value={item.time} 
                        onChange={(e) => handleUpdateOrderItem(item.id, 'time', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-church-500 outline-none text-sm"
                        placeholder="e.g. 10:00 AM"
                      />
                    </div>
                    <div className="w-full sm:w-2/4">
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Event</label>
                      <input 
                        type="text" 
                        value={item.event} 
                        onChange={(e) => handleUpdateOrderItem(item.id, 'event', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-church-500 outline-none text-sm"
                        placeholder="e.g. Call to Worship"
                      />
                    </div>
                    <div className="w-full sm:w-1/4">
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Detail (Optional)</label>
                      <input 
                        type="text" 
                        value={item.detail} 
                        onChange={(e) => handleUpdateOrderItem(item.id, 'detail', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-church-500 outline-none text-sm"
                        placeholder="e.g. Elder on Duty"
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 flex justify-between items-center border-t border-slate-200 mt-6">
                  <button 
                    onClick={handleAddOrderItem}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                  >
                    <Plus size={16} /> Add Item
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingOrder(false)}
                      className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveOrder}
                      disabled={savingOrder}
                      className="flex items-center gap-2 px-6 py-2 bg-church-600 hover:bg-church-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {savingOrder ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 relative border-l-2 border-slate-200 ml-4 pl-8">
                {serviceOrder.map((item, index) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[41px] top-0 w-5 h-5 bg-church-500 rounded-full border-4 border-white"></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                      <h4 className="text-lg font-bold text-slate-800">{item.event}</h4>
                      <span className="text-church-600 font-mono font-medium">{item.time}</span>
                    </div>
                    {item.detail && <p className="text-slate-500">{item.detail}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Worship;
