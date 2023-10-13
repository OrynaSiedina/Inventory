const dotnev = require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose').default;
const bodyParser = require('body-parser');
const app = express();

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.DB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        })
    }).catch(err => {
    console.log(err);
})

// ------MIDDLEWARES------
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());

// -----ROUTES------
app.get("/", (req, res) => {
    res.send("Home page");
})
