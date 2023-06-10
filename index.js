const express = require("express");
const app = express();
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middlewere is here
app.use(cors());
app.use(express.json());

// MongoDB connection from here
//................................

const verifyToken =(req,res, next)=>{
  const authorize = req.headers.authorize;
  if(!authorize){
      return res.status(401).send({error:true, message: "Unauthorized Access!"})
  };
  const token = authorize.split(' ')[1];
  jwt.verify(token, process.env.DB_Access_token, (error, decoded)=>{
    if(error){
      return res.status(403).send({error:true, message: "Invalid Token access"});
    }
    req.decoded = decoded
    next();
  })
};

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

    // verfify Admin
    const verifyAdmin = async (req, res, next) => {
      const tokenEmail = req.decoded.email;
      const result = await allusers.findOne({ email: tokenEmail });
      if (result.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "unauthorize admin access!" });
      }
      next();
    };

     // verfify Instractor
     const verifyinstractor = async (req, res, next) => {
      const tokenEmail = req.decoded.email;
      const result = await allusers.findOne({ email: tokenEmail });
      if (result.role !== "instractor") {
        return res
          .status(403)
          .send({ error: true, message: "unauthorize instractor access!" });
      }
      next();
    };

     // verfify Student
     const verifystudent = async (req, res, next) => {
      const tokenEmail = req.decoded.email;
      const result = await allusers.findOne({ email: tokenEmail });
      if (result.role !== "student") {
        return res
          .status(403)
          .send({ error: true, message: "unauthorize student access!" });
      }
      next();
    };

    // Load all classes route is here
    app.get('/loadallclasses', async(req,res)=>{
        try {
          const result = await classes.find().toArray();
          res.send(result);
        } catch (error) {
          
        }
    })

    // load user route is here
    app.get("/loadcurrentuser", async (req, res) => {
      try {
        const userEmail = req.query.email;
        const result = await allusers.findOne({ email: userEmail });
        res.send(result);
      } catch (error) {
        console.log("user role route is not working");
      }
    });

    //get sigle class by class id
    app.get("/singleclassload", async (req, res) => {
      try {
        const id = req.query.id;
        const result = await classes.findOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.log("single class loader route is not working");
      }
    });

    //Get personal class by instractor email route is here
    app.get("/instractorclass",verifyToken, async (req, res) => {
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

    // create jwt token route is here
    app.post("/jwt", (req, res) => {
      try {
        const user = req.body;
        const accesstoken = process.env.DB_Access_token;
        const token = jwt.sign(user, accesstoken, {
          expiresIn: "1h",
        });
        res.send({ token });
      } catch (error) {
        console.log("create json token is not working");
      }
    });

    // update single class route is here
    app.post("/updateclassbyinstractor",verifyToken,verifyinstractor, async (req, res) => {
      try {
        const id = req.query.id;
        const { data } = req.body;
        const query = { _id: new ObjectId(id) };
        const updatedocument = {
          $set: {
            ClassName: data.ClassName,
            aviableseats: parseFloat(data.aviableseats),
            price: parseFloat(data.price),
            thumbnail: data.thumbnail,
          },
        };
        const result = await classes.updateOne(query, updatedocument);
        res.send(result);
      } catch (error) {
        console.log("update single class by instractor is not working");
      }
    });

    // Delete single class route is here
    app.delete("/deleteclass",verifyToken,verifyinstractor, async (req, res) => {
      try {
        const id = req.query.id;
        const result = await classes.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.log("Delete route is not working!");
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
    app.post("/createnewclass",verifyToken,verifyinstractor, async (req, res) => {
      try {
        const newClass = req.body;
        const result = await classes.insertOne(newClass);
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
