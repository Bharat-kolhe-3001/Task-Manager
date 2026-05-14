export function toPublicUser(user) {
  if (!user) return null;
  const { password: _p, ...rest } = user;
  return rest;
}
