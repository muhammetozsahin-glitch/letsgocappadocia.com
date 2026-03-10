import React from 'react';
import { Link } from 'react-router-dom';
import { TourCard } from '../tours/TourCard';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

// This is a placeholder component for featured tours.
// It assumes a list of tour objects is available or passed via props.
export const FeaturedTours = () => {
  // Mock data structure - in a real app this would come from an API/hook
  const featuredTours = [
    {
      id: '1',
      title: 'Cappadocia Sunrise Balloon Flight',
      slug: 'cappadocia-balloon-flight',
      description: 'Experience the magic of Cappadocia from the skies at sunrise.',
      price: 250,
      image: '/images/tours/balloon.jpg',
      duration: '1.5 hours',
    },
    {
      id: '2',
      title: 'Red Valley Sunset Hike',
      slug: 'red-valley-hike',
      description: 'Stunning views of the Red Valley at golden hour.',
      price: 50,
      image: '/images/tours/hike.jpg',
      duration: '3 hours',
    },
  ];

  return (
    <section className="py-12 px-4 md:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Featured Tours</h2>
          <Button variant="ghost" asChild>
            <Link to="/turlar" className="flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour as any} />
          ))}
        </div>
      </div>
    </section>
  );
};
