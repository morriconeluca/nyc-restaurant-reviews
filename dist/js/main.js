"use strict";!function(c,d){var t;c.cE=c.createElement,t=function(){!function(){function t(e){var t;t=void 0,d.serviceWorker.addEventListener("controllerchange",function(){t||(location.reload(!0),t=!0)});var n=c.cE("div"),i=c.cE("p"),o=c.cE("p"),s=c.cE("button"),r=c.cE("button");n.id="update-alert",n.setAttribute("role","alert"),i.innerHTML="New version available.",o.className="no-wrap",s.type="button",s.innerHTML="REFRESH",r.type="button",r.innerHTML="DISMISS",o.append(s,r),n.append(i,o),c.body.appendChild(n),setTimeout(function(){n.className="open",setTimeout(function(){s.focus(),setTimeout(function(){sessionStorage.dismissed||a(n)},5e3)},300)},1e3),s.addEventListener("click",function(){e.postMessage({action:"refresh"})}),r.addEventListener("click",function(){d.serviceWorker.controller.postMessage({action:"dismiss"}),a(n)})}function n(e){e.addEventListener("statechange",function(){"installed"==this.state&&t(this)})}function a(e){e.classList.remove("open"),c.body.focus(),setTimeout(function(){e.remove()},300)}d.serviceWorker?d.serviceWorker.register("/sw.js").then(function(e){d.serviceWorker.controller&&(d.serviceWorker.addEventListener("message",function(e){"refreshed"===e.data.action&&sessionStorage.removeItem("dismissed"),"dismissed"===e.data.action&&sessionStorage.setItem("dismissed",!0)}),sessionStorage.dismissed||(e.waiting?t(e.waiting):e.installing?n(e.installing):e.addEventListener("updatefound",function(){n(e.installing)})))}).catch(function(e){console.log("[SW] Registration failed, error:",e)}):console.log("Service Worker not supported")}()},"loading"!==c.readyState?t():c.addEventListener("DOMContentLoaded",function e(){t(),c.removeEventListener("DOMContentLoaded",e)})}(document,navigator);
//# sourceMappingURL=main.js.map
