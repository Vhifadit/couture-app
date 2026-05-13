/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/compat/navigation" />

// CSS module declarations
declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Leaflet CSS declaration
declare module "leaflet/dist/leaflet.css" {
  const content: string;
  export default content;
}
