const path = require('path');

jest.mock('../engines/tracking-engine', () => {
  return jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
    getUserEvents: jest.fn()
  }));
});

jest.mock('../middleware/auth', () => (req, res, next) => next());

describe('server api routes', () => {
  const routesDir = path.join(__dirname, 'routes');
  const fs = require('fs');
  const files = fs
    .readdirSync(routesDir)
    .filter((file) => file.endsWith('.js'));

  test.each(files)('%s loads without error', (file) => {
    expect(() => require(path.join(routesDir, file))).not.toThrow();
  });
});
