// Cities Milo serves. Server and app share this list; adding a city here also
// needs the plans_city_served CHECK in a new migration.
export const CITIES = { bengaluru: 'Bengaluru' };
// No place picker yet: every plan is recorded as Bengaluru, explicitly.
export const DEFAULT_CITY = 'bengaluru';
