const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'openapi-route-count-secret';

const app = require('../server');
const { spec, countOperations, introduction } = require('../src/docs/openapiSpec');
const { listRegisteredRoutes, operationsOf } = require('../src/docs/registeredRoutes');

describe('OpenAPI covers every registered route', () => {
  const registered = listRegisteredRoutes(app);
  const documented = operationsOf(spec);

  test('spec operations equal the routes mounted in Express', () => {
    expect(documented).toEqual(registered);
  });

  test('introduction states the same total', () => {
    expect(countOperations(spec)).toBe(registered.length);
    expect(introduction).toContain(`Hệ thống đăng ký đúng ${registered.length} endpoint.`);
    const readme = fs.readFileSync(path.join(__dirname, '../../../README.md'), 'utf8');
    expect(readme).toContain(introduction);
    expect(spec.info.description).toBe(introduction);
  });

  test('committed openapi.yaml matches the served spec', () => {
    const fileSpec = YAML.parse(fs.readFileSync(path.join(__dirname, '../openapi.yaml'), 'utf8'));
    expect(operationsOf(fileSpec)).toEqual(documented);
    expect(fileSpec.info.description.replace(/\r\n/g, '\n').trim()).toBe(introduction.replace(/\r\n/g, '\n').trim());
  });
});
