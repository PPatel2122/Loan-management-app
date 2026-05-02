import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import LoanDetails from './pages/LoanDetails';
import CompletedLoans from './pages/CompletedLoans';

import Admins from './pages/Admins';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="loans" element={<Loans />} />
            <Route path="loans/:id" element={<LoanDetails />} />
            <Route path="completed-loans" element={<CompletedLoans />} />
            <Route path="admins" element={<Admins />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
