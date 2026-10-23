# PawnZM

A local buy-and-sell marketplace for Zambia. Users can browse listings by category, search, view item details, and post their own items with a photo.

**Stack:** HTML, CSS and vanilla JavaScript on the front end. PHP and MySQL on the back end.

## Features

- Browse and search listings, filter by category
- Listing detail view with a "Contact Seller" reveal
- Post a listing with image upload, validated on the server
- Listings stored in MySQL and served as JSON by a small PHP API

## Project structure

```
index.html          Page markup
styles.css          Styling
script.js           Client logic: fetches listings, renders cards, submits the form
get_products.php    GET  - returns all listings as JSON
add_product.php     POST - validates input, saves the image, inserts the listing
db.example.php      Database connection template (copy to db.php)
schema.sql          Database and table definition
uploads/            Uploaded images (created at runtime, not tracked)
```

## Running it locally (XAMPP)

1. Clone or copy this folder into `htdocs/pawnzm`.
2. Start **Apache** and **MySQL** from the XAMPP control panel.
3. Create the database: open phpMyAdmin, go to the SQL tab, and run the contents of `schema.sql`.
4. Copy `db.example.php` to `db.php` and put in your MySQL credentials.
5. Open `http://localhost/pawnzm/`.

Requires PHP 8+ with the `fileinfo` extension enabled (on by default in XAMPP).

## How uploads are handled

- The file type is detected from the file contents with `finfo`, not from the filename or the browser's claim
- Only JPG, PNG and WEBP are accepted, up to 5 MB, and the file must also parse as a real image
- Files are saved under a random name with an extension chosen by the server
- `uploads/.htaccess` blocks script execution and only serves image files
- Database writes use prepared statements, and the saved file is removed if the insert fails
- All user text is escaped before being rendered in the browser

## Known limitations and next steps

This is a working prototype, not production software.

- No user accounts or login: anyone can post, and there is no rate limiting or spam protection
- Seller contact details are included in the JSON from `get_products.php` for every listing. The "Contact Seller" button only hides them in the interface, so they can be scraped. Contact details should be fetched per listing, behind a login
- `get_products.php` returns every listing at once, with no pagination
- Search and category filtering happen in the browser; they should move server-side as the data grows
- Database connection errors are returned to the client. They should be logged instead
- No CSRF protection on the post form
- Sellers cannot edit or delete their listings
