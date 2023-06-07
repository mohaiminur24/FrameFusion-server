const express = require('express');
const app = express();
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;


// middlewere is here
app.use(cors());
app.use(express.json());



// MongoDB connection from here
//................................

const uri = `mongodb+srv://${process.env.mongodb_user}:${process.env.mongodb_pass}@cluster0.85env82.mongodb.net/?retryWrites=true&w=majority`;

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


    // My activity from here

    const FrameFusion = client.db('FrameFusion');
    const allusers = FrameFusion.collection('allusers');


    // Route from here
    
    //Create new user function is here
    app.post('/createnewuser',async(req,res)=>{
        try {
            const newUser = req.body;
            const result = await allusers.insertOne(newUser);
            res.send(result);
        } catch (error) {
           console.log(`Create new user route working failed!`) 
        }
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





















app.get('/', (req,res)=>{
    res.send('FrameFusion website server is running well');
});






app.listen(port, ()=>{
    console.log(`This server running with ${port}`)
})