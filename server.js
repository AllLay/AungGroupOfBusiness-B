const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const products = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../frontend/src/components/products.json"), "utf8")
);

app.post("/checkout", (req, res) => {
    const { productId, clientEmail } = req.body;
    console.log("Received request:", req.body);
    
    const product = products.find((p) => p.id === Number(productId));

    if (!product) {
        return res.status(404).json({ message: "Product not found." });
    }
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: product.owner,
        subject: `Payment Received for ${product.name}`,
        text: `You have received a payment for ${product.name}.\nClient: ${clientEmail}.\nPrice: ${product.price} MMK.`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Email error:", error);
            return res.status(500).json({ message: "Error sending email." });
        }

        console.log("Email sent:", info.response);
        res.status(200).json({ message: "Purchase successful! Email sent to owner." });
    });
});

app.listen(5000);