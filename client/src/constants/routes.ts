export const ROUTES = {
  HOME: '/',
  SHARED_SNIPPET: '/s/:shareId',
  SNIPPET: '/snippets/:snippetId',
  LOGIN: '/login',
  REGISTER: '/register',
  PUBLIC_SNIPPETS: '/public/snippets',
  AUTH_CALLBACK: '/auth/callback',
  EMBED: '/embed/:shareId',
  RECYCLE: '/recycle/snippets',
} as const;
