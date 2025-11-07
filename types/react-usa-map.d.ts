declare module 'react-usa-map' {
  import { Component } from 'react';

  interface USAMapProps {
    onClick?: (event: any) => void;
    onMouseMove?: (event: any) => void;
    onMouseOut?: (event: any) => void;
    customize?: {
      [key: string]: {
        fill?: string;
        [key: string]: any;
      };
    };
    title?: string;
    width?: number;
    height?: number;
    defaultFill?: string;
    className?: string;
  }

  export default class USAMap extends Component<USAMapProps> {}
}

