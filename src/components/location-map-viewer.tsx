'use client';
import { Map, Marker } from 'pigeon-maps';
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
      return {
        center: [
          (mainPosition.lat + secondaryPosition.lat) / 2,
          (mainPosition.lng + secondaryPosition.lng) / 2
        ] as [number, number],
        zoom: 13,
      };
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
    // Recalculate and set map state when positions change
    const { center: newCenter, zoom: newZoom } = calculateCenterAndZoom();
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
        onClick={(e) => console.log(e)}
      >
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
