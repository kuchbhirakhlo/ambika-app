import 'next';

declare module 'next' {
  interface GetStaticPaths {
    params: {
      [key: string]: string;
    };
  }
}

declare module 'next/dist/server/route-kind' {
  interface RouteContext {
    params: {
      [key: string]: string;
    };
  }
} 