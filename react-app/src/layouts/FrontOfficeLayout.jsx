import React from 'react';
import FrontOfficeNavbar from '../components/layout/FrontOfficeNavbar';
import '../styles/FrontOffice.css';

const FrontOfficeLayout = ({ children }) => {
  return (
    <div className="frontoffice-layout">
      <FrontOfficeNavbar />
      <main className="frontoffice-content">
        {children}
      </main>
    </div>
  );
};

export default FrontOfficeLayout;
