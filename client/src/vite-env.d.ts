/// <reference types="vite/client" />

// Worker module declarations
declare module '*?worker' {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
} 