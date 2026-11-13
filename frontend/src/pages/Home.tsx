import React from 'react';
import { HomeHero } from '../components/home/HomeHero';
import { ProductIntro } from '../components/home/ProductIntro';
import { FeatureOverview } from '../components/home/FeatureOverview';
import { HomeCTA } from '../components/home/HomeCTA';

interface HomeProps {
  onOpenDemo?: () => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenDemo }) => {
  return (
    <div className="space-y-0">
      <HomeHero onOpenDemo={onOpenDemo} />
      <ProductIntro />
      <FeatureOverview />
      <HomeCTA />
    </div>
  );
};

export default Home;
