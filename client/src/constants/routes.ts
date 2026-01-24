export const ROUTES = {
  HOME: '/',
  SHARED_SNIPPET: '/s/:shareId',
  SNIPPET: '/snippets/:snippetId',
  SNIPPETS: '/snippets',
  LOGIN: '/login',
  REGISTER: '/register',
  PUBLIC_SNIPPETS: '/public/snippets',
  AUTH_CALLBACK: '/auth/callback',
  LOGOUT_CALLBACK: '/auth/logout_callback',
  EMBED: '/embed/:shareId',
  RECYCLE: '/recycle/snippets',
  ADMIN: '/admin',
} as const;
