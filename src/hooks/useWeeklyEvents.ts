import { useState, useCallback, useEffect } from 'react';
import { db } from '../services/firebase';
import { Event } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const getDatesForWeek = () => {
  const now = new Date();
  const day = now.getDay(); 
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  let diffToMonday;
  
  if (day === 0) { // Sunday
    if (hour > 19 || (hour === 19 && minute >= 30)) {
      diffToMonday = 1; // Transition to next week after 7:30 PM Sunday
    } else {
      diffToMonday = -6; // Previous Monday
    }
  } else {
    diffToMonday = 1 - day; 
  }
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates; 
};

export const formatDateForInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const MIZO_DAYS_FULL = [
    'Pathianni',
    'Thawhṭanni',
    'Thawhlehni',
    'Nilaini',
    'Ningani',
    'Zirtawpni',
    'Inrinni'
];

export const MIZO_DAYS_SHORT = [
    'Pathianni',
    'Thawhṭan',
    'Thawhleh',
    'Nilai',
    'Ningani',
    'Zirtawp',
    'Inrinni'
];

export const getMizoDayName = (dateOrStrOrIndex: Date | string | number, short = false): string => {
    let dayIdx = 0;
    if (typeof dateOrStrOrIndex === 'number') {
        dayIdx = dateOrStrOrIndex;
    } else if (typeof dateOrStrOrIndex === 'string') {
        dayIdx = parseLocalDate(dateOrStrOrIndex).getDay();
    } else if (dateOrStrOrIndex instanceof Date) {
        dayIdx = dateOrStrOrIndex.getDay();
    }
    const arr = short ? MIZO_DAYS_SHORT : MIZO_DAYS_FULL;
    return arr[((dayIdx % 7) + 7) % 7];
};

export const isSeptemberDate = (dateOrStr: Date | string) => {
    const d = typeof dateOrStr === 'string' ? parseLocalDate(dateOrStr) : dateOrStr;
    return d.getMonth() === 8; // September is month 8 (0-indexed)
};

export const normalizeTitle = (title: string) => {
    return title.toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
};

export const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3].toUpperCase();

    if (hours === 12) {
        hours = modifier === 'AM' ? 0 : 12;
    } else if (modifier === 'PM') {
        hours += 12;
    }
    
    return hours * 60 + minutes;
};

// Generates the standard template for September Beihrual for a specific day
export const getSeptemberDayTemplates = (date: Date, language: 'en' | 'mizo' = 'mizo') => {
    const dayOfWeek = date.getDay();
    const templates: { name: string; time: string; dayOfWeek: number; isBeihrual: boolean }[] = [];

    if (dayOfWeek === 0) {
        // Sunday: Regular services as before (Sunday School, Chawhnu Inkhawm, Zan Inkhawm)
        templates.push({ name: 'Sunday School', time: '10:30 AM', dayOfWeek: 0, isBeihrual: false });
        templates.push({ name: 'Chawhnu Inkhawm', time: '01:30 PM', dayOfWeek: 0, isBeihrual: false });
        templates.push({ name: 'Zan Inkhawm', time: '07:00 PM', dayOfWeek: 0, isBeihrual: false });
    } else if (dayOfWeek === 1) {
        templates.push({ name: 'Thawhṭan Zan Beihrual', time: '07:00 PM', dayOfWeek: 1, isBeihrual: true });
    } else if (dayOfWeek === 2) {
        templates.push({ name: 'Thawhleh Zan Beihrual', time: '07:00 PM', dayOfWeek: 2, isBeihrual: true });
    } else if (dayOfWeek === 3) {
        templates.push({ name: 'Nilai Zan Beihrual', time: '07:00 PM', dayOfWeek: 3, isBeihrual: true });
    } else if (dayOfWeek === 4) {
        templates.push({ name: 'Ningani Zan Beihrual', time: '07:00 PM', dayOfWeek: 4, isBeihrual: true });
    } else if (dayOfWeek === 5) {
        templates.push({ name: 'Zirtawp Zan Beihrual', time: '07:00 PM', dayOfWeek: 5, isBeihrual: true });
    } else if (dayOfWeek === 6) {
        templates.push({ name: 'Inrinni Zan Beihrual', time: '07:00 PM', dayOfWeek: 6, isBeihrual: true });
    }

    return templates;
};

