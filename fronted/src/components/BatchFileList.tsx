import './BatchFileList.css';

export interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  error?: string;
  downloadUrl?: string;
}

interface BatchFileListProps {
  files: BatchFile[];
  onRemove?: (id: string) => void;
  onDownload?: (id: string) => void;
}

const BatchFileList = ({ files, onRemove, onDownload }: BatchFileListProps) => {
  const getStatusIcon = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'converting':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  const getStatusText = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'converting':
        return 'Converting...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="batch-file-list">
      <div className="batch-file-header">
        <h3>Files ({files.length}/5)</h3>
        {files.length >= 5 && (
          <span className="batch-limit-warning">Maximum limit reached</span>
        )}
      </div>
      
      <div className="batch-files">
        {files.map((batchFile) => (
          <div key={batchFile.id} className={`batch-file-item batch-file-${batchFile.status}`}>
            <div className="batch-file-icon">
              {getStatusIcon(batchFile.status)}
            </div>
            
            <div className="batch-file-info">
              <div className="batch-file-name">{batchFile.file.name}</div>
              <div className="batch-file-meta">
                <span className="batch-file-size">{formatFileSize(batchFile.file.size)}</span>
                <span className="batch-file-status">{getStatusText(batchFile.status)}</span>
              </div>
              
              {batchFile.status === 'converting' && (
                <div className="batch-file-progress">
                  <div 
                    className="batch-file-progress-bar"
                    style={{ width: `${batchFile.progress}%` }}
                  />
                </div>
              )}
              
              {batchFile.error && (
                <div className="batch-file-error">{batchFile.error}</div>
              )}
            </div>
            
            <div className="batch-file-actions">
              {batchFile.status === 'completed' && onDownload && (
                <button
                  className="batch-action-btn batch-download-btn"
                  onClick={() => onDownload(batchFile.id)}
                  title="Download"
                >
                  ⬇️
                </button>
              )}
              
              {(batchFile.status === 'pending' || batchFile.status === 'error') && onRemove && (
                <button
                  className="batch-action-btn batch-remove-btn"
                  onClick={() => onRemove(batchFile.id)}
                  title="Remove"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchFileList;
