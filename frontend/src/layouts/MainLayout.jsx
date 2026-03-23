/**
 * Ojasvita - Main Layout Component
 * 
 * This is the main layout component that wraps all protected pages.
 * It includes the navigation sidebar and top navigation bar.
 * 
 * Layout Structure:
 * - Sidebar (left): Navigation menu
 * - Main content (right): Page content
 * 
 * Dependencies:
 * - react-router-dom: For navigation
 * - Outlet: Render child routes
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

/**
 * MainLayout Component
 * 
 * Provides the main application layout with sidebar and content area.
 */
const MainLayout = () => {
  // State for sidebar visibility on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Get current location for active link highlighting
  const location = useLocation();

  /**
   * Toggle sidebar on mobile
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * Close sidebar on mobile
   */
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        currentPath={location.pathname}
      />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top navigation bar */}
        <Navbar 
          onMenuClick={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {/* Render child routes */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
