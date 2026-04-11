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
      const center: [number, number] = [
        (mainPosition.lat + secondaryPosition.lat) / 2,
        (mainPosition.lng + secondaryPosition.lng) / 2,
      ];
      
      const latDiff = Math.abs(mainPosition.lat - secondaryPosition.lat);
      const lngDiff = Math.abs(mainPosition.lng - secondaryPosition.lng);
      
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
        {/* Render prop for SVG overlay */}
        {({ width, height, latLngToPixel }) => (
          secondaryPosition && (
            <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <line
                x1={latLngToPixel([mainPosition.lat, mainPosition.lng])[0]}
                y1={latLngToPixel([mainPosition.lat, mainPosition.lng])[1]}
                x2={latLngToPixel([secondaryPosition.lat, secondaryPosition.lng])[0]}
                y2={latLngToPixel([secondaryPosition.lat, secondaryPosition.lng])[1]}
                stroke="#1FAF9A"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </svg>
          )
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
