const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // My activity from here

    const FrameFusion = client.db("FrameFusion");
    const allusers = FrameFusion.collection("allusers");
    const classes = FrameFusion.collection("classes");

    // Route from here

    //get sigle class by class id 
    app.get("/singleclassload", async(req,res)=>{
      try {
        const id = req.query.id;
        const result = await classes.findOne({_id: new ObjectId(id)});
        res.send(result);
      } catch (error) {
        console.log("single class loader route is not working")
      }
    });

    //Get personal class by instractor email route is here
    app.get("/instractorclass", async (req, res) => {
      try {
        const email = req.query.email;
        const result = await classes.find({ instractorEmail: email }).toArray();
        res.send(result);
      } catch (error) {
        console.log("instractor class route is not working");
      }
    });

    //Get all instractor route is here
    app.get("/allinstractor", async (req, res) => {
      try {
        const result = await allusers.find({ role: "instractor" }).toArray();
        res.send(result);
      } catch (error) {
        console.log("all instractor route is not working");
      }
    });

    // update single class route is here
    app.post("/updateclassbyinstractor", async(req,res)=>{
      try {
        const id = req.query.id;
        const {data} = req.body;
        const query = {_id: new ObjectId(id)};
        const updatedocument = {
          $set:{
            ClassName: data.ClassName,
            aviableseats: parseFloat(data.aviableseats),
            price: parseFloat(data.price),
            thumbnail: data.thumbnail
          }
        }
        const result = await classes.updateOne(query,updatedocument);
        res.send(result);
      } catch (error) {
        console.log('update single class by instractor is not working')
      }
    })

    // Delete single class route is here
    app.delete("/deleteclass", async(req,res)=>{
      try {
        const id = req.query.id;
        const result = await classes.deleteOne({_id: new ObjectId(id)});
        res.send(result);
      } catch (error) {
        console.log('Delete route is not working!')
      }
    });

    //Create new user function is here
    app.post("/createnewuser", async (req, res) => {
      try {
        const newUser = req.body;
        const result = await allusers.insertOne(newUser);
        res.send(result);
      } catch (error) {
        console.log(`Create new user route working failed!`);
      }
    });

    // Create new class route is here
    app.post("/createnewclass", async (req, res) => {
      try {
        const data = req.body;
        const result = await classes.insertOne(data);
        res.send(result);
      } catch (error) {
        console.log("Create new user route working failed");
      }
    });

    // create new user route by google
    app.post("/createnewuserbygoogle", async (req, res) => {
      try {
        const newUser = req.body;
        const userEmail = newUser.email;
        const isAvilable = await allusers.findOne({ email: userEmail });
        if (isAvilable) {
          return res.send({ avilable: true });
        }
        const result = await allusers.insertOne(newUser);
        res.send(result);
      } catch (error) {
        console.log(`Create new user route working failed!`);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("FrameFusion website server is running well");
});

app.listen(port, () => {
  console.log(`This server running with ${port}`);
});
