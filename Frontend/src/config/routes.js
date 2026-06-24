export const ROUTES = {
  HOME:      '/',
  EVENTS:    '/events',
  EVENT:     (id) => `/events/${id}`,
  LOGIN:     '/login',
  SIGNUP:    '/signup',

  DASHBOARD: '/dashboard',
  TICKETS:   '/tickets',
  PROFILE:   '/profile',
  CHECKOUT:  '/checkout',

  ORGANIZER:         '/organizer',
  ORGANIZER_EVENTS:  '/organizer/events',
  ORGANIZER_CREATE:  '/organizer/events/create',
  ORGANIZER_EDIT:      (id) => `/organizer/events/${id}/edit`,
  ORGANIZER_ATTENDEES: (id) => `/organizer/events/${id}/attendees`,
  ORGANIZER_PROFILE: '/organizer/profile',

  ADMIN:            '/admin',
  ADMIN_EVENTS:     '/admin/events',
  ADMIN_USERS:      '/admin/users',
  ADMIN_ORGANIZERS: '/admin/organizers',
};
