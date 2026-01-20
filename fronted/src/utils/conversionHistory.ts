// Conversion History Management Utility

export interface ConversionHistoryItem {
  id: string;
  filename: string;
  originalFormat: string;
  targetFormat: string;
  timestamp: number;
  downloadUrl?: string;
  fileData?: string; // Base64 encoded file data
  size?: number;
}

const HISTORY_KEY = 'conversion_history';
const MAX_HISTORY_ITEMS = 20;

export const conversionHistory = {
  // Get all history items
  getAll(): ConversionHistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  },

  // Add new conversion to history
  add(item: Omit<ConversionHistoryItem, 'id' | 'timestamp'>): void {
    try {
      const history = this.getAll();
      const newItem: ConversionHistoryItem = {
        ...item,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      // Add to beginning and limit to MAX_HISTORY_ITEMS
      const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  },

  // Remove item from history
  remove(id: string): void {
    try {
      const history = this.getAll();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  },

  // Clear all history
  clear(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  // Get recent items (last N)
  getRecent(count: number = 5): ConversionHistoryItem[] {
    return this.getAll().slice(0, count);
  },
};
