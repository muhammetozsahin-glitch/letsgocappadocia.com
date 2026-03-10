import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BalloonProps {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const BalloonCard: React.FC<BalloonProps> = ({ name, price, description }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">${price}</span>
          <Button>Book Now</Button>
        </div>
      </CardContent>
    </Card>
  );
};
