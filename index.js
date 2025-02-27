const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');

const fs = require('fs');

const path = require('path');

const app = express();
const port = 3000;

let isConnected = false; // Flag to track connection status

// Create a new client using local authentication (saves session so you don't need to scan every time)
const client = new Client({
    authStrategy: new LocalAuth()
});

// Serve static files (QR Code image) via Express
app.use(express.static(path.join(__dirname, 'public')));

// Event listener for QR code generation (for initial login)
client.on('authenticated', (session) => {
    console.log('QR code received, generating QR image...' + session);


});

// Event listener for QR code generation (for initial login)
client.on('qr', qr => {
    console.log('QR code received, generating QR image...');

    // Generate the QR code and save it to a file
    // qrcode.toFile('whatsapp_qr.png', qr, {
    //     color: {
    //         dark: '#000000',  // Black color for the code
    //         light: '#FFFFFF'  // White background
    //     }
    // }, (err) => {
    //     if (err) {
    //         console.error('Error saving QR code:', err);
    //     } else {
    //         console.log('QR code saved as whatsapp_qr.png');
    //     }
    // });
    // Save QR code to public folder
    require('qrcode').toFile(path.join(__dirname, 'public', 'qrcode.png'), qr, (err) => {
        if (err) throw err;
    });
});

// Event listener when client is ready
client.on('ready', () => {
    console.log('WhatsApp client is ready');
    isConnected = true;
    // // Send a message
    // const number = 'YOUR_PHONE_NUMBER'; // The number you want to send the message to, including country code.
    // const message = 'Hello from Node.js using whatsapp-web.js!';

    // client.sendMessage(`${number}@c.us`, message)  // WhatsApp uses the @c.us suffix for numbers.
    //     .then(response => {
    //         console.log('Message sent:', response);
    //     })
    //     .catch(error => {
    //         console.error('Error sending message:', error);
    //     });
});
// app.use(express.static('public'));
// app.use('/images', express.static('img'));

// API to send WhatsApp message
app.get('/', (req, res) => {
    // return res.status(200).send({ success: 'WhatsApp client is ready' });
    // return res.status(200).json({
    //     'imageName': 'some image',
    //     'imageUrl': '/whatsapp_qr.png'
    // });
    return res.send(`<h1>Scan the QR code to login</h1><img src="/qrcode.png" alt="QR Code" />`);
});
// API endpoint to check if WhatsApp client is ready
app.get('/status', (req, res) => {
    res.json({ status: isConnected ? 'connected' : 'disconnected' });
});


// API endpoint to disconnect WhatsApp client
app.post('/disconnect', (req, res) => {
    if (isConnected) {
        client.destroy()  // This will log the client out and disconnect it
            .then(() => {
                isConnected = false;  // Update connection status
                res.json({ status: 'disconnected' });
            })
            .catch((error) => {
                res.status(500).json({ error: 'Failed to disconnect', details: error.message });
            });
    } else {
        res.status(400).json({ error: 'Client is already disconnected' });
    }
});

// API endpoint to generate the QR code dynamically
app.get('/api/qr', (req, res) => {
    // Generate the QR code dynamically
    // client.on('qr', (qr) => {
    //     // Convert the QR code to a base64 string and return it in the response
    //     qrcode.toDataURL(qr, (err, url) => {
    //         if (err) {
    //             return res.status(500).json({ error: 'Error generating QR code' });
    //         }
    //         // Send the QR code as a base64 image
    //         res.json({ qrCode: url });
    //     });
    // });
    client.on('qr', qr => {

        require('qrcode').toFile(path.join(__dirname, 'public', 'qrcode.png'), qr, (err) => {
            // if (err) throw err;
            if (err) {
                return res.status(500).json({ error: 'Error generating QR code' });
            }
            // Send the QR code as a base64 image
            res.json({ qrCode: "create Success" });
        });
    });
});


// API to send WhatsApp message
app.post('/send-message', express.json(), (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).send({ error: 'Phone and message are required' });
    }

    client.sendMessage(`${phone}@c.us`, message)
        .then((response) => {
            res.status(200).send({ success: 'Message sent successfully', response });
        })
        .catch((error) => {
            res.status(500).send({ error: 'Failed to send message', details: error });
        });
});

app.listen(port, () => {
    console.log(`WhatsApp API listening at http://localhost:${port}`);
});

// Initialize the client
client.initialize();
