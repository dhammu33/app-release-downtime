import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ApplicationManagement from './pages/ApplicationManagement';
import DowntimeManagement from './pages/DowntimeManagement';
import ReleaseManagement from './pages/ReleaseManagement';
import ReleaseDetail from './pages/ReleaseDetail';
import { DataProvider } from './context/DataContext';

const App: React.FC = () => {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="release/:id" element={<ReleaseDetail />} />
            <Route path="admin/application" element={<ApplicationManagement />} />
            <Route path="admin/downtime" element={<DowntimeManagement />} />
            <Route path="admin/release" element={<ReleaseManagement />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
};

export default App;
