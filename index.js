const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// midleware
app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ilfvfer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const featureRooms = client.db("BuleBeachHotel").collection("FeatureRooms");
        const bookingRooms = client.db("BuleBeachHotel").collection("BookingRooms");

        //Feature Rooms

        app.get('/allrooms', async (req, res) => {
            const cursor = featureRooms.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/allroomsbysort', async (req, res) => {
            const query = { availability: true };
            const options = {
                sort: { pricePerNight: 1 },
              };
            const cursor = featureRooms.find(query,options);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/featurerooms', async (req, res) => {
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
        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: { $eq: email } };
            const cursor = bookingRooms.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingRooms.insertOne(booking);
            res.send(result)
        });

        app.delete('/bookings/:id', async (req, res) =>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingRooms.deleteOne(query)
            res.send(result);
        });
        app.patch('/bookings/:id', async (req, res) =>{
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking=req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
              };
            const result= await bookingRooms.updateOne(filter,updateDoc );
            res.send(result)
        });

        // -----------------
        app.get('/confirmbooking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await featureRooms.findOne(query)
            res.send(result);
        });
        app.patch('/confirmbooking/:id', async (req, res) =>{
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bookRooms=req.body;
            console.log(bookRooms);
            const updateDoc = {
                $set: {
                    availability: bookRooms.availability
                },
              };
            const result= await featureRooms.updateOne(filter,updateDoc );
            res.send(result)
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
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