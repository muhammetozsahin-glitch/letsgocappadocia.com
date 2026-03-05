import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
      <div className="p-6 bg-primary/10 rounded-full">
        <MapPin className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">Lost in the Valleys?</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        It seems the destination you are looking for has vanished like morning mist in Göreme. Let's get you back on track.
      </p>
      <Button asChild size="lg" className="rounded-full">
        <Link to="/">Back to Base Camp</Link>
      </Button>
    </div>
  );
}
