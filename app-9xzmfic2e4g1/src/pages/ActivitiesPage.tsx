import React from 'react';
import { ActivityCard } from '@/components/activities/ActivityCard';

const activities = [
  { id: '1', name: 'ATV Safari', price: 60, description: 'Explore the valleys on an ATV.' },
  { id: '2', name: 'Horse Riding', price: 75, description: 'Guided horse tour through the fairy chimneys.' },
];

export const ActivitiesPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Adventure Activities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map(activity => (
          <ActivityCard key={activity.id} {...activity} />
        ))}
      </div>
    </div>
  );
};

export default ActivitiesPage;