export const useWeeklyEvents = () => {
    const { language, t } = useLanguage();
    const [displayEvents, setDisplayEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const weekDates = getDatesForWeek();
        const virtualEvents: Event[] = [];
        const basePrograms = t.home.weeklyProgram;
        const allDaysOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday order
        
        allDaysOrder.forEach(dayIndex => {
            const dateForDay = weekDates.find(d => d.getDay() === dayIndex);
            if (!dateForDay) return;

            const dateStr = formatDateForInput(dateForDay);
            const isSept = isSeptemberDate(dateForDay);

            if (isSept) {
                // In September: Every night has Beihrual Inkhawm!
                const septTemplates = getSeptemberDayTemplates(dateForDay, language);
                septTemplates.forEach((template, tIdx) => {
                    virtualEvents.push({
                        id: `virtual_${template.name}_${dateStr}_${tIdx}`,
                        title: template.name,
                        date: dateStr,
                        time: template.time,
                        location: 'Biak In',
                        description: '',
                        type: 'Service',
                        isRecurringTemplate: true,
                        isBeihrual: template.isBeihrual,
                        dayOfWeek: dayIndex,
                        program: {}
                    });
                });
            } else {
                // Regular months: standard weekly program
                const dailyTemplates = basePrograms.filter((p: any) => p.dayOfWeek === dayIndex);
                dailyTemplates.forEach((template: any, tIdx: number) => {
                    virtualEvents.push({
                        id: `virtual_${template.name}_${dateStr}_${tIdx}`,
                        title: template.name,
                        date: dateStr,
                        time: template.time,
                        location: 'Biak In',
                        description: '',
                        type: 'Service',
                        isRecurringTemplate: true,
                        isBeihrual: false,
                        dayOfWeek: dayIndex,
                        program: {}
                    });
                });
            }
        });

        let realEvents: Event[] = [];
        try {
          if (db && db.collection) {
            const snapshot = await db.collection('events')
                .where('date', '>=', formatDateForInput(weekDates[0]))
                .where('date', '<=', formatDateForInput(weekDates[6]))
                .get();
            if (!snapshot.empty) {
                realEvents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Event[];
            }
          }
        } catch (e) {
          console.error("Fetch DB error:", e);
        }
        
        const mergedEventsMap = new Map<string, Event[]>();
        weekDates.forEach(d => mergedEventsMap.set(formatDateForInput(d), []));

        virtualEvents.forEach(event => {
            const list = mergedEventsMap.get(event.date) || [];
            list.push(event);
            mergedEventsMap.set(event.date, list);
        });
        
        realEvents.forEach(event => {
            const key = event.date;
            let list = mergedEventsMap.get(key) || [];
            const normReal = normalizeTitle(event.title);

            const isSunday = parseLocalDate(event.date).getDay() === 0;
            if (event.isCancelled) {
                list = list.filter(item => normalizeTitle(item.title) !== normReal);
            } else {
                const existingIdx = list.findIndex(item => normalizeTitle(item.title) === normReal);
                if (existingIdx !== -1) {
                    list[existingIdx] = {
                        ...list[existingIdx],
                        ...event,
                        isBeihrual: event.isBeihrual ?? (!isSunday && isSeptemberDate(event.date) && event.time.includes('PM') && (timeToMinutes(event.time) >= 18 * 60 || event.title.toLowerCase().includes('beihrual')))
                    };
                } else {
                    list.push({
                        ...event,
                        isBeihrual: event.isBeihrual ?? (!isSunday && isSeptemberDate(event.date) && event.time.includes('PM') && (timeToMinutes(event.time) >= 18 * 60 || event.title.toLowerCase().includes('beihrual')))
                    });
                }
            }
            mergedEventsMap.set(key, list);
        });

        const finalEvents = Array.from(mergedEventsMap.values()).flat();
        finalEvents.sort((a, b) => {
            const dateDiff = a.date.localeCompare(b.date);
            if (dateDiff !== 0) return dateDiff;
            return timeToMinutes(a.time) - timeToMinutes(b.time);
        });

        setDisplayEvents(finalEvents);
        setLoading(false);
    }, [t.home.weeklyProgram, language]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { displayEvents, loading, fetchEvents };
};

