/* Optional: generates a Workbox precache worker as workbox-sw.js (does not replace service-worker.js). */
module.exports = {
  globDirectory: '.',
  globPatterns: ['**/*.{html,css,js,svg,webmanifest,json}'],
  globIgnores: ['node_modules/**', 'workbox-config.js', 'workbox-sw.js'],
  swDest: 'workbox-sw.js',
  clientsClaim: true,
  skipWaiting: true
};