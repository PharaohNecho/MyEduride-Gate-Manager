import './globals.css';

export const metadata = {
  title: 'MyEduRide Gate Manager',
  description: 'Student safety platform with QR code scanning, automatic arrival/departure logs, and parent dashboards.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Initialize theme
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}

                // Safeguard JSON.stringify against circular structures and DOM elements
                var originalStringify = JSON.stringify;
                if (typeof originalStringify === 'function') {
                  function safeDecycle(obj, seen) {
                    if (typeof obj !== 'object' || obj === null) {
                      return obj;
                    }
                    if (!seen) seen = new Set();
                    if (seen.has(obj)) {
                      return '[Circular]';
                    }
                    seen.add(obj);

                    if (typeof Node !== 'undefined' && obj instanceof Node) {
                      seen.delete(obj);
                      return '[DOM: <' + obj.nodeName.toLowerCase() + (obj.id ? ' id="' + obj.id + '"' : '') + '>]';
                    }
                    if (typeof obj.nodeType === 'number' && typeof obj.nodeName === 'string') {
                      seen.delete(obj);
                      return '[DOM Element]';
                    }

                    if (Array.isArray(obj)) {
                      var out = [];
                      for (var i = 0; i < obj.length; i++) {
                        out.push(safeDecycle(obj[i], seen));
                      }
                      seen.delete(obj);
                      return out;
                    }

                    var outObj = {};
                    for (var key in obj) {
                      if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        try {
                          outObj[key] = safeDecycle(obj[key], seen);
                        } catch (e) {
                          outObj[key] = '[Unserializable Key]';
                        }
                      }
                    }
                    seen.delete(obj);
                    return outObj;
                  }

                  JSON.stringify = function(value, replacer, space) {
                    try {
                      return originalStringify(value, replacer, space);
                    } catch (err) {
                      try {
                        var cleanValue = safeDecycle(value);
                        return originalStringify(cleanValue, replacer, space);
                      } catch (e2) {
                        return '"[Unserializable Object]"';
                      }
                    }
                  };
                }

                var methods = ['log', 'warn', 'error', 'info', 'debug'];
                methods.forEach(function(method) {
                  var currentImpl = console[method];
                  if (typeof currentImpl !== 'function') return;

                  function sanitize(arg, seen) {
                    if (typeof arg !== 'object' || arg === null) {
                      return arg;
                    }
                    if (typeof Node !== 'undefined' && arg instanceof Node) {
                      return '[DOM Element: <' + arg.nodeName.toLowerCase() + (arg.id ? ' id="' + arg.id + '"' : '') + '>]';
                    }
                    if (typeof arg.nodeType === 'number' && typeof arg.nodeName === 'string') {
                      return '[DOM Element: <' + arg.nodeName.toLowerCase() + '>]';
                    }
                    if (!seen) seen = new Set();
                    if (seen.has(arg)) {
                      return '[Circular Reference]';
                    }
                    seen.add(arg);

                    if (Array.isArray(arg)) {
                      var sanitizedArr = arg.map(function(item) { return sanitize(item, seen); });
                      seen.delete(arg);
                      return sanitizedArr;
                    }

                    var copy = {};
                    var keys = Object.keys(arg);
                    for (var i = 0; i < keys.length; i++) {
                      var key = keys[i];
                      try {
                        copy[key] = sanitize(arg[key], seen);
                      } catch (e) {
                        copy[key] = '[Unserializable Key]';
                      }
                    }
                    seen.delete(arg);
                    return copy;
                  }

                  function makeWrapper(fn) {
                    return function() {
                      var args = Array.prototype.slice.call(arguments);
                      var sanitizedArgs = args.map(function(arg) {
                        try {
                          return sanitize(arg);
                        } catch (e) {
                          return '[Unserializable Object]';
                        }
                      });
                      return fn.apply(this, sanitizedArgs);
                    };
                  }

                  try {
                    Object.defineProperty(console, method, {
                      configurable: true,
                      enumerable: true,
                      get: function() {
                        return makeWrapper(currentImpl);
                      },
                      set: function(val) {
                        currentImpl = val;
                      }
                    });
                  } catch (e) {
                    // Fallback to simpler wrapping if defineProperty is not allowed
                    console[method] = makeWrapper(currentImpl);
                  }
                });
              })();
            `
          }}
        />
      </head>
      <body className="antialiased font-sans bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
