declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps extends React.SVGAttributes<SVGElement> {
    width?: number;
    height?: number;
    projection?: string | ((width: number, height: number, config: any) => any);
    projectionConfig?: any;
    className?: string;
  }

  export class ComposableMap extends React.Component<ComposableMapProps> {}

  export interface ZoomableGroupProps extends React.SVGAttributes<SVGGElement> {
    zoom?: number;
    center?: [number, number];
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (event: any, position: any) => void;
    onMove?: (event: any, position: any) => void;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    translateExtent?: [[number, number], [number, number]];
    filterZoomEvent?: (event: any) => boolean;
    motionStyle?: any;
  }

  export class ZoomableGroup extends React.Component<ZoomableGroupProps> {}

  export interface GeographiesProps {
    geography?: string | Record<string, any> | string[];
    children: (args: { geographies: any[] }) => React.ReactNode;
    parseGeographies?: (geographies: any[]) => any[];
  }

  export class Geographies extends React.Component<GeographiesProps> {}

  export interface GeographyProps extends React.SVGAttributes<SVGPathElement> {
    geography: any;
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
    onMouseDown?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
    onMouseUp?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
    onFocus?: (event: React.FocusEvent<SVGPathElement>) => void;
    onBlur?: (event: React.FocusEvent<SVGPathElement>) => void;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export class Geography extends React.Component<GeographyProps> {}

  export interface MarkerProps extends React.SVGAttributes<SVGGElement> {
    coordinates: [number, number];
  }

  export class Marker extends React.Component<MarkerProps> {}
}
