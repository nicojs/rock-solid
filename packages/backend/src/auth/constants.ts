export const authConstants = Object.freeze({
  jwtSecret: process.env['JWT_SECRET']!,
  jwtStrategy: 'jwt',
  office365Strategy: 'office365',
});
