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

export const useWeeklyEvents = () => {
    const { t } = useLanguage();
    const [displayEvents, setDisplayEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const weekDates = getDatesForWeek();
        const virtualEvents: Event[] = [];
        const basePrograms = t.home.weeklyProgram;
        const dayOrder = [1, 2, 3, 4, 6, 0]; // Monday to Sunday order, skipped Friday (5)
        
        dayOrder.forEach(dayIndex => {
            const dateForDay = weekDates.find(d => d.getDay() === dayIndex);
            if (!dateForDay) return;

            const dateStr = formatDateForInput(dateForDay);
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
                    dayOfWeek: dayIndex,
                    program: {}
                });
            });
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

            if (event.isCancelled) {
                list = list.filter(item => normalizeTitle(item.title) !== normReal);
            } else {
                const existingIdx = list.findIndex(item => normalizeTitle(item.title) === normReal);
                if (existingIdx !== -1) {
                    list[existingIdx] = event;
                } else {
                    list.push(event);
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
    }, [t.home.weeklyProgram]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { displayEvents, loading, fetchEvents };
};
