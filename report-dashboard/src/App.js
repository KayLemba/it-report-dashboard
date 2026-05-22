import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar       from './components/dashboard/Sidebar';
import DashboardPage from './pages/DashboardPage';
import TicketsPage   from './pages/TicketsPage';
import TrendsPage    from './pages/TrendsPage';
import AssigneesPage from './pages/AssigneesPage';
import SLAPage       from './pages/SLAPage';
import GeneratePage  from './pages/GeneratePage';
import UploadPage    from './pages/UploadPage';
import SettingsPage  from './pages/SettingsPage';

function App() {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ flex:1, overflowX:'hidden', minWidth:0 }}>
        <Routes>
          <Route path="/"          element={<DashboardPage />} />
          <Route path="/tickets"   element={<TicketsPage />} />
          <Route path="/trends"    element={<TrendsPage />} />
          <Route path="/assignees" element={<AssigneesPage />} />
          <Route path="/sla"       element={<SLAPage />} />
          <Route path="/generate"  element={<GeneratePage />} />
          <Route path="/upload"    element={<UploadPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
