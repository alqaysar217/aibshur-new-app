'use client';
import { useState, useEffect } from 'react';
import { Map, Marker } from 'pigeon-maps';

interface MapPickerProps {
  onPositionChange: (position: { lat: number; lng: number }) => void;
  initialPosition?: { lat: number; lng: number };
}

// Mukalla coordinates
const MUKALLA_COORDS: [number, number] = [14.5424, 49.1333];

export const MapPicker: React.FC<MapPickerProps> = ({ onPositionChange, initialPosition }) => {
  // The position of the marker. This is the source of truth for the selected location.
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(
    initialPosition && initialPosition.lat && initialPosition.lng 
      ? [initialPosition.lat, initialPosition.lng] 
      : MUKALLA_COORDS
  );

  // The center of the map view. We initialize it to the marker's position.
  const [viewCenter, setViewCenter] = useState<[number, number]>(markerPosition);
  const [zoom, setZoom] = useState(13);

  // If the initialPosition prop changes from the parent, reset the component's state.
  useEffect(() => {
    const newPos: [number, number] = 
      initialPosition && initialPosition.lat && initialPosition.lng
        ? [initialPosition.lat, initialPosition.lng]
        : MUKALLA_COORDS;
    
    setMarkerPosition(newPos);
    setViewCenter(newPos);
    setZoom(15);
  }, [initialPosition]);

  // When the user clicks the map...
  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    // 1. Update the marker's position.
    setMarkerPosition(latLng);
    // 2. Propagate the change to the parent form.
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
            // The center prop sets the *initial* center, but also updates if the state changes.
            center={viewCenter}
            zoom={zoom}
            // Let the user pan and zoom. `onBoundsChanged` will update our view state.
            onBoundsChanged={({ center, zoom }) => { 
                setViewCenter(center) 
                setZoom(zoom) 
            }}
            // When the map is clicked, we update the marker.
            onClick={handleMapClick}
        >
            <Marker 
                width={40} 
                anchor={markerPosition} // The marker is always at the selected position.
                color="#1FAF9A"
            />
        </Map>
    </div>
  );
};
