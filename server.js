require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = process.env.PORT;

// Use CORS for allowing requests from the frontend on a different port
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4000'], // List of allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));


// Middleware to parse incoming JSON bodies
app.use(express.json()); // This is essential to parse JSON in the request body

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Endpoint to get all products
app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM products';

    pool.query(sql, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ products: rows });
    });
});

// Endpoint to add a new product
app.post('/products', (req, res) => {
    const product = req.body;
    console.log('Received product:', product);

    // Validate the incoming data
    if (!product.title || !product.price || !product.description || !product.category || !product.image || !product.ratingRate || !product.ratingCount) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Insert product into the database
    const sql = 'INSERT INTO products (title, price, description, category, image, rating_rate, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    pool.query(sql, [product.title, product.price, product.description, product.category, product.image, product.ratingRate, product.ratingCount], (err, result) => {
        if (err) {
            console.error('Error inserting product:', err.message);  // Log detailed error
            return res.status(500).json({ error: 'Database insert failed: ' + err.message });
        }
        console.log('Product inserted:', result);
        res.status(201).json({ message: 'Product created successfully', product });
    });
});

// Endpoint to delete a product by ID
app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;

    // Validate the product ID
    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    const sql = 'DELETE FROM products WHERE id = ?';

    pool.query(sql, [productId], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err.message);
            return res.status(500).json({ error: 'Database delete failed: ' + err.message });
        }

        // If no rows were affected, it means the product was not found
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log('Product deleted:', result);
        res.status(200).json({ message: 'Product deleted successfully' });
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Close the database connection when the app stops
process.on('SIGINT', () => {
    pool.end((err) => {
        if (err) {
            console.error('Error closing database connection:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
    process.exit();
});
