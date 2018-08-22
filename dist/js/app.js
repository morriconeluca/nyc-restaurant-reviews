"use strict";function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}!function(l,h,v){if(!l.fetch)throw new ClientError(400,"Fetch API Not Supported");h.gEBI=h.getElementById,h.cE=h.createElement,l.IntersectionObserver&&l.IntersectionObserverEntry&&"intersectionRatio"in l.IntersectionObserverEntry.prototype?"isIntersecting"in l.IntersectionObserverEntry.prototype||Object.defineProperty(l.IntersectionObserverEntry.prototype,"isIntersecting",{get:function(){return 0<this.intersectionRatio}}):e("js/intersection-observer.js");var ClientError=function ClientError(e,t){_classCallCheck(this,ClientError),this.code=e,this.message=t},u=void 0,d=void 0,s=void 0,f=void 0;function n(t){"loading"!==h.readyState?t():h.addEventListener("DOMContentLoaded",function e(){t(),h.removeEventListener("DOMContentLoaded",e)})}function p(o,c,s){if(l.indexedDB){var e=l.indexedDB.open("nyc_rr_data",1);return e.onupgradeneeded=function(e){var t=e.target.result;t.createObjectStore(o,{keyPath:"id"}),"restaurants"===o&&t.createObjectStore("reviews",{keyPath:"id"}).createIndex("restaurant_id","restaurant_id",{unique:!1})},new Promise(function(n){e.onsuccess=function(e){var a=e.target.result,t=a.transaction([o],"readonly").objectStore(o),i="reviews"===o?t.index("restaurant_id"):t;n(new Promise(function(n){var r=[],e=s?IDBKeyRange.only(s):null;i.openCursor(e).onsuccess=function(e){var t=e.target.result;t||r.length?t?(r.push(t.value),t.continue()):n(r):n(fetch(c).then(function(e){if(!e.ok)throw Error("Request failed. Returned status of "+e.statusText);return e.json()}).then(function(e){var t=a.transaction([o],"readwrite").objectStore(o);return e.forEach(function(e){t.add(e)}),e}).catch(function(e){console.log(e)}))},i.openCursor(e).onerror=function(e){console.log(e.target.error),n(m(o,c))}}))},e.onerror=function(e){console.log(e.target.error),n(m(o,c))}})}return m(o,c)}function m(e,t){return fetch(t).then(function(e){if(!e.ok)throw Error("Request failed. Returned status of "+e.statusText);return e.json()}).then(function(e){return e}).catch(function(e){console.log(e)})}function g(e,t){return new google.maps.Marker({position:e.latlng,title:e.name+" "+e.neighborhood,url:E(e),map:t,animation:google.maps.Animation.DROP})}function E(e){return"/restaurant.html?id="+e.id}function c(e,t){return"/img/"+e.photograph+"-"+t+"w.jpg"}function e(e){var t=h.cE("script");t.src=e,t.setAttribute("async",""),h.head.appendChild(t)}function b(e){var t=setTimeout(e);l.addEventListener("resize",function(){clearTimeout(t),t=setTimeout(e,60)})}function y(){var e=u.clientWidth,t=u.clientHeight,n=640<e||640<t?2:1,r=t<e?+(e/t).toFixed(6):+(t/e).toFixed(6);return t<e?(e=640<e?640:e,t=Math.round(e/r)):(t=640<t?640:t,e=Math.round(t/r)),{width:e,height:t,scale:n}}function w(e){fetch(e).then(function(e){return e.blob()}).then(function(e){u.style.backgroundImage="url("+URL.createObjectURL(e)+")",u.style.opacity=1}).catch(function(e){console.log(e)})}function L(){u.style.cursor="pointer",i(u,function(){I()},!0)}function i(t,n,r){var a=function(e){e.preventDefault(),e.stopPropagation(),n(),r&&(t.removeEventListener("click",a),t.removeEventListener("keydown",i))},i=function(e){13===e.keyCode&&a(e,!0)};t.addEventListener("click",a),t.addEventListener("keydown",i)}function I(){v.onLine?(e("https://maps.googleapis.com/maps/api/js?key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA&libraries=places&callback=initMap"),h.gEBI("map").style.display="block",u.removeAttribute("tabindex"),u.removeAttribute("role"),u.removeAttribute("aria-label")):M("x")}function M(e){var t=h.cE("div"),n=h.cE("p");if(t.id="offline-alert",t.setAttribute("role","alert"),n.innerHTML="⚠ You are offline, map is not available.",t.appendChild(n),e){var r=h.cE("p"),a=h.cE("button");a.type="button",a.innerHTML="CLOSE",r.appendChild(a),t.appendChild(r),i(a,function(){t.remove(),u.removeAttribute("class"),L()})}u.className="offline",u.style.opacity=1,u.appendChild(t),u.style.cursor="default"}function k(e){e.addListener("click",function(){l.location.href=e.url})}function C(i,o){var e=new google.maps.OverlayView;if(e.draw=function(){this.getPanes().markerLayer.id="markerLayer"},e.setMap(d),s)i();else var c=d.addListener("tilesloaded",function(){var e,t,n,r,a;i(),e=o,t=h.cE("a"),n=h.cE("h2"),r=h.querySelector('#map div[tabindex="0"]'),a=h.gEBI("map"),t.className="skip-link button",t.href=e?"#filter-options":"#restaurant-container",t.innerHTML="Skip the map",u.insertBefore(t,u.firstChild),n.id="map-label",n.className="sr-only",n.innerHTML="Google Maps Widget: shows restaurants location",u.insertBefore(n,u.firstChild),r.setAttribute("aria-labelledby","map-label"),r.addEventListener("focus",function(){a.classList.add("focused")}),r.addEventListener("blur",function(){a.classList.remove("focused")}),a.addEventListener("focus",function(){d.setOptions({keyboardShortcuts:!0})},!0),a.addEventListener("blur",function(){d.setOptions({keyboardShortcuts:!1})},!0),s=!0,f||h.querySelector('#map div[tabindex="0"]').focus(),google.maps.event.removeListener(c)})}function x(a,i,o){setTimeout(function(){for(var e=h.querySelectorAll('[id^="gmimap"]> area'),n=h.querySelectorAll("#markerLayer img"),t=function(t){e[t].tabIndex=0,e[t].addEventListener("focus",function(){n[t].classList.add("focused")}),e[t].addEventListener("blur",function(){n[t].classList.remove("focused")}),e[t].addEventListener("keydown",function(e){13===e.keyCode&&(a=a||i[t],l.location.href=E(a))})},r=0;r<e.length;r++)t(r);o()},150)}function T(e,t,n){var r=h.cE("img");if(r.className="restaurant-img",r.alt=e.photoDescription||(n?"The "+e.cuisine_type+" Restaurant "+e.name:"The Restaurant "+e.name+" in "+e.neighborhood),r.src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"></svg>',e.photograph){var a=h.cE("picture"),i=h.cE("source"),o=h.cE("source");i.dataset.srcset=function(e){for(var t=[],n=3;n<9;n++)t.push(c(e,100*n)+" "+100*n+"w");return t.join(", ")}(e),o.dataset.srcset=i.dataset.srcset.replace(/w.jpg/g,"w.webp"),i.sizes="(min-width: 1366px) calc((1366px - "+(n?"5rem) / 4":"4rem) / 3")+"), (min-width: 1080px) calc((100vw - 4rem) / 3), (min-width: 700px) calc((100vw - 3rem) / 2), calc(100vw - 2rem)",o.sizes=i.sizes,r.dataset.src=c(e,800),r.classList.add("lazy"),r.onerror=function(){o.remove()},a.append(o,i,r),t.insertBefore(a,t.firstChild)}else r.src="/img/image-fallback.svg",t.insertBefore(r,t.firstChild)}function A(){var e=[].slice.call(h.querySelectorAll(".lazy"));if(e){var a=new IntersectionObserver(function(e){e.forEach(function(e){if(e.isIntersecting){var t=e.target,n=t.parentElement.children[0],r=t.parentElement.children[1];n.srcset=n.dataset.srcset,r.srcset=r.dataset.srcset,t.src=t.dataset.src,t.style.opacity=1,n.removeAttribute("data-srcset"),r.removeAttribute("data-srcset"),t.removeAttribute("data-src"),a.unobserve(t)}})});e.forEach(function(e){a.observe(e)})}}p("restaurants","http://localhost:1337/restaurants").then(function(s){"/"===l.location.pathname||"/index.html"===l.location.pathname?function(){var r=[],a=void 0,i=void 0,p=void 0;function e(){return new Promise(function(e){var t=a[a.selectedIndex].value,n=i[i.selectedIndex].value,r=s.slice(0);"all"!=n&&(r=r.filter(function(e){return e.cuisine_type===n})),"all"!=t&&(r=r.filter(function(e){return e.neighborhood===t})),e(r)})}function o(t){t.forEach(function(e){var t=g(e,d);k(t),r.push(t)}),C(function(){x(null,t,function(){var e=1<t.length?"s":"";h.querySelector("#map iframe").title="Map shows "+t.length+" restaurant"+e})},!0)}function t(){e().then(function(e){var t,n;d&&(t=e,r.length&&(r.forEach(function(e){return e.setMap(null)}),r=[]),o(t)),n=e,p.innerHTML="",c(n),A()}),u&&!d&&(f=!0,I())}function c(e){var t=h.gEBI("results-notice");if(e.length){e.forEach(function(e){var t,n,r,a,i,o,c,s,l,u,d,f;p.appendChild((t=e,n=h.cE("li"),r=h.cE("article"),a=h.cE("h3"),i=h.cE("p"),o=h.cE("strong"),c=h.cE("address"),s=h.cE("p"),l=h.cE("p"),u=h.cE("label"),d=h.cE("input"),f=h.cE("a"),T(t,r,!0),a.innerHTML=t.name,o.innerHTML=""+t.neighborhood,i.appendChild(o),s.innerHTML=t.address,c.appendChild(s),d.type="checkbox",d.id="favorite-"+t.id,d.value=t.id,d.checked=t.is_favorite,d.className="button",u.htmlFor=d.id,u.className="sr-only",u.innerHTML="Is "+t.name+" your favorite restaurant?",f.innerHTML="View Details",f.href=E(t),f.className="button",f.setAttribute("aria-label","View Details about "+t.name),l.append(u,d,f),r.append(a,i,c,l),n.appendChild(r),n))});var n=1<e.length?"s":"";t.innerHTML=e.length+" restaurant"+n+" found"}else t.innerHTML="No restaurants found"}n(function(){u=h.gEBI("static-map"),a=h.gEBI("neighborhoods-select"),i=h.gEBI("cuisines-select"),p=h.gEBI("restaurants-list"),v.onLine?(b(function(){var e;w("https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&zoom=12&size="+(e=y()).width+"x"+e.height+"&scale="+e.scale+"&format=jpg&key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA")}),L()):M(),function(){a.addEventListener("change",t),i.addEventListener("change",t);var n=s.map(function(e,t){return s[t].neighborhood});(n=n.filter(function(e,t){return n.indexOf(e)===t})).forEach(function(e){var t=h.cE("option");t.innerHTML=e,t.value=e,a.appendChild(t)});var r=s.map(function(e,t){return s[t].cuisine_type});(r=r.filter(function(e,t){return r.indexOf(e)===t})).forEach(function(e){var t=h.cE("option");t.innerHTML=e,t.value=e,i.appendChild(t)})}(),c(s),A()}),l.initMap=function(){d=new google.maps.Map(h.gEBI("map"),{center:{lat:40.722216,lng:-73.987501},zoom:12,scrollwheel:!1,keyboardShortcuts:!1}),e().then(function(e){o(e)})}}():function(){var i=function(){var e=new URL(l.location.href).searchParams.get("id");if(e&&s[e-1])return s[e-1]}();if(!i)throw new ClientError(404,"File Not Found");n(function(){var e,t,n,r,a;u=h.gEBI("static-map"),v.onLine?(b(function(){var e;w("https://maps.googleapis.com/maps/api/staticmap?size="+(e=y()).width+"x"+e.height+"&scale="+e.scale+"&markers=color:red%7C"+i.latlng.lat+","+i.latlng.lng+"&format=jpg&key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA")}),L()):M(),e=i,t=h.gEBI("breadcrumb"),n=h.cE("li"),r=h.cE("a"),a=E(e),r.href=a,r.setAttribute("aria-current","page"),r.innerHTML=e.name,n.appendChild(r),t.appendChild(n),function(e){var t=h.querySelector("#restaurant-container> div"),n=h.gEBI("restaurant-name"),r=h.gEBI("restaurant-address"),a=h.gEBI("restaurant-cuisine"),i=h.cE("strong"),o=h.gEBI("favorite"),c=h.gEBI("add-review-button"),s=h.gEBI("overlay"),l=(h.querySelector("#overlay form"),h.gEBI("username")),u=h.gEBI("close-overlay-button"),d=h.gEBI("page"),f=["a[href]","area[href]","input:not([disabled])","select:not([disabled])","textarea:not([disabled])","button:not([disabled])","iframe","object","embed","[contenteditable]"].join(",");h.title=e.name+" - Restaurant Info and Reviews",T(e,t),n.innerHTML=e.name,r.innerHTML=e.address,i.innerHTML="Type of Cuisine: "+e.cuisine_type,a.appendChild(i),e.operating_hours&&function(e){var t=h.gEBI("restaurant-hours");for(var n in e){var r=h.cE("tr"),a=h.cE("th"),i=h.cE("td");a.innerHTML=n,a.scope="row",i.innerHTML=e[n],r.append(a,i),t.appendChild(r)}}(e.operating_hours);o.value=e.id,o.checked=e.is_favorite,c.addEventListener("click",function(){var e=[].slice.call(d.querySelectorAll(f)),t=[].slice.call(d.querySelectorAll('[tabindex="0"]')),n=[].slice.call(s.querySelectorAll('[tabindex="-1"]'));function r(e){27===e.keyCode&&(e.preventDefault(),e.stopPropagation(),a(),u.removeEventListener("click",a))}function a(){e.forEach(function(e){e.removeAttribute("tabindex")}),t.forEach(function(e){e.tabIndex=0}),n.forEach(function(e){e.tabIndex=-1}),d.removeAttribute("aria-hidden"),s.classList.remove("opened"),s.setAttribute("aria-hidden",!0),c.focus(),h.removeEventListener("keydown",r)}e.forEach(function(e){e.tabIndex=-1}),t.forEach(function(e){e.tabIndex=-1}),n.forEach(function(e){e.tabIndex=0}),s.removeAttribute("aria-hidden"),s.classList.add("opened"),d.setAttribute("aria-hidden",!0),l.focus(),u.addEventListener("click",a),h.addEventListener("keydown",r)}),p("reviews","http://localhost:1337/reviews/?restaurant_id="+e.id,e.id).then(function(e){!function(e){var t=h.gEBI("reviews-container"),n=h.cE("h2"),f=h.gEBI("reviews-list");if(n.innerHTML="Reviews",t.appendChild(n),!e){var r=h.cE("p");return r.innerHTML=v.online?"No reviews yet!":"Sorry, reviews for this restaurant are not available offline.",t.appendChild(r)}e.reverse().forEach(function(e){var t,n,r,a,i,o,c,s,l,u,d;f.appendChild((t=e,n=h.cE("li"),r=h.cE("article"),a=h.cE("header"),i=h.cE("h3"),o=h.cE("span"),c=h.cE("time"),s=h.cE("p"),l=h.cE("abbr"),u=h.cE("p"),d=new Date(t.updatedAt),o.innerHTML=t.name,c.dateTime=d.toISOString(),c.innerHTML=d.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),i.append(o,c),a.appendChild(i),l.title="Rating: "+t.rating+" of 5",l.className="stars-"+t.rating,s.appendChild(l),u.innerHTML=t.comments,r.append(a,s,u),n.appendChild(r),n))}),t.appendChild(f)}(e)}).catch(function(e){console.log(e)})}(i),A()}),l.initMap=function(){d=new google.maps.Map(h.gEBI("map"),{center:i.latlng,zoom:17,scrollwheel:!1,keyboardShortcuts:!1}),k(g(i,d)),C(function(){x(i,null,function(){h.querySelector("#map iframe").title="Map shows "+i.name+" location"})})}}()}).catch(function(e){console.log(e)})}(window,document,navigator);
//# sourceMappingURL=app.js.map
