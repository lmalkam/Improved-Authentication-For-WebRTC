const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs')
const cors = require('cors');
const bcrypt = require('bcrypt');


const app = express();
const port = 3001;
app.use(cors());
// MongoDB connection
mongoose.connect('mongodb+srv://admin:admin@cluster0.8k8x2n0.mongodb.net/securemed2', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Define schema for patient
const patientSchema = new mongoose.Schema({
    // name: { type: String, required: true },
    // email: { type: String, required: true, unique: true },
    hash: { type: String, required: true, unique: true },
    sharedSecret: { type: String } // Field to store shared secret
});

// Define schema for doctor
const doctorSchema = new mongoose.Schema({
    //  name: { type: String, required: true },
    //  email: { type: String, required: true, unique: true },
    hash: { type: String, required: true, unique: true },
    sharedSecret: { type: String } // Field to store shared secret
});

// Model for Patient schema
const Patient = mongoose.model('Patient', patientSchema);

// Model for Doctor schema
const Doctor = mongoose.model('Doctor', doctorSchema);

// Middleware to parse JSON bodies
app.use(bodyParser.json());

function hashText(text) {
    // Create a hash object using the SHA-256 algorithm
    const hash = crypto.createHash('sha256');
    // Update the hash object with the text to be hashed
    hash.update(text);
    // Generate the hashed digest in hexadecimal format
    const hashedText = hash.digest('hex');
    return hashedText;
}


// Endpoint for patients to register
app.post('/registerpatient', async (req, res) => {
    try {
        const { username } = req.body;

        // Generate a salt and hash the username asynchronously
       // const hash = await bcrypt.hash(username, 10);

        const hash = hashText(username);
        // Create a new patient document
        const newPatient = new Patient({ hash });

        // Save the patient document to the database
        const patient = await newPatient.save();

        console.log('Patient registered successfully:', patient);
        res.status(201).json({ message: 'Patient registered successfully', patient });
    } catch (error) {
        console.error('Error registering patient:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Endpoint for doctors to register
app.post('/registerdoctor', async (req, res) => {
    try {
        const { username } = req.body;

        // Generate a salt and hash the password asynchronously
       // const hashedPassword = await bcrypt.hash(username, 10);
        const hashedPassword = hashText(username);

        // Create a new doctor document
        const newDoctor = new Doctor({
            hash: hashedPassword
        });

        // Save the doctor document to the database
        const doctor = await newDoctor.save();

        console.log('Doctor registered successfully:', doctor);
        res.status(201).json({ message: 'Doctor registered successfully', doctor: doctor });
    } catch (error) {
        console.error('Error registering doctor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.post('/fetchdata', (req, res) => {
    const { email, choice } = req.body;

    if (choice === '0') {
        // Fetch data for patient
        Patient.findOne({ hash : hashText(email) })
            .then(person => {
                console.log(person);
                return res.json(person);
            })
            .catch(error => {
                console.error(error);
                return res.status(500).json({ error: 'Internal server error' });
            });
    } else if (choice === '1') {
        // Fetch data for doctor
        Doctor.findOne({ hash : hashText(email)  })
            .then(doctor => {
                console.log(doctor);
                return res.json(doctor);
            })
            .catch(error => {
                console.error(error);
                return res.status(500).json({ error: 'Internal server error' });
            });
    } else {
        return res.json("Invalid choice");
    }
});



// Endpoint for Diffie-Hellman key exchange between patient and doctor
app.post('/keyexchange', async (req, res) => {
    const { patientId, doctorId } = req.body;

    console.log(patientId + doctorId);

    const patienthash = hashText(patientId);
    const doctorhash = hashText(doctorId);

    console.log(patienthash);
    // Find patient and doctor by their IDs
    Promise.all([
        Patient.findOne({hash : patienthash}).exec(),
        Doctor.findOne({hash : doctorhash}).exec()
    ])
        .then(([patient, doctor]) => {
            // Check if patient or doctor is null
            if (!patient || !doctor) {
                throw new Error('Patient or doctor not found');
            }

            // Generate Diffie-Hellman key pair for patient and doctor
            const patientDH = crypto.createDiffieHellman(512);
            const patientkey = patientDH.generateKeys();

            const doctorDH = crypto.createDiffieHellman(patientDH.getPrime(), patientDH.getGenerator());
            const doctorkey = doctorDH.generateKeys();

            // Compute shared secret for patient and doctor
            const patientSecret = patientDH.computeSecret(doctorkey).toString('hex');
            const doctorSecret = doctorDH.computeSecret(patientkey).toString('hex');

            // Store shared secrets in patient and doctor documents
            patient.sharedSecret = patientSecret;
            doctor.sharedSecret = doctorSecret;

            console.log(patient.sharedSecret);
            console.log(doctor.sharedSecret);

            // Save updated patient and doctor documents
            return Promise.all([patient.save(), doctor.save(), patientSecret, doctorSecret]);
        })
        .then(([updatedPatient, updatedDoctor, patientSecret, doctorSecret]) => {
            if (patientSecret === doctorSecret) {
                console.log('Shared secret is the same for both patient and doctor.');
            } else {
                console.log('Shared secret is different for patient and doctor.');
            }

            res.status(200).json({
                message: 'Diffie-Hellman key exchange successful',
                patient: updatedPatient,
                doctor: updatedDoctor
            });
        })
        .catch(error => {
            console.error('Error performing key exchange:', error);
            res.status(500).json({ error: 'Error performing key exchange: ' + error.message });
        });
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
