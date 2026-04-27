'use client';

import React from 'react';
import LandingLayout from '@/components/landing/LandingLayout';
import Features from '@/components/landing/Features';

export default function FeaturesPage() {
  return (
    <LandingLayout>
      {/* Passing false to show inner navbar is not needed since LandingLayout handles it, 
          but Features.tsx currently has its own LandingNavbar. 
          I should probably clean up the individual components to not include Navbar. */}
      <Features />
    </LandingLayout>
  );
}
