const dotnev = require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.DB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        })
    }).catch(err => {
        console.log(err);
    })