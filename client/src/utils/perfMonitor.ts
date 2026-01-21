// Lightweight performance monitoring for legal pages
export const PerfMonitor = {
  startNavigation: (pageName: string) => {
    const start = performance.now();
    console.log(`🚀 ${pageName} Navigation Started at ${start.toFixed(1)}ms`);
    return start;
  },

  endNavigation: (pageName: string, startTime: number) => {
    const end = performance.now();
    const duration = end - startTime;
    console.log(`✅ ${pageName} Navigation Complete: ${duration.toFixed(1)}ms`);
    return duration;
  },

  startComponentRender: (pageName: string) => {
    const start = performance.now();
    console.log(`⚛️ ${pageName} Component Render Started at ${start.toFixed(1)}ms`);
    return start;
  },

  endComponentRender: (pageName: string, startTime: number) => {
    const end = performance.now();
    const duration = end - startTime;
    console.log(`🎯 ${pageName} Component Render Complete: ${duration.toFixed(1)}ms`);
    return duration;
  }
};