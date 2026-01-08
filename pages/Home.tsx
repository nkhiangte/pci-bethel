
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Tag, Loader, Clock, User, BookOpen, Star, Music, Users, Flower2, Plus, Edit, Trash, Database, Shield, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { Announcement, Event, WeeklyDuty, Staff } from '../types';
import { getConstants } from '../constants';
import StatsCounter from '../components/StatsCounter';
import Card from '../components/Card'; // Import Card component
import { useAuth } from '../contexts/AuthContext';
import StaffEditModal from '../components/StaffEditModal'; // FIX: Import new generic modal component

// Format date for matching (YYYY-MM-DD)
const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
};

// FIX: Changed default export to named export to match the import change in App.tsx.
export const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const [news, setNews] = useState<Announcement[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [weeklyProgramDetails, setWeeklyProgramDetails] = useState<any[]>([]);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [weeklyDuties, setWeeklyDuties] = useState<WeeklyDuty | null>(null);
  const [loadingDuties, setLoadingDuties] = useState(true);
  
  const [churchElders, setChurchElders] = useState<Staff[]>([]);
  const [loadingElders, setLoadingElders] = useState(true);
  const [isSeedingElders, setIsSeedingElders] = useState(false);
  const [isElderModalOpen, setIsElderModalOpen] = useState(false);
  const [editingElder, setEditingElder] = useState<Partial<Staff> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Pastor-specific states
  const [churchPastors, setChurchPastors] = useState<Staff[]>([]);
  const [loadingPastors, setLoadingPastors] = useState(true);
  const [isSeedingPastors, setIsSeedingPastors] = useState(false);
  const [isPastorModalOpen, setIsPastorModalOpen] = useState(false);
  const [editingPastor, setEditingPastor] = useState<Partial<Staff> | null>(null);
  const [showDeletePastorConfirm, setShowDeletePastorConfirm] = useState<string | null>(null);

  // New: Pro Pastor-specific states
  const [churchProPastors, setChurchProPastors] = useState<Staff[]>([]);
  const [loadingProPastors, setLoadingProPastors] = useState(true);
  const [isSeedingProPastors, setIsSeedingProPastors] = useState(false);
  const [isProPastorModalOpen, setIsProPastorModalOpen] = useState(false);
  const [editingProPastor, setEditingProPastor] = useState<Partial<Staff> | null>(null);
  const [showDeleteProPastorConfirm, setShowDeleteProPastorConfirm] = useState<string | null>(null);


  // State for reordering Elders
  const initialEldersOrderRef = useRef<Staff[]>([]);
  const [hasElderOrderChanged, setHasElderOrderChanged] = useState(false);
  
  // State for reordering Pastors
  const initialPastorsOrderRef = useRef<Staff[]>([]);
  const [hasPastorOrderChanged, setHasPastorOrderChanged] = useState(false);

  // New: State for reordering Pro Pastors
  const initialProPastorsOrderRef = useRef<Staff[]>([]);
  const [hasProPastorOrderChanged, setHasProPastorOrderChanged] = useState(false);


  const { announcements: staticNews, weeklyDuty: staticDuty, pastors: staticPastors, elders: staticElders, proPastors: staticProPastors } = getConstants(language);

  const getWeekDateRange = () => {
    const today = new Date();
    // Adjust so Monday is 0 and Sunday is 6
    const dayOfWeek = (today.getDay() + 6) % 7;

    // Calculate start of the week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    // Calculate end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleString('en-US', { month: 'long' });
    const endMonth = endOfWeek.toLocaleString('en-US', { month: 'long' });
    const year = startOfWeek.getFullYear();
    const endYear = endOfWeek.getFullYear();
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();

    let dateRange = '';
    if (year !== endYear) {
      dateRange = `${startDay} ${startMonth} ${year} - ${endDay} ${endMonth} ${endYear}`;
    } else if (startMonth !== endMonth) {
      dateRange = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    } else {
      dateRange = `${startDay} - ${endDay} ${startMonth} ${year}`;
    }
    return `(${dateRange})`;
  };

  const weekRange = getWeekDateRange();


  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      if (!db || !db.collection) {
        setNews(staticNews);
        setLoadingNews(false);
        return;
      }
      try {
        const snapshot = await db.collection('announcements').orderBy('date', 'desc').get();
        if (!snapshot.empty) {
          const fetchedData = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as Announcement[];
          setNews(fetchedData);
        } else {
          setNews(staticNews);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setNews(staticNews);
      }
      setLoadingNews(false);
    };
    fetchNews();
  }, [language, staticNews]);
  
  useEffect(() => {
    const fetchAndProcessPrograms = async () => {
        setLoadingProgram(true);

        const today = new Date();
        const dayOfWeek = (today.getDay() + 6) % 7; 
        const startOfWeek = new Date(today);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        
        const allConstantEvents = getConstants(language).events;
        
        let realEvents: Event[] = [];
        try {
            if (db && db.collection) {
                const snapshot = await db.collection('events').get();
                if (!snapshot.empty) {
                   realEvents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Event[];
                }
            }
        } catch (e) {
            console.error("Error fetching events:", e);
        }

        const basePrograms = t.home.weeklyProgram;

        const detailedPrograms = basePrograms.map(baseProg => {
            const programDate = new Date(startOfWeek);
            const dayOffset = (baseProg.dayOfWeek + 6) % 7;
            programDate.setDate(startOfWeek.getDate() + dayOffset);

            const dateStr = formatDateForInput(programDate);
            
            const specificEvent = realEvents.find(e => e.date === dateStr && !e.isCancelled);

            if (specificEvent) {
                return { ...baseProg, name: specificEvent.title, details: specificEvent.program };
            }
            
            const constantMatch = allConstantEvents.find(e => e.date === dateStr && e.program);
            if (constantMatch) {
               return { ...baseProg, name: constantMatch.title, details: constantMatch.program };
            }

            return baseProg;
        });
        
        setWeeklyProgramDetails(detailedPrograms);
        setLoadingProgram(false);
    };

    fetchAndProcessPrograms();
}, [language, t.home.weeklyProgram]);

 useEffect(() => {
    const fetchDuties = async () => {
        setLoadingDuties(true);
        if (!db?.doc) {
            setWeeklyDuties(staticDuty);
            setLoadingDuties(false);
            return;
        }
        try {
            const doc = await db.collection('weeklyDuties').doc('current').get();
            if (doc.exists) {
                setWeeklyDuties({ id: doc.id, ...doc.data() } as WeeklyDuty);
            } else {
                setWeeklyDuties(staticDuty);
            }
        } catch (error) {
            console.error("Error fetching weekly duties:", error);
            setWeeklyDuties(staticDuty);
        }
        setLoadingDuties(false);
    };
    fetchDuties();
  }, [language, staticDuty]);

  const fetchElders = useCallback(async () => {
    setLoadingElders(true);
    if (!db || !db.collection) {
      setChurchElders(staticElders);
      initialEldersOrderRef.current = staticElders;
      setLoadingElders(false);
      return;
    }
    try {
      // Order by 'order' field first, then by 'name' as a fallback/secondary sort
      // NOTE: This query requires a Firestore composite index on 'elders' collection:
      // Fields: 'order' (Ascending), 'name' (Ascending)
      const snapshot = await db.collection('elders').orderBy('order', 'asc').orderBy('name', 'asc').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        setChurchElders(fetchedData);
        initialEldersOrderRef.current = fetchedData; // Store the fetched order
      } else {
        setChurchElders(staticElders); // Fallback to static if collection is empty
        initialEldersOrderRef.current = staticElders;
      }
    } catch (error) {
      console.error("Error fetching elders:", error); // This is where the error is reported
      setChurchElders(staticElders); // Fallback on error
      initialEldersOrderRef.current = staticElders;
    }
    setLoadingElders(false);
    setHasElderOrderChanged(false); // Reset order change status after fresh fetch
  }, [staticElders]);

  const fetchPastors = useCallback(async () => {
    setLoadingPastors(true);
    if (!db || !db.collection) {
      setChurchPastors(staticPastors);
      initialPastorsOrderRef.current = staticPastors;
      setLoadingPastors(false);
      return;
    }
    try {
      // NOTE: This query requires a Firestore composite index on 'pastors' collection:
      // Fields: 'order' (Ascending), 'name' (Ascending)
      const snapshot = await db.collection('pastors').orderBy('order', 'asc').orderBy('name', 'asc').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        setChurchPastors(fetchedData);
        initialPastorsOrderRef.current = fetchedData;
      } else {
        setChurchPastors(staticPastors);
        initialPastorsOrderRef.current = staticPastors;
      }
    } catch (error) {
      console.error("Error fetching pastors:", error);
      setChurchPastors(staticPastors);
      initialPastorsOrderRef.current = staticPastors;
    }
    setLoadingPastors(false);
    setHasPastorOrderChanged(false);
  }, [staticPastors]);

  // New: Fetch Pro Pastors
  const fetchProPastors = useCallback(async () => {
    setLoadingProPastors(true);
    if (!db || !db.collection) {
      setChurchProPastors(staticProPastors);
      initialProPastorsOrderRef.current = staticProPastors;
      setLoadingProPastors(false);
      return;
    }
    try {
      // NOTE: This query requires a Firestore composite index on 'proPastors' collection:
      // Fields: 'order' (Ascending), 'name' (Ascending)
      const snapshot = await db.collection('proPastors').orderBy('order', 'asc').orderBy('name', 'asc').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        setChurchProPastors(fetchedData);
        initialProPastorsOrderRef.current = fetchedData;
      } else {
        setChurchProPastors(staticProPastors);
        initialProPastorsOrderRef.current = staticProPastors;
      }
    } catch (error) {
      console.error("Error fetching pro pastors:", error);
      setChurchProPastors(staticProPastors);
      initialProPastorsOrderRef.current = staticProPastors;
    }
    setLoadingProPastors(false);
    setHasProPastorOrderChanged(false);
  }, [staticProPastors]);


  useEffect(() => {
    fetchElders();
    fetchPastors();
    fetchProPastors(); // New: Fetch Pro Pastors
  }, [fetchElders, fetchPastors, fetchProPastors]);

  // Check if the current elder order differs from the initial order (deep comparison)
  useEffect(() => {
    const isOrderDifferent = JSON.stringify(churchElders.map(e => e.id)) !== JSON.stringify(initialEldersOrderRef.current.map(e => e.id));
    setHasElderOrderChanged(isOrderDifferent);
  }, [churchElders]);

  // Check if the current pastor order differs from the initial order (deep comparison)
  useEffect(() => {
    const isOrderDifferent = JSON.stringify(churchPastors.map(p => p.id)) !== JSON.stringify(initialPastorsOrderRef.current.map(p => p.id));
    setHasPastorOrderChanged(isOrderDifferent);
  }, [churchPastors]);

  // New: Check if the current pro pastor order differs from the initial order
  useEffect(() => {
    const isOrderDifferent = JSON.stringify(churchProPastors.map(pp => pp.id)) !== JSON.stringify(initialProPastorsOrderRef.current.map(pp => pp.id));
    setHasProPastorOrderChanged(isOrderDifferent);
  }, [churchProPastors]);


  const handleSeedElders = async () => {
    if (!db?.collection || !window.confirm("This will DELETE ALL existing elders and re-seed from the initial data. Are you sure?")) {
        return;
    }

    setIsSeedingElders(true);
    try {
        const eldersRef = db.collection('elders');
        
        // 1. Delete all existing documents
        const existingDocs = await eldersRef.get();
        if (!existingDocs.empty) {
            const deleteBatch = db.batch();
            existingDocs.docs.forEach((doc: any) => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log("Existing elders deleted.");
        }

        // 2. Add all new documents from staticElders with an 'order' field
        const addBatch = db.batch();
        staticElders.forEach((elderData, index) => {
            const newDocRef = eldersRef.doc(); // Firestore generates ID
            addBatch.set(newDocRef, { ...elderData, order: index }); // Assign initial order
        });
        await addBatch.commit();
        console.log("Successfully seeded elders!");

        fetchElders(); // Refresh the list
        alert("Elder data seeding complete!");

    } catch (error) {
        console.error("Error seeding elder data:", error);
        alert("An error occurred during elder data seeding.");
    }
    setIsSeedingElders(false);
  };

  const handleSeedPastors = async () => {
    if (!db?.collection || !window.confirm("This will DELETE ALL existing pastors and re-seed from the initial data. Are you sure?")) {
        return;
    }

    setIsSeedingPastors(true);
    try {
        const pastorsRef = db.collection('pastors');
        
        // 1. Delete all existing documents
        const existingDocs = await pastorsRef.get();
        if (!existingDocs.empty) {
            const deleteBatch = db.batch();
            existingDocs.docs.forEach((doc: any) => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log("Existing pastors deleted.");
        }

        // 2. Add all new documents from staticPastors with an 'order' field
        const addBatch = db.batch();
        staticPastors.forEach((pastorData, index) => {
            const newDocRef = pastorsRef.doc(); // Firestore generates ID
            addBatch.set(newDocRef, { ...pastorData, order: index }); // Assign initial order
        });
        await addBatch.commit();
        console.log("Successfully seeded pastors!");

        fetchPastors(); // Refresh the list
        alert("Pastor data seeding complete!");

    } catch (error) {
        console.error("Error seeding pastor data:", error);
        alert("An error occurred during pastor data seeding.");
    }
    setIsSeedingPastors(false);
  };

  // New: handleSeedProPastors
  const handleSeedProPastors = async () => {
    if (!db?.collection || !window.confirm("This will DELETE ALL existing pro pastors and re-seed from the initial data. Are you sure?")) {
        return;
    }

    setIsSeedingProPastors(true);
    try {
        const proPastorsRef = db.collection('proPastors');
        
        // 1. Delete all existing documents
        const existingDocs = await proPastorsRef.get();
        if (!existingDocs.empty) {
            const deleteBatch = db.batch();
            existingDocs.docs.forEach((doc: any) => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log("Existing pro pastors deleted.");
        }

        // 2. Add all new documents from staticProPastors with an 'order' field
        const addBatch = db.batch();
        staticProPastors.forEach((proPastorData, index) => {
            const newDocRef = proPastorsRef.doc(); // Firestore generates ID
            addBatch.set(newDocRef, { ...proPastorData, order: index }); // Assign initial order
        });
        await addBatch.commit();
        console.log("Successfully seeded pro pastors!");

        fetchProPastors(); // Refresh the list
        alert("Pro Pastor data seeding complete!");

    } catch (error) {
        console.error("Error seeding pro pastor data:", error);
        alert("An error occurred during pro pastor data seeding.");
    }
    setIsSeedingProPastors(false);
  };


  const handleSaveStaff = async (staff: Staff, collectionName: 'elders' | 'pastors' | 'proPastors') => {
    if (!db?.collection) return;
    setLoadingElders(true); // General loading for any staff operation
    setLoadingPastors(true); // General loading for any staff operation
    setLoadingProPastors(true); // General loading for any staff operation
    try {
      const { id, ...dataToSave } = staff;
      if (id) {
        await db.collection(collectionName).doc(id).set(dataToSave, { merge: true });
      } else {
        // Assign a high order for new staff to appear at the end
        const currentStaff = 
          collectionName === 'elders' ? churchElders : 
          collectionName === 'pastors' ? churchPastors :
          churchProPastors; // For proPastors
        const newOrder = currentStaff.length > 0 ? Math.max(...currentStaff.map(s => s.order || 0)) + 1 : 0;
        await db.collection(collectionName).add({ ...dataToSave, order: newOrder });
      }
      setIsElderModalOpen(false);
      setIsPastorModalOpen(false);
      setIsProPastorModalOpen(false); // New: Close Pro Pastor modal
      if (collectionName === 'elders') fetchElders();
      else if (collectionName === 'pastors') fetchPastors();
      else fetchProPastors(); // New: Fetch Pro Pastors
    } catch (error) {
      console.error(`Error saving ${collectionName} member:`, error);
    }
    setLoadingElders(false);
    setLoadingPastors(false);
    setLoadingProPastors(false); // New: Turn off Pro Pastor loading
  };

  const handleDeleteStaff = async (id: string, collectionName: 'elders' | 'pastors' | 'proPastors') => {
    if (!db?.collection || !window.confirm(`Are you sure you want to delete this ${collectionName === 'elders' ? 'elder' : (collectionName === 'pastors' ? 'pastor' : 'pro pastor')}? This action cannot be undone.`)) return;
    setLoadingElders(true); // General loading for any staff operation
    setLoadingPastors(true); // General loading for any staff operation
    setLoadingProPastors(true); // General loading for any staff operation
    try {
      await db.collection(collectionName).doc(id).delete();
      if (collectionName === 'elders') fetchElders();
      else if (collectionName === 'pastors') fetchPastors();
      else fetchProPastors(); // New: Fetch Pro Pastors
    } catch (error) {
      console.error(`Error deleting ${collectionName} member:`, error);
    }
    setLoadingElders(false);
    setLoadingPastors(false);
    setLoadingProPastors(false); // New: Turn off Pro Pastor loading
  };


  const handleMoveStaff = (staffId: string, direction: 'up' | 'down', staffList: Staff[], setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>) => {
    const currentIndex = staffList.findIndex(e => e.id === staffId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < staffList.length) {
      const updatedStaff = [...staffList];
      const [movedStaff] = updatedStaff.splice(currentIndex, 1);
      updatedStaff.splice(newIndex, 0, movedStaff);
      setStaffList(updatedStaff);
    }
  };

  const handleSaveOrder = async (collectionName: 'elders' | 'pastors' | 'proPastors', staffList: Staff[], setLoadingFunc: React.Dispatch<React.SetStateAction<boolean>>, setHasOrderChangedFunc: React.Dispatch<React.SetStateAction<boolean>>, fetchFunc: () => Promise<void>) => {
    if (!db?.batch || !window.confirm(`Confirm saving new ${collectionName} order to database?`)) {
      return;
    }

    setLoadingFunc(true);
    try {
      const batch = db.batch();
      staffList.forEach((staff, index) => {
        if (staff.id) {
          const staffRef = db.collection(collectionName).doc(staff.id);
          batch.update(staffRef, { order: index });
        }
      });
      await batch.commit();
      console.log(`${collectionName} order updated successfully!`);
      fetchFunc(); // Re-fetch to confirm and reset state
      alert(`${collectionName} order saved!`);
    } catch (error) {
      console.error(`Error saving ${collectionName} order:`, error);
      alert(`An error occurred while saving the ${collectionName} order.`);
    }
    setLoadingFunc(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingNews ? (
            <div className="animate-pulse">
              <div className="h-12 w-1/2 bg-slate-200 rounded mb-8"></div>
              <div className="h-96 bg-slate-200 rounded-xl mb-8"></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-64 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Note: The main banner is now in App.tsx */}

              {news[0] && ( // Check if news has at least one item before accessing [0]
                <div className="mb-12 group">
                  <Link to="/announcements" className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    {/* Changed bg-white/70 backdrop-blur-sm to bg-white/95 and removed backdrop-blur for sharpness */}
                    <div 
                      className="relative h-[500px] bg-cover bg-center flex items-end p-8 text-white"
                      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${news[0].imageUrl || 'https://picsum.photos/seed/church/1200/800'})` }}
                    >
                      <div className="max-w-3xl">
                        <span className="bg-church-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">{news[0].category}</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mt-4 mb-4 leading-tight drop-shadow-md">
                          {news[0].title}
                        </h2>
                        <p className="text-slate-100 text-lg mb-6 line-clamp-2 drop-shadow-md">
                          {news[0].content}
                        </p>
                        <div className="flex items-center text-sm font-medium text-slate-200">
                          <Calendar size={16} className="mr-2" /> {news[0].date}
                          <span className="mx-3">|</span>
                          <div className="flex items-center text-white font-bold group-hover:underline">
                            Read More <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {news.slice(1).map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                    <Link to="/announcements" className="block">
                      <div className="aspect-video bg-slate-200 overflow-hidden">
                        <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center text-xs text-slate-500 mb-2">
                          <Tag size={14} className="mr-1.5 text-church-500" /> <span className="font-semibold uppercase">{item.category}</span>
                          <span className="mx-2">•</span>
                          <Calendar size={14} className="mr-1.5" /> <span>{item.date}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-church-700">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3">
                          {item.content}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* This section previously had backdrop blur, removing for clarity */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-church-100">
            <h2 className="text-3xl md:text-4xl font-bold text-church-900 mb-4">Welcome to Bethel Kohhran</h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto font-medium">
              "For where two or three gather in my name, there am I with them." - Matthew 18:20
            </p>
          </div>
        </div>
      </section>

      {/* Kohhran Puipate (Leaders) Section */}
      <div className="py-16 bg-church-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-center text-church-900 mb-10">{t.home.puipate}</h2>
          
          {isAdmin && (
             <div className="text-center mb-8 flex flex-wrap justify-center gap-4">
                <button 
                  onClick={handleSeedPastors} 
                  disabled={isSeedingPastors || loadingPastors}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                >
                  {isSeedingPastors ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
                  Seed Pastor Data
                </button>
                <button 
                  onClick={() => { setEditingPastor({role: 'Pastor', name: '', imageUrl: '', description: '', order: churchPastors.length > 0 ? Math.max(...churchPastors.map(p => p.order || 0)) + 1 : 0}); setIsPastorModalOpen(true); }}
                  disabled={loadingPastors}
                  className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition disabled:opacity-50"
                >
                  <Plus size={18} className="mr-2" /> Add New Pastor
                </button>
                <button 
                  onClick={() => handleSaveOrder('pastors', churchPastors, setLoadingPastors, setHasPastorOrderChanged, fetchPastors)} 
                  disabled={!hasPastorOrderChanged || loadingPastors}
                  className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition disabled:opacity-50"
                  title={hasPastorOrderChanged ? "Save current display order to database" : "Order is already saved or no changes made"}
                >
                  <Save size={18} className="mr-2" />
                  Save Pastor Order
                </button>
             </div>
          )}

          {loadingPastors ? (
             <div className="text-center"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
          ) : (
            <>
              {/* Pastors Grid */}
              {churchPastors.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center mb-16">
                  {churchPastors.map((pastor, index) => (
                    <Card key={pastor.id} className="text-center relative group">
                      <img
                        src={pastor.imageUrl}
                        alt={pastor.name}
                        className="w-full h-64 object-cover object-top"
                      />
                      <div className="p-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">{pastor.name}</h3>
                        <p className="text-church-700 font-semibold text-lg">{pastor.role}</p>
                        {pastor.description && (
                          <p className="text-sm text-slate-600 mt-2 italic line-clamp-3">{pastor.description}</p>
                        )}
                        {/* Admin Controls */}
                        {isAdmin && (
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleMoveStaff(pastor.id!, 'up', churchPastors, setChurchPastors)}
                              disabled={index === 0 || loadingPastors}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                              title="Move Up"
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => handleMoveStaff(pastor.id!, 'down', churchPastors, setChurchPastors)}
                              disabled={index === churchPastors.length - 1 || loadingPastors}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                              title="Move Down"
                            >
                                <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => { setEditingPastor(pastor); setIsPastorModalOpen(true); }}
                              className="p-1.5 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition"
                              title="Edit Pastor"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={() => setShowDeletePastorConfirm(pastor.id || '')}
                                className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition"
                                title="Delete Pastor"
                            >
                                <Trash size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                   <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
                       <Shield size={48} className="mx-auto text-slate-300 mb-4" />
                       <p className="text-slate-500">No pastor listed. {isAdmin && "Use the 'Add New Pastor' or 'Seed Pastor Data' button to populate."}</p>
                   </div>
              )}

              {/* New: Church Pro Pastors Grid */}
              <h3 className="text-2xl font-serif font-bold text-center text-church-900 mt-16 mb-8">{t.home.kohhranProPastors}</h3>
              {isAdmin && (
                 <div className="text-center mb-8 flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={handleSeedProPastors} 
                      disabled={isSeedingProPastors || loadingProPastors}
                      className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                    >
                      {isSeedingProPastors ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
                      Seed Pro Pastor Data
                    </button>
                    <button 
                      onClick={() => { setEditingProPastor({role: 'Pro Pastor', name: '', imageUrl: '', description: '', order: churchProPastors.length > 0 ? Math.max(...churchProPastors.map(pp => pp.order || 0)) + 1 : 0}); setIsProPastorModalOpen(true); }}
                      disabled={loadingProPastors}
                      className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition disabled:opacity-50"
                    >
                      <Plus size={18} className="mr-2" /> Add New Pro Pastor
                    </button>
                    <button 
                      onClick={() => handleSaveOrder('proPastors', churchProPastors, setLoadingProPastors, setHasProPastorOrderChanged, fetchProPastors)} 
                      disabled={!hasProPastorOrderChanged || loadingProPastors}
                      className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition disabled:opacity-50"
                      title={hasProPastorOrderChanged ? "Save current display order to database" : "Order is already saved or no changes made"}
                    >
                      <Save size={18} className="mr-2" />
                      Save Pro Pastor Order
                    </button>
                 </div>
              )}
              {loadingProPastors ? (
                 <div className="text-center py-10"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
              ) : (
                <>
                  {churchProPastors.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                      {churchProPastors.map((proPastor, index) => (
                        <Card key={proPastor.id} className="text-center relative group">
                          <img 
                            src={proPastor.imageUrl} 
                            alt={proPastor.name} 
                            className="w-full h-48 object-cover object-top" 
                          />
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-slate-900">{proPastor.name}</h3>
                            <p className="text-church-700 font-medium">{proPastor.role}</p>
                            {proPastor.description && (
                              <p className="text-sm text-slate-500 mt-2 line-clamp-3">{proPastor.description}</p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleMoveStaff(proPastor.id!, 'up', churchProPastors, setChurchProPastors)}
                                disabled={index === 0 || loadingProPastors}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                                title="Move Up"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button 
                                onClick={() => handleMoveStaff(proPastor.id!, 'down', churchProPastors, setChurchProPastors)}
                                disabled={index === churchProPastors.length - 1 || loadingProPastors}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                                title="Move Down"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button 
                                onClick={() => { setEditingProPastor(proPastor); setIsProPastorModalOpen(true); }}
                                className="p-1.5 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition"
                                title="Edit Pro Pastor"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => setShowDeleteProPastorConfirm(proPastor.id || '')}
                                className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition"
                                title="Delete Pro Pastor"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No Pro Pastors listed. {isAdmin && "Use the 'Add New Pro Pastor' or 'Seed Pro Pastor Data' button to populate."}</p>
                    </div>
                  )}
                </>
              )}


              {/* Church Elders Grid */}
              <h3 className="text-2xl font-serif font-bold text-center text-church-900 mt-16 mb-8">{t.home.kohhranElders}</h3>
              {isAdmin && (
                 <div className="text-center mb-8 flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={handleSeedElders} 
                      disabled={isSeedingElders || loadingElders}
                      className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                    >
                      {isSeedingElders ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
                      Seed Elders Data
                    </button>
                    <button 
                      onClick={() => { setEditingElder({role: 'Elder', name: '', imageUrl: '', description: '', order: churchElders.length > 0 ? Math.max(...churchElders.map(e => e.order || 0)) + 1 : 0}); setIsElderModalOpen(true); }}
                      disabled={loadingElders}
                      className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition disabled:opacity-50"
                    >
                      <Plus size={18} className="mr-2" /> Add New Elder
                    </button>
                    <button 
                      onClick={() => handleSaveOrder('elders', churchElders, setLoadingElders, setHasElderOrderChanged, fetchElders)} 
                      disabled={!hasElderOrderChanged || loadingElders}
                      className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition disabled:opacity-50"
                      title={hasElderOrderChanged ? "Save current display order to database" : "Order is already saved or no changes made"}
                    >
                      <Save size={18} className="mr-2" />
                      Save Elder Order
                    </button>
                 </div>
              )}
              {loadingElders ? (
                 <div className="text-center py-10"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
              ) : (
                <>
                  {churchElders.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {churchElders.map((elder, index) => {
                        // Strip "Upa " or "T. Upa " from the displayed name
                        const displayName = elder.name.replace(/^(Upa|T\.?\s*Upa)\s+/i, '');
                        
                        return (
                        <Card key={elder.id} className="text-center relative group">
                          <img 
                            src={elder.imageUrl} 
                            alt={elder.name} 
                            className="w-full h-48 object-cover object-top" 
                          />
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-slate-900">{displayName}</h3>
                            <p className="text-church-700 font-medium">{elder.role}</p>
                            {elder.period && (
                                <p className="text-xs text-slate-500 mt-1 font-medium">Ordained: {elder.period}</p>
                            )}
                            {elder.description && (
                              <p className="text-sm text-slate-500 mt-2 line-clamp-3">{elder.description}</p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleMoveStaff(elder.id!, 'up', churchElders, setChurchElders)}
                                disabled={index === 0 || loadingElders}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                                title="Move Up"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button 
                                onClick={() => handleMoveStaff(elder.id!, 'down', churchElders, setChurchElders)}
                                disabled={index === churchElders.length - 1 || loadingElders}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                                title="Move Down"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button 
                                onClick={() => { setEditingElder(elder); setIsElderModalOpen(true); }}
                                className="p-1.5 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition"
                                title="Edit Elder"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(elder.id || '')}
                                className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition"
                                title="Delete Elder"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          )}
                        </Card>
                      );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No elders listed. {isAdmin && "Use the 'Seed Elders Data' button to populate."}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-center text-church-900 mb-2">{t.home.weeklyProgramme}</h2>
            <p className="text-center text-slate-500 font-medium -mt-1 mb-10">{weekRange}</p>

            {loadingDuties ? <div className="text-center"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
            : weeklyDuties && (
                <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider border-b pb-2 mb-2">{weeklyDuties.month} Thla Thawhlawm Chiartu</h3>
                            <ul className="space-y-1 text-slate-700 text-sm list-disc list-inside">{weeklyDuties.thawhlawmChiartute.map((n,i) => <li key={i}>{n}</li>)}</ul>
                        </div>
                         <div>
                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider border-b pb-2 mb-2">{weeklyDuties.month} Thla Buhfaitham Hralhtu</h3>
                            <ul className="space-y-1 text-slate-700 text-sm list-disc list-inside">{weeklyDuties.buhfaithamHralhtute.map((n,i) => <li key={i}>{n}</li>)}</ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider border-b pb-2 mb-2">{weeklyDuties.month} Thla Usher</h3>
                            <ul className="space-y-1 text-slate-700 text-sm list-disc list-inside">{weeklyDuties.ushers.map((n,i) => <li key={i}>{n}</li>)}</ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold text-center text-slate-800 uppercase tracking-wider mb-4">{weeklyDuties.weekRange} Kohhran Hun Ruatna</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Zai Hruaitu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.zaiHruaitu}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Piano Tumtu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.pianoTumtu}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Hla Hriltu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.hlaHriltu}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Light & Sound</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.lightAndSoundDuty}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Pangpar Khawitu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.pangparKhawitu}</p></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      <StatsCounter />
      
      {/* Elder Edit/Add Modal */}
      {isElderModalOpen && editingElder && (
        <StaffEditModal // FIX: Use generic StaffEditModal
          staff={editingElder}
          onClose={() => { setIsElderModalOpen(false); setEditingElder(null); }}
          onSave={(staff, collection) => handleSaveStaff(staff, collection)}
          onDelete={(id, collection) => handleDeleteStaff(id, collection)}
          isLoading={loadingElders}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          collectionName="elders" // Specify collection for elders
        />
      )}

      {/* Pastor Edit/Add Modal */}
      {isPastorModalOpen && editingPastor && (
        <StaffEditModal // FIX: Use generic StaffEditModal
          staff={editingPastor}
          onClose={() => { setIsPastorModalOpen(false); setEditingPastor(null); }}
          onSave={(staff, collection) => handleSaveStaff(staff, collection)}
          onDelete={(id, collection) => handleDeleteStaff(id, collection)}
          isLoading={loadingPastors}
          showDeleteConfirm={showDeletePastorConfirm}
          setShowDeleteConfirm={setShowDeletePastorConfirm}
          collectionName="pastors" // Specify collection for pastors
        />
      )}

      {/* New: Pro Pastor Edit/Add Modal */}
      {isProPastorModalOpen && editingProPastor && (
        <StaffEditModal
          staff={editingProPastor}
          onClose={() => { setIsProPastorModalOpen(false); setEditingProPastor(null); }}
          onSave={(staff, collection) => handleSaveStaff(staff, collection)}
          onDelete={(id, collection) => handleDeleteStaff(id, collection)}
          isLoading={loadingProPastors}
          showDeleteConfirm={showDeleteProPastorConfirm}
          setShowDeleteConfirm={setShowDeleteProPastorConfirm}
          collectionName="proPastors" // Specify collection for pro pastors
        />
      )}
    </div>
  );
};
