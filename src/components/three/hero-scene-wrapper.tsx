'use client';

import dynamic from 'next/dynamic';

const HeroScene = dynamic(() => import('./hero-scene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 to-transparent" />
  ),
});

export function HeroSceneWrapper() {
  return <HeroScene />;
}

export default HeroSceneWrapper;
