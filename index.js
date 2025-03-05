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
    authStrategy: new LocalAuth(
        {
            clientId: "2221",
            dataPath: "./whatsapp-session"
        }),
    puppeteer: { headless: true }
});

// Serve static files (QR Code image) via Express
app.use(express.static(path.join(__dirname, 'public')));




// API to send WhatsApp message
app.get('/', (req, res) => {// Event listener for QR code generation (for initial login)
    client.on('authenticated', (session) => {
        console.log('QR code received, generating QR image...' + session);

    });

    return res.send(`<h1>Scan the QR code to login</h1><img src="/qrcode.png" alt="QR Code" />`);
});
// API endpoint to check if WhatsApp client is ready
app.get('/status', (req, res) => {
    // Event listener when client is ready
    client.on('ready', () => {
        console.log('WhatsApp client is ready');
        isConnected = true;

    });
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

    // Event listener for QR code generation (for initial login)
    // client.on('qr', qr => {
    //     console.log('QR code received, generating QR image...');

    //     // Generate the QR code and save it to a file
    //     // qrcode.toFile('whatsapp_qr.png', qr, {
    //     //     color: {
    //     //         dark: '#000000',  // Black color for the code
    //     //         light: '#FFFFFF'  // White background
    //     //     }
    //     // }, (err) => {
    //     //     if (err) {
    //     //         console.error('Error saving QR code:', err);
    //     //     } else {
    //     //         console.log('QR code saved as whatsapp_qr.png');
    //     //     }
    //     // });
    //     // Save QR code to public folder
    //     require('qrcode').toFile(path.join(__dirname, 'public', 'qrcode.png'), qr, (err) => {
    //         if (err) throw err;
    //     });
    // });

    client.on('qr', qr => {

        require('qrcode').toFile(path.join(__dirname, 'public', 'qrcode.png'), qr, (err) => {
            // if (err) throw err;
            if (err) {
                // res.status(500).json({ error: 'Error generating QR code' });
                console.log("Error generating QR code");
            }
            // Send the QR code as a base64 image
            console.log("create Success");

            res.status(200).json({ success: "create Success" });
        })

    })
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
