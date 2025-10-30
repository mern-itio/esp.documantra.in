
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/common/ScrollToTop';

const PublicSignerLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <ScrollToTop />
      <Outlet /> {/* Renders the PublicSignerPage or any nested children */}
    </div>
  );
};

export default PublicSignerLayout;
