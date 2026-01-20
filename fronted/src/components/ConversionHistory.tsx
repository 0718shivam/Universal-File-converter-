import { useState, useEffect } from 'react';
import { conversionHistory, type ConversionHistoryItem } from '../utils/conversionHistory';
import './ConversionHistory.css';

interface ConversionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConversionHistory = ({ isOpen, onClose }: ConversionHistoryProps) => {
  const [historyItems, setHistoryItems] = useState<ConversionHistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistoryItems(conversionHistory.getAll());
    }
  }, [isOpen]);

  const handleDownload = (item: ConversionHistoryItem) => {
    if (item.fileData) {
      const link = document.createElement('a');
      link.href = item.fileData;
      link.download = `${item.filename.split('.')[0]}.${item.targetFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (id: string) => {
    conversionHistory.remove(id);
    setHistoryItems(conversionHistory.getAll());
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      conversionHistory.clear();
      setHistoryItems([]);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>Conversion History</h2>
          <button className="history-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="history-content">
          {historyItems.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📂</div>
              <p>No conversion history yet</p>
              <span>Your converted files will appear here</span>
            </div>
          ) : (
            <>
              <div className="history-actions">
                <span className="history-count">{historyItems.length} items</span>
                <button className="history-clear-btn" onClick={handleClearAll}>
                  Clear All
                </button>
              </div>

              <div className="history-list">
                {historyItems.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-icon">
                      {item.targetFormat === 'pdf' ? '📄' : 
                       item.targetFormat === 'docx' ? '📝' : 
                       item.targetFormat === 'txt' ? '📃' : '🖼️'}
                    </div>

                    <div className="history-item-info">
                      <div className="history-item-name">{item.filename}</div>
                      <div className="history-item-meta">
                        <span className="history-conversion">
                          {item.originalFormat.toUpperCase()} → {item.targetFormat.toUpperCase()}
                        </span>
                        <span className="history-size">{formatFileSize(item.size)}</span>
                        <span className="history-time">{formatDate(item.timestamp)}</span>
                      </div>
                    </div>

                    <div className="history-item-actions">
                      {item.fileData && (
                        <button
                          className="history-download-btn"
                          onClick={() => handleDownload(item)}
                          title="Download"
                        >
                          ⬇️
                        </button>
                      )}
                      <button
                        className="history-delete-btn"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversionHistory;
