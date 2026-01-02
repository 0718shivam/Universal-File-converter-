import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import ImageConverter from './components/ImageConverter';
import PDFConverter from './components/PDFConverter';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<ImageConverter />} />
            <Route path="/pdf" element={<PDFConverter />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
