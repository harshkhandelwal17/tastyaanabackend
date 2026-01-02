import { useEffect, useRef } from 'react';

const DirectGoogleMapsPolyline = ({ 
  map, 
  driverLocation, 
  deliveryLocation, 
  visible = true,
  color = '#FACC15',
  weight = 3,
  path = null
}) => {
  const polylineRef = useRef(null);
  const directionsRendererRef = useRef(null);
  useEffect(() => {
    if (!map || !window.google) {
      return;
    }

    // Clean up existing polylines
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    if (!visible) return;

    try {
      // If a detailed path is provided, draw it directly and skip directions
      if (Array.isArray(path) && path.length >= 2) {
        const detailedPath = path.map(p => new window.google.maps.LatLng(p.lat, p.lng));
        const polyline = new window.google.maps.Polyline({
          path: detailedPath,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.95,
          strokeWeight: weight,
          zIndex: 1000,
          icons: [{
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: color
            },
            offset: '50%',
            repeat: '100px'
          }]
        });
        polyline.setMap(map);
        polylineRef.current = polyline;
        return;
      }

      if (!driverLocation || !deliveryLocation) return;

      console.log('DirectGoogleMapsPolyline: Drawing route from', driverLocation, 'to', deliveryLocation);

      // First try to get directions
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        suppressPolylines: true // avoid flicker and style mismatch; we draw our own
      });

      directionsRenderer.setMap(map);
      directionsRendererRef.current = directionsRenderer;

      const request = {
        origin: new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng),
        destination: new window.google.maps.LatLng(deliveryLocation.lat, deliveryLocation.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result?.routes?.[0]) {
          // Draw our own styled polyline from the overview path
          const overviewPath = result.routes[0].overview_path || [];
          const detailedPath = overviewPath.map(pt => new window.google.maps.LatLng(pt.lat(), pt.lng()));
          const polyline = new window.google.maps.Polyline({
            path: detailedPath,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.95,
            strokeWeight: weight,
            zIndex: 1000,
            icons: [{
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: color
              },
              offset: '50%',
              repeat: '100px'
            }]
          });
          polyline.setMap(map);
          polylineRef.current = polyline;
          console.log('DirectGoogleMapsPolyline: Styled directions polyline displayed');
        } else {
          console.warn('DirectGoogleMapsPolyline: Directions failed; skipping direct fallback as requested');
        }
      });

      // Also draw a backup direct polyline
      const drawDirectPolyline = () => {
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }

        const path = [
          new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng),
          new window.google.maps.LatLng(deliveryLocation.lat, deliveryLocation.lng)
        ];

        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: weight,
          zIndex: 999,
          icons: [{
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: color
            },
            offset: '50%',
            repeat: '100px'
          }]
        });

        polyline.setMap(map);
        polylineRef.current = polyline;
        console.log('DirectGoogleMapsPolyline: Direct polyline displayed');
      };

    } catch (error) {
      console.error('DirectGoogleMapsPolyline: Error drawing polyline:', error);
    }

    // Cleanup function
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
    };
  }, [map, driverLocation, deliveryLocation, visible]);

  // This component doesn't render anything itself
  return null;
};

export default DirectGoogleMapsPolyline;