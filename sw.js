/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

importScripts('/bower_components/sw-toolbox/sw-toolbox.js');

const config = {
  offlinePage: '/'
}

config.filesToCache = [
    '/',
    config.offlinePage,
    '/favicon.ico',
    '/static/img/gb.svg',
    '/static/img/fr.svg',
    '/static/img/id.svg',
    '/static/img/background-mobile.jpg',
    '/static/img/background.jpg',
    '/static/img/blog-icon.svg',
    '/static/img/close.svg',
    '/static/img/facebook-icon.svg',
    '/static/img/favicon.png',
    '/static/img/hamburger.svg',
    '/static/img/instagram-logo.png',
    '/static/img/logo-javavisites.svg',
    '/static/img/phones-symbol.svg',
    '/static/img/sms-black.svg',
    '/static/img/video-play.svg',
    '/static/img/whatsapp-symbol.svg',
    'https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&lang=en'
];

/**
 * Generates a placeholder SVG image of the given size.
 */
function offlineImage(name, width, height) {
  return `<?xml version="1.0"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" version="1.1">
  <g fill="none" fill-rule="evenodd"><path fill="#F8BBD0" d="M0 0h${width}v${height}H0z"/></g>
  <text text-anchor="middle" x="${Math.floor(width / 2)}" y="${Math.floor(height / 2)}">image offline (${name})</text>
<style><![CDATA[
text{
  font: 48px Roboto,Verdana, Helvetica, Arial, sans-serif;
}
]]></style>
</svg>`;
}

/**
 * Returns true if the Accept header contains the given content type string.
 */
function requestAccepts(request, contentType) {
  return request.headers.get('Accept').indexOf(contentType) != -1;
}

/**
 * ampbyexample.com fetch handler:
 *
 * - one-behind caching 
 * - shows offline page
 * - generates placeholder image for unavailable images
 */
function ampByExampleHandler(request, values) {
  // for samples show offline page if offline and samples are not cached
  if (requestAccepts(request, 'text/html')) {
    // never use cached version for AMP CORS requests (e.g. amp-live-list)
    if (request.url.indexOf("__amp_source_origin") != -1) {
      return toolbox.networkOnly(request, values);
    }
    // cache or network - whatever is fastest
    return toolbox.fastest(request, values).catch(function() {
        return toolbox.cacheOnly(new Request(config.offlinePage), values);
    });
  }
  // always try to load images from the cache first
  // fallback to placeholder SVG image if offline and image not available
  if (requestAccepts(request, 'image/')) {
    return toolbox.cacheFirst(request, values).catch(function() {
      const url = request.url;
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      // TODO use correct image dimensions
      return new Response(offlineImage(fileName, 1080, 610),
          { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    });
  } else {
    // cache all other requests
    return toolbox.fastest(request, values);
  }
}

toolbox.options.debug = true;
toolbox.router.default = toolbox.networkOnly;
toolbox.router.get('/(.*)', ampByExampleHandler, {origin: self.location.origin});
// cache first amp runtime 
toolbox.router.get('/(.*)', toolbox.cacheFirst, {origin: 'https://cdn.ampproject.org'});
// cache first google fonts
toolbox.router.get('/(.+)', toolbox.cacheFirst, {origin: /https?:\/\/fonts.+/});

toolbox.precache(config.filesToCache);
