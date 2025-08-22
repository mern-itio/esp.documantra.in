
import { Outlet } from 'react-router-dom';

const PublicSignerLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <Outlet /> {/* Renders the PublicSignerPage or any nested children */}
    </div>
  );
};

export default PublicSignerLayout;
