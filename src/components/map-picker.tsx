'use client';
import { useState, useEffect } from 'react';
import { Map, Marker } from 'pigeon-maps';

interface MapPickerProps {
  onPositionChange: (position: { lat: number; lng: number }) => void;
  initialPosition?: { lat: number; lng: number };
}

export const MapPicker: React.FC<MapPickerProps> = ({ onPositionChange, initialPosition }) => {
  const [center, setCenter] = useState<[number, number]>(
    initialPosition ? [initialPosition.lat, initialPosition.lng] : [15.3694, 44.1910]
  );
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(center);
  const [zoom, setZoom] = useState(13);

  // When initialPosition prop changes (e.g. editing an existing store)
  useEffect(() => {
    if (initialPosition) {
      const newPos: [number, number] = [initialPosition.lat, initialPosition.lng];
      setCenter(newPos);
      setMarkerPosition(newPos);
      setZoom(15);
    }
  }, [initialPosition]);

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    setMarkerPosition(latLng);
    onPositionChange({ lat: latLng[0], lng: latLng[1] });
  };
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
      setIsClient(true);
  }, []);

  if (!isClient) {
      return <div className="h-[350px] w-full bg-muted rounded-lg flex items-center justify-center"><p>جارٍ تحميل الخريطة...</p></div>
  }

  return (
    <div className="h-[350px] w-full rounded-lg overflow-hidden border">
        <Map
            center={center}
            zoom={zoom}
            onClick={handleMapClick}
            onBoundsChanged={({ center, zoom }) => { 
                setCenter(center) 
                setZoom(zoom) 
            }}
        >
            <Marker 
                width={40} 
                anchor={markerPosition} 
                color="#1FAF9A"
            />
        </Map>
    </div>
  );
};
