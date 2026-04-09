'use client';
import { Map, Marker } from 'pigeon-maps';
import { useEffect, useState } from 'react';

interface UserLocationViewerProps {
  position: { lat: number; lng: number };
  className?: string;
}

export const UserLocationViewer: React.FC<UserLocationViewerProps> = ({ position, className }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true) }, []);

  if (!isClient) {
    return <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div>
  }

  return (
    <div className={className}>
      <Map
        center={[position.lat, position.lng]}
        defaultZoom={15}
        mouseEvents={false}
        touchEvents={false}
      >
        <Marker
          width={40}
          anchor={[position.lat, position.lng]}
          color="#EF4444" // red
        />
      </Map>
    </div>
  );
};
