import { db, handleFirestoreError, OperationType } from './firebase';
import { beginnerSyllabus } from '../constants/beginnerSyllabus';

export const seedSyllabus = async () => {
  try {
    const batch = db.batch();
    const syllabusRef = db.collection('sundaySchoolSyllabus');
    
    // Clear existing or just add
    // For simplicity, we'll just set them by date as ID
    beginnerSyllabus.forEach((item) => {
      const docRef = syllabusRef.doc(item.date);
      batch.set(docRef, {
        ...item,
        department: 'beginner' // Currently we only have beginner syllabus
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
    if (today.getDay() === 0) {
        // If today is Sunday, we might want today's lesson or next Sunday's.
        // Usually, people want today's lesson on Sunday.
    } else {
        // nextSunday is already set correctly for non-Sundays
    }
    
    const dateStr = nextSunday.toISOString().split('T')[0];
    
    const doc = await db.collection('sundaySchoolSyllabus').doc(dateStr).get();
    if (doc.exists) {
      const data = doc.data();
      if (data?.department === departmentId || departmentId === 'beginner') {
          return data;
      }
    }
    
    // Fallback to local constant if firestore fails or is empty
    if (departmentId === 'beginner') {
        return beginnerSyllabus.find(item => item.date === dateStr);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching next Sunday lesson:', error);
    return null;
  }
};
