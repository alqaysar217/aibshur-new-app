'use client';
import { Map, Marker, Overlay } from 'pigeon-maps';
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
      // A reasonable zoom level to see both points, user can adjust
      return { center, zoom: 12 };
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
      >
        {secondaryPosition && (
          <Overlay>
            {({ mapState, latLngToPixel }) => {
              const mainPixel = latLngToPixel([mainPosition.lat, mainPosition.lng]);
              const secondaryPixel = latLngToPixel([secondaryPosition.lat, secondaryPosition.lng]);
              return (
                <svg
                  width={mapState.width}
                  height={mapState.height}
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                >
                  <line
                    x1={mainPixel[0]}
                    y1={mainPixel[1]}
                    x2={secondaryPixel[0]}
                    y2={secondaryPixel[1]}
                    stroke="#1FAF9A"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </svg>
              );
            }}
          </Overlay>
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
