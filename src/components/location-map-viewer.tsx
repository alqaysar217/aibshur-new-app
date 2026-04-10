'use client';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { useEffect, useState } from 'react';
import { User, Bike, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationMapViewerProps {
  mainPosition: { lat: number; lng: number };
  secondaryPosition?: { lat: number; lng: number };
  className?: string;
}

export const LocationMapViewer: React.FC<LocationMapViewerProps> = ({ mainPosition, secondaryPosition, className }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true) }, []);
  
  const center: [number, number] = secondaryPosition
    ? [ (mainPosition.lat + secondaryPosition.lat) / 2, (mainPosition.lng + secondaryPosition.lng) / 2 ]
    : [mainPosition.lat, mainPosition.lng];
    
  const zoom = secondaryPosition ? 13 : 15;

  if (!isClient) {
    return <div className={cn("h-full w-full bg-muted rounded-lg flex items-center justify-center", className)}><p>جارٍ تحميل الخريطة...</p></div>
  }

  return (
    <div className={cn("h-48 w-full rounded-lg overflow-hidden border", className)}>
      <Map
        center={center}
        zoom={zoom}
        mouseEvents={false}
        touchEvents={false}
      >
        {secondaryPosition && (
            <Overlay
                anchor={[0,0]} // The anchor is irrelevant as we use absolute positioning for the SVG
                children={(
                    { mapState, latLngToPixel } : 
                    { mapState: any, latLngToPixel: (latLng: [number, number]) => [number, number] }
                ) => {
                    if (!mapState.width || !mapState.height) return null;
                    const mainPixel = latLngToPixel([mainPosition.lat, mainPosition.lng]);
                    const secondaryPixel = latLngToPixel([secondaryPosition.lat, secondaryPosition.lng]);
                    return (
                    <svg
                        width={mapState.width}
                        height={mapState.height}
                        style={{ position: 'absolute', top: -mapState.top, left: -mapState.left, pointerEvents: 'none' }}
                    >
                        <line
                            x1={mainPixel[0]} y1={mainPixel[1]}
                            x2={secondaryPixel[0]} y2={secondaryPixel[1]}
                            stroke="#1FAF9A" strokeWidth="2" strokeDasharray="5, 5"
                        />
                    </svg>
                    )
                }}
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
