/// <reference types="vite/client" />

// For SVGs
declare module '*.svg' {
  const content: string;
  export default content;
}

// Optional: other images
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}