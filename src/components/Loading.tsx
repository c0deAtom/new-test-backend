// components/Loading.tsx
'use client'
import React from 'react';
// import NavigationMenuDemo from './Navbar'; // Remove Navbar import/rendering

const Loading = () => {
  return (
    // Removed outer divs with background color and Navbar
    <div className="flex items-center justify-center min-h-screen"> 
      <div className="flex flex-col items-center">
        {/* Removed SVG spinner */}
        <p className="text-lg">Loading...</p> {/* Simplified loading indicator */}
      </div>
    </div>
  );
};

export default Loading;
