# Project for Mobile Web Specialist Certification Course

## Project Overview

The **New York City Restaurant Reviews** projects is a mobile-ready web application, responsive on different sized displays and accessible for screen reader use. The service worker gives a seamless offline experience for your users.

### What do I do from here

1. In the `dist` folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

For example:
```
# cd dist
# python3 -m http.server 8000
```

2. Fork and clone [the server repository](https://github.com/udacity/mws-restaurant-stage-2). You’ll use this development server to run the application code. Start the server with:
```
# node server
```

3. With your servers running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.

### Some good stuff

1. Improved accessibility of Google Maps with focusable markers pressing tab button on keyboard. Enabled Google Maps keyboard UI only when map DOM element or any of his children is onfocus.

2. Implementation of a better service worker update logic with UX, sessionStorage and postMessage.