// Hook for fetching all 30 days of September Beihrual
export const useSeptemberBeihrual = (yearParam?: number) => {
    const { language } = useLanguage();
    const currentYear = yearParam || new Date().getFullYear();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSeptemberMonth = useCallback(async () => {
        setLoading(true);
        const allSeptEvents: Event[] = [];
        
        // 30 days in September
        for (let day = 1; day <= 30; day++) {
            const date = new Date(currentYear, 8, day); // Month 8 is September
            const dateStr = formatDateForInput(date);
            const templates = getSeptemberDayTemplates(date, language);
            
            templates.forEach((t, idx) => {
                allSeptEvents.push({
                    id: `virtual_sept_${day}_${idx}`,
                    title: t.name,
                    date: dateStr,
                    time: t.time,
                    location: 'Biak In',
                    type: 'Service',
                    isRecurringTemplate: true,
                    isBeihrual: t.isBeihrual,
                    dayOfWeek: t.dayOfWeek,
                    program: { hruaitu: '', tantu: '', thuhriltu: '', thupui: '' }
                });
            });
        }

        let realEvents: Event[] = [];
        try {
            if (db && db.collection) {
                const startDateStr = `${currentYear}-09-01`;
                const endDateStr = `${currentYear}-09-30`;
                const snap = await db.collection('events')
                    .where('date', '>=', startDateStr)
                    .where('date', '<=', endDateStr)
                    .get();
                if (!snap.empty) {
                    realEvents = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Event[];
                }
            }
        } catch (e) {
            console.error("Error fetching September events:", e);
        }

        const eventsMap = new Map<string, Event[]>();
        for (let day = 1; day <= 30; day++) {
            const dateStr = `${currentYear}-09-${String(day).padStart(2, '0')}`;
            eventsMap.set(dateStr, []);
        }

        allSeptEvents.forEach(ev => {
            const list = eventsMap.get(ev.date) || [];
            list.push(ev);
            eventsMap.set(ev.date, list);
        });

        realEvents.forEach(ev => {
            const list = eventsMap.get(ev.date) || [];
            const normTitle = normalizeTitle(ev.title);
            const isSunday = parseLocalDate(ev.date).getDay() === 0;
            if (ev.isCancelled) {
                const filtered = list.filter(item => normalizeTitle(item.title) !== normTitle);
                eventsMap.set(ev.date, filtered);
            } else {
                const idx = list.findIndex(item => normalizeTitle(item.title) === normTitle);
                if (idx !== -1) {
                    list[idx] = {
                        ...list[idx],
                        ...ev,
                        isBeihrual: ev.isBeihrual ?? (!isSunday && ev.time.includes('PM') && (timeToMinutes(ev.time) >= 18 * 60 || ev.title.toLowerCase().includes('beihrual')))
                    };
                } else {
                    list.push({
                        ...ev,
                        isBeihrual: ev.isBeihrual ?? (!isSunday && ev.time.includes('PM') && (timeToMinutes(ev.time) >= 18 * 60 || ev.title.toLowerCase().includes('beihrual')))
                    });
                }
                eventsMap.set(ev.date, list);
            }
        });

        const mergedList = Array.from(eventsMap.values()).flat();
        mergedList.sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            if (d !== 0) return d;
            return timeToMinutes(a.time) - timeToMinutes(b.time);
        });

        setEvents(mergedList);
        setLoading(false);
    }, [currentYear, language]);

    useEffect(() => {
        fetchSeptemberMonth();
    }, [fetchSeptemberMonth]);

    return { events, loading, fetchSeptemberMonth };
};

