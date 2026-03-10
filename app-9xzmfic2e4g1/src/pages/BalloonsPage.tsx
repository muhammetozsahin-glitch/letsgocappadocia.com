import React from 'react';
import { BalloonCard } from '@/components/balloons/BalloonCard';

const balloons = [
  { id: '1', name: 'Sunrise Balloon', price: 150, description: 'Experience Cappadocia at sunrise.' },
  { id: '2', name: 'Private Sunset', price: 250, description: 'Exclusive sunset flight.' },
];

export const BalloonsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Balloon Tours</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {balloons.map(balloon => (
          <BalloonCard key={balloon.id} {...balloon} />
        ))}
      </div>
    </div>
  );
};

export default BalloonsPage;
