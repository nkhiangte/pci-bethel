import { db, handleFirestoreError, OperationType } from './firebase';
import { beginnerSyllabus } from '../constants/beginnerSyllabus';
import { 
  primarySyllabus, 
  intermediateSyllabus, 
  seniorSyllabus, 
  sacramentSyllabus, 
  juniorSyllabus,
  puitlingSyllabus 
} from '../constants/sundaySchoolSyllabus';
import { quarterlySyllabusData } from '../constants/quarterlySyllabus';

export const seedSyllabus = async () => {
  try {
    const batch = db.batch();
    const syllabusRef = db.collection('sundaySchoolSyllabus');
    const quarterlyRef = db.collection('sundaySchoolQuarterlySyllabus');
    
    const allSyllabuses = [
      { id: 'beginner', data: beginnerSyllabus },
      { id: 'primary', data: primarySyllabus },
      { id: 'intermediate', data: intermediateSyllabus },
      { id: 'senior', data: seniorSyllabus },
      { id: 'sacrament', data: sacramentSyllabus },
      { id: 'junior', data: juniorSyllabus },
      { id: 'puitling', data: puitlingSyllabus }
    ];

    allSyllabuses.forEach(({ id, data }) => {
      data.forEach((item) => {
        // Use composite ID to avoid overwriting between departments
        const docId = `${id}_${item.date}`;
        const docRef = syllabusRef.doc(docId);
        batch.set(docRef, {
          ...item,
          department: id
        });
      });
    });

    // Seed Quarterly Syllabus
    Object.entries(quarterlySyllabusData).forEach(([deptId, items]) => {
      const docRef = quarterlyRef.doc(deptId);
      batch.set(docRef, {
        departmentId: deptId,
        items: items
      });
    });
    
    await batch.commit();
    console.log('Syllabus seeded successfully');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sundaySchoolSyllabus or sundaySchoolQuarterlySyllabus');
  }
};

export const getNextSundayLesson = async (departmentId: string) => {
  try {
    const today = new Date();
    // Find next Sunday
    const nextSunday = new Date(today);
    // If today is Sunday, we might want today's lesson or next week's.
    // Usually, on Sunday morning, people want today's lesson.
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const daysUntilSunday = (7 - today.getDay()) % 7;
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    
    // Use local time for YYYY-MM-DD to avoid timezone shifts
    const y = nextSunday.getFullYear();
    const m = String(nextSunday.getMonth() + 1).padStart(2, '0');
    const d = String(nextSunday.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    console.log(`Fetching lesson for ${departmentId} on ${dateStr}`);

    // Try composite ID first
    const docId = `${departmentId}_${dateStr}`;
    const doc = await db.collection('sundaySchoolSyllabus').doc(docId).get();
    
    if (doc.exists) {
      console.log(`Found lesson in Firestore:`, doc.data());
      return doc.data();
    }

    // Fallback to local constants
    const syllabuses: Record<string, any[]> = {
      beginner: beginnerSyllabus,
      primary: primarySyllabus,
      intermediate: intermediateSyllabus,
      senior: seniorSyllabus,
      sacrament: sacramentSyllabus,
      junior: juniorSyllabus,
      puitling: puitlingSyllabus
    };

    if (syllabuses[departmentId]) {
      const localLesson = syllabuses[departmentId].find(item => item.date === dateStr);
      if (localLesson) {
        console.log(`Found lesson in local constants:`, localLesson);
        return localLesson;
      }
    }
    
    console.log(`No lesson found for ${departmentId} on ${dateStr}`);
    return null;
  } catch (error) {
    console.error('Error fetching next Sunday lesson:', error);
    return null;
  }
};
