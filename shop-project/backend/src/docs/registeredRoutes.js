const fs = require('fs');
const path = require('path');

const joinPath = (prefix, routePath) => {
  if (!routePath || routePath === '/') return prefix || '/';
  const left = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const right = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${left}${right}` || '/';
};

const methodsOf = (route) => Object.keys(route.methods).filter((method) => route.methods[method] && method !== '_all');

const collect = (stack, prefix, output) => {
  stack.forEach((layer) => {
    if (!layer.route) return;
    methodsOf(layer.route).forEach((method) => {
      output.push(`${method.toUpperCase()} ${joinPath(prefix, layer.route.path)}`);
    });
  });
};

const mountOf = (layer, candidates) => {
  const matches = candidates.filter((candidate) => {
    const sample = candidate === '/' ? '/' : `${candidate}/__probe__`;
    return layer.matchers.some((match) => {
      const result = match(sample);
      return result && result.path === candidate;
    });
  });
  if (matches.length !== 1) {
    throw new Error(`Could not resolve a single mount for a router. Candidates: ${matches.join(', ') || '(none)'}`);
  }
  return matches[0];
};

const listRegisteredRoutes = (app) => {
  const source = fs.readFileSync(path.join(__dirname, '../../server.js'), 'utf8');
  const mounts = [...new Set([...source.matchAll(/app\.use\(\s*'([^']+)'/g)].map((match) => match[1]))];
  const routers = app.router.stack.filter((layer) => layer.handle && layer.handle.stack && layer.matchers);

  const routes = [];
  app.router.stack.forEach((layer) => {
    if (layer.route) collect([layer], '', routes);
  });
  routers.forEach((layer) => collect(layer.handle.stack, mountOf(layer, mounts), routes));

  return [...new Set(routes)].sort();
};

const operationsOf = (document) => {
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
  const operations = [];
  Object.entries(document.paths).forEach(([routePath, pathItem]) => {
    httpMethods.forEach((method) => {
      if (pathItem[method]) {
        const expressPath = routePath.replace(/\{([^}]+)\}/g, ':$1');
        operations.push(`${method.toUpperCase()} ${expressPath}`);
      }
    });
  });
  return operations.sort();
};

module.exports = { listRegisteredRoutes, operationsOf };
