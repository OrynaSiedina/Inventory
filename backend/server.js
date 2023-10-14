const dotnev = require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose').default;
const bodyParser = require('body-parser');
const app = express();
const userRoute = require('./routes/userRoute');
const errorHandler = require('./middlewares/errorMiddleware');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5000;

// ------MIDDLEWARES------
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

// -----ROUTES------
app.get("/", (req, res) => {
    res.send("Home page");
})
//----- ROUTES MIDDLEWARE-----
app.use("/api/users", userRoute);

app.use(errorHandler)
mongoose.connect(process.env.DB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        })
    }).catch(err => {
    console.log(err);
})





