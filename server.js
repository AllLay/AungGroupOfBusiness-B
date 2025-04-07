const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'https://aunggroupofbusiness.netlify.app',
}));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const productsPath = path.join(__dirname, 'products.json');
let products = [];

fs.readFile(productsPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading products file:', err);
        return;
    }
    products = JSON.parse(data);
});

app.post('/checkout', (req, res) => {
    const { productId, variationId, clientName, clientEmail, clientPhone } = req.body;

    if (!clientName) {
        return res.status(400).json({ message: 'Client name is required.' });
    }

    if (!clientEmail && !clientPhone) {
        return res.status(400).json({ message: 'At least one contact method is required (email or phone).' });
    }
    
    const product = products.find((p) => p.id === Number(productId));

    if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
    }
    
    const selectedVariation = product.variations.find((v) => v.id === Number(variationId));

    if (!selectedVariation) {
        return res.status(404).json({ message: 'Variation not found.' });
    }
    
    let contactInfo = `Client: ${clientName}`;
    if (clientEmail) contactInfo += `\nEmail: ${clientEmail}`;
    if (clientPhone) contactInfo += `\nPhone: ${clientPhone}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: product.owner,
        subject: `Payment Received for ${selectedVariation.name}`,
        text: `You have received a payment for the variation "${selectedVariation.name}" of the product "${product.name}".\n\n${contactInfo}\n\nPrice: ${selectedVariation.price} MMK.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending email.' });
        }
        res.status(200).json({ message: 'Purchase successful! Email sent to owner.' });
    });
});

app.listen(5000);
