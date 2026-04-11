'use client';
import { Map, Marker, Line } from 'pigeon-maps';
import { useEffect, useState } from 'react';
import { User, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationMapViewerProps {
  mainPosition: { lat: number; lng: number };
  secondaryPosition?: { lat: number; lng: number };
  className?: string;
}

export const LocationMapViewer: React.FC<LocationMapViewerProps> = ({ mainPosition, secondaryPosition, className }) => {
  const [isClient, setIsClient] = useState(false);
  
  const calculateCenterAndZoom = () => {
    if (secondaryPosition) {
      const center: [number, number] = [
        (mainPosition.lat + secondaryPosition.lat) / 2,
        (mainPosition.lng + secondaryPosition.lng) / 2,
      ];
      
      const latDiff = Math.abs(mainPosition.lat - secondaryPosition.lat);
      const lngDiff = Math.abs(mainPosition.lng - secondaryPosition.lng);
      
      // Heuristic to determine zoom level. This can be fine-tuned.
      const maxDiff = Math.max(latDiff, lngDiff);
      let zoom = 11;
      if (maxDiff < 0.01) zoom = 15;
      else if (maxDiff < 0.05) zoom = 14;
      else if (maxDiff < 0.1) zoom = 13;
      else if (maxDiff < 0.2) zoom = 12;

      return { center, zoom };
    }
    return {
      center: [mainPosition.lat, mainPosition.lng] as [number, number],
      zoom: 15,
    };
  };

  const { center: initialCenter, zoom: initialZoom } = calculateCenterAndZoom();

  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);

  useEffect(() => {
    setIsClient(true);
    const { center: newCenter, newZoom } = calculateCenterAndZoom();
    setCenter(newCenter);
    setZoom(newZoom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainPosition.lat, mainPosition.lng, secondaryPosition?.lat, secondaryPosition?.lng]);
  

  if (!isClient) {
    return <div className={cn("h-full w-full bg-muted rounded-lg flex items-center justify-center", className)}><p>جارٍ تحميل الخريطة...</p></div>
  }

  return (
    <div className={cn("h-48 w-full rounded-lg overflow-hidden border", className)}>
      <Map
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
      >
        {secondaryPosition && (
          <Line
            points={[
              [mainPosition.lat, mainPosition.lng],
              [secondaryPosition.lat, secondaryPosition.lng],
            ]}
            color="#1FAF9A"
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}
        
        {/* Main Marker (Client/User) */}
        <Marker width={28} anchor={[mainPosition.lat, mainPosition.lng]}>
            <div className='bg-destructive rounded-full p-1.5 shadow-md'>
                <User className="h-4 w-4 text-white" />
            </div>
        </Marker>

        {/* Secondary Marker (Delegate) */}
        {secondaryPosition && (
            <Marker width={28} anchor={[secondaryPosition.lat, secondaryPosition.lng]}>
                <div className='bg-primary rounded-full p-1.5 shadow-md'>
                    <Bike className="h-4 w-4 text-white" />
                </div>
            </Marker>
        )}
      </Map>
    </div>
  );
};
