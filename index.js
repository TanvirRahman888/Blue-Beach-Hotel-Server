const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// midleware
app.use(cors({
    origin: ['http://localhost:5173',
     'https://blue-beach-hotel.web.app', 
     'https://blue-beach-hotel.firebaseapp.com'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ilfvfer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const logger = async (req, res, next) => {
    console.log('Called ', req.host, req.originalUrl);
    next();
}
const verifyToken = async (req, res, next) => {
    const token =req.cookies?.token;
    console.log("Value of token ",token);
    if (!token) {
        res.status(401).send({message: 'Not Authorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
        // error
        if (err) {
            console.log(err);
            return res.status(401).send({message: 'Unauthorized'})
        }
        console.log("Value of the token :",decoded);
        req.user=decoded;

        next();

    })
    
}
const cookieOption={
    httpOnly: true,
    sameSite: process.env.NODE_ENV==="production"? "none":"strict",
    secure: process.env.NODE_ENV==="production"? true:false,
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const featureRooms = client.db("BuleBeachHotel").collection("FeatureRooms");
        const bookingRooms = client.db("BuleBeachHotel").collection("BookingRooms");

        // JWT Auth API
        app.post('/jwt',logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, cookieOption).send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })



        //Feature Rooms
        app.get('/allrooms',logger, async (req, res) => {
            const cursor = featureRooms.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/allroomsbysort', async (req, res) => {
            const query = { availability: true };
            const options = {
                sort: { pricePerNight: 1 },
            };
            const cursor = featureRooms.find(query, options);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/featurerooms',logger, async (req, res) => {
            const query = { pricePerNight: { $gt: 100 } };
            const options = { sort: { pricePerNight: -1 }, };
            const cursor = featureRooms.find(query, options);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/allrooms/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await featureRooms.findOne(query)
            res.send(result)
        });
        app.get('/bookroom/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await featureRooms.findOne(query)
            res.send(result)
        });


        //Book Room
        app.get('/bookings/:email',logger,verifyToken, async (req, res) => {
            const email = req.params.email;
            // console.log('Token', req.cookies.token);
            console.log('user in the valid token', req.user);
            if (email !==req.user.email) {
                return res.status(403).send({message: "Forbidden Access"})
            }
            const query = { email: { $eq: email } };
            const cursor = bookingRooms.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/bookings',logger, async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingRooms.insertOne(booking);
            res.send(result)
        });

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingRooms.deleteOne(query)
            res.send(result);
        });
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingRooms.updateOne(filter, updateDoc);
            res.send(result)
        });

        // -----------
        app.get('/confirmbooking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await featureRooms.findOne(query)
            res.send(result);
        });
        app.patch('/confirmbooking/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bookRooms = req.body;
            console.log(bookRooms);
            const updateDoc = {
                $set: {
                    availability: bookRooms.availability
                },
            };
            const result = await featureRooms.updateOne(filter, updateDoc);
            res.send(result)
        });


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send('Welcome to Blue Beach Hotel');
})
app.listen(port, () => {
    console.log(`Blue Beach Hotel Server is Running on port : ${port}`);
})