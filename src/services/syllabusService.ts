import { db, handleFirestoreError, OperationType } from './firebase';
import { beginnerSyllabus } from '../constants/beginnerSyllabus';
import { 
  primarySyllabus, 
  intermediateSyllabus, 
  seniorSyllabus, 
  sacramentSyllabus, 
  juniorSyllabus 
} from '../constants/sundaySchoolSyllabus';

export const seedSyllabus = async () => {
  try {
    const batch = db.batch();
    const syllabusRef = db.collection('sundaySchoolSyllabus');
    
    const allSyllabuses = [
      { id: 'beginner', data: beginnerSyllabus },
      { id: 'primary', data: primarySyllabus },
      { id: 'intermediate', data: intermediateSyllabus },
      { id: 'senior', data: seniorSyllabus },
      { id: 'sacrament', data: sacramentSyllabus },
      { id: 'junior', data: juniorSyllabus }
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
    
    await batch.commit();
    console.log('Syllabus seeded successfully');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sundaySchoolSyllabus');
  }
};

export const getNextSundayLesson = async (departmentId: string) => {
  try {
    const today = new Date();
    // Find next Sunday
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
    
    const dateStr = nextSunday.toISOString().split('T')[0];
    
    // Try composite ID first
    const docId = `${departmentId}_${dateStr}`;
    const doc = await db.collection('sundaySchoolSyllabus').doc(docId).get();
    
    if (doc.exists) {
      return doc.data();
    }

    // Fallback to legacy date-only ID (for backward compatibility if needed)
    const legacyDoc = await db.collection('sundaySchoolSyllabus').doc(dateStr).get();
    if (legacyDoc.exists) {
      const data = legacyDoc.data();
      if (data?.department === departmentId) {
          return data;
      }
    }
    
    // Fallback to local constants
    const syllabuses: Record<string, any[]> = {
      beginner: beginnerSyllabus,
      primary: primarySyllabus,
      intermediate: intermediateSyllabus,
      senior: seniorSyllabus,
      sacrament: sacramentSyllabus,
      junior: juniorSyllabus
    };

    if (syllabuses[departmentId]) {
      return syllabuses[departmentId].find(item => item.date === dateStr);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching next Sunday lesson:', error);
    return null;
  }
};
