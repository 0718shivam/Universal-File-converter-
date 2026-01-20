import './ProgressBar.css';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: string;
  variant?: 'purple' | 'green' | 'blue';
}

const ProgressBar = ({ progress, status, variant = 'purple' }: ProgressBarProps) => {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-wrapper">
        <div 
          className={`progress-bar-fill progress-bar-${variant}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="progress-bar-info">
        <span className="progress-percentage">{Math.round(progress)}%</span>
        {status && <span className="progress-status">{status}</span>}
      </div>
    </div>
  );
};

export default ProgressBar;
