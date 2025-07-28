// Helper function to safely format dates
export function formatDate(date: any, locale: string = 'ja-JP'): string {
  if (!date) return '';
  
  try {
    // If it's already a Date object, use it directly
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString(locale);
    }
    
    // If it's a string, try to parse it
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString(locale);
      }
    }
    
    // Try to handle objects that might have date values
    if (typeof date === 'object' && date !== null) {
      // Check if it has a valueOf method that returns a number (timestamp)
      if (typeof date.valueOf === 'function') {
        const timestamp = date.valueOf();
        if (typeof timestamp === 'number' && !isNaN(timestamp)) {
          return new Date(timestamp).toLocaleDateString(locale);
        }
      }
      
      // Check if it has a toString method that gives us a date string
      if (typeof date.toString === 'function') {
        const dateString = date.toString();
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString(locale);
        }
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

// Helper function to safely create Date objects
export function parseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  
  try {
    if (date instanceof Date) {
      return date;
    }
    
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}