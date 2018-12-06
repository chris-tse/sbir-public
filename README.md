# SBIR Connector

## Getting Started

1. Clone the repo to your local machine  
`git clone git@github.com:baileyholl/SBIR-Project.git`

2. Navigate into `GrantWebsite/node_server`  
`cd GrantWebsite/node_server`

3. Install dependencies  
`npm i`

4. Run the development server  
`npm start`

## File Structure

The website is separated into three separate parts: public, routes, and views.

- `public/` 
  - This folder holds all client facing files such as stylesheets, images, client-side JavaScript, etc
  
- `routes/`
  - This directory is where all server-side routing files reside. Main routing paths should be declared in `app.js` and pull from files within `routes/`. 

- `views/`
  - This directory holds all front end views, templated in handlebars. Partials which are included in every page such go under `views/partials/`. For example, content of the `<head>` which are in every page such as stylesheet includes are stored in `views/partials/head.handlebars`. If handlebars layouts are to be used, they are stored in `views/layouts/`
  

Example:
```js
// app.js

const index = require('./routes/index');

...

app.get('/', index);
```
```js
// routes/index.js

const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.render('index', {
        title: 'Home - SBIR_Connector',
        homePage: true,
    });
});

module.exports = router;
```
```hbs
<!-- views/index.handlebars -->

<!DOCTYPE html>
<html lang="en">

<head>
    {{> head}}
    ...
</head>
</body>
    ...
```
```hbs
<!-- views/partials/head.handlebars -->

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
...
```