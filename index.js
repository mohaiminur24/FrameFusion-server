const express = require("express");
const app = express();
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.Payment_secrect_key);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middlewere is here
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB connection from here
//................................

const verifyToken = (req, res, next) => {
  const authorize = req.headers.authorize;
  if (!authorize) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access!" });
  }
  const token = authorize.split(" ")[1];
  jwt.verify(token, process.env.DB_Access_token, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "Invalid Token access" });
    }
    req.decoded = decoded;
    next();
  });
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
    const paymentHistory = FrameFusion.collection("payhistory");

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

    //get user payment history route is here
    app.get(
      "/userpaymenthistory",
      verifyToken,
      verifystudent,
      async (req, res) => {
        try {
          const studentEmail = req.query.email;
          const result = await paymentHistory
            .find({ payEmail: studentEmail })
            .toArray();
          res.send(result);
        } catch (error) {
          console.log("userpayment histroy route is not working!");
        }
      }
    );

    //Popular class route is here
    app.get("/popularclass", async (req, res) => {
      try {
        const result = await classes
          .find()
          .limit(6)
          .sort({ TotalStudent: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.log("popular class route is not working!");
      }
    });

    // popular instractor route is here
    app.get("/popularinstractor", async (req, res) => {
      try {
        const result = await allusers
          .find({ role: "instractor" })
          .limit(6)
          .sort({ student: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.log("popular class route is not working!");
      }
    });

    // Loadalluser for admin panel
    app.get(
      "/allusermanagement",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await allusers.find().toArray();
          res.send(result);
        } catch (error) {
          console.log("all user load for admin route is not working!");
        }
      }
    );

    // Load all classes route is here
    app.get("/loadallclasses", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const result = await classes.find().toArray();
        res.send(result);
      } catch (error) {}
    });
    // Load all approve classes route is here
    app.get("/loadallapproveclasses", async (req, res) => {
      try {
        const query = { status: "Approve" };
        const result = await classes.find(query).toArray();
        res.send(result);
      } catch (error) {}
    });

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
    app.get("/instractorclass", verifyToken, async (req, res) => {
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

    // handle user role for admin panel route is here
    app.post("/handleuserrole", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const id = req.query.id;
        const newrole = req.query.role;
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            role: newrole,
          },
        };
        const result = await allusers.updateOne(query, update);
        res.send(result);
      } catch (error) {
        console.log("update user role by admin route is not working!");
      }
    });

    // Classes status change by admin route is here
    app.post(
      "/changeclassstatus",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const data = req.body;
          const query = { _id: new ObjectId(data.id) };
          const updateDoucment = {
            $set: {
              status: data.status,
            },
          };
          const result = await classes.updateOne(query, updateDoucment);
          res.send(result);
        } catch (error) {
          console.log("Change class status by admin is not working!");
        }
      }
    );

    // class feedback post by admin route is here
    app.post(
      "/setfeedbackadmin",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const feedback = req.query.Feedback;
          const id = req.query.id;
          const query = { _id: new ObjectId(id) };
          const updateDoucment = {
            $set: {
              Feedback: feedback,
            },
          };
          const result = await classes.updateOne(query, updateDoucment);
          res.send(result);
        } catch (error) {
          console.log("set Feedback by admin route is not working!");
        }
      }
    );

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
    app.post(
      "/updateclassbyinstractor",
      verifyToken,
      verifyinstractor,
      async (req, res) => {
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
      }
    );

    // Delete single class route is here
    app.delete(
      "/deleteclass",
      verifyToken,
      verifyinstractor,
      async (req, res) => {
        try {
          const id = req.query.id;
          const result = await classes.deleteOne({ _id: new ObjectId(id) });
          res.send(result);
        } catch (error) {
          console.log("Delete route is not working!");
        }
      }
    );

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
    app.post(
      "/createnewclass",
      verifyToken,
      verifyinstractor,
      async (req, res) => {
        try {
          const newClass = req.body;
          const result = await classes.insertOne(newClass);
          res.send(result);
        } catch (error) {
          console.log("Create new user route working failed");
        }
      }
    );

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

    // create payment route is here
    app.post(
      "/createpaymentintent",
      verifyToken,
      verifystudent,
      async (req, res) => {
        try {
          const { price } = req.body;
          const amounts = parseInt(price * 100);
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amounts,
            currency: "usd",
            payment_method_types: ["card"],
          });
          res.send({
            clientSecret: paymentIntent.client_secret,
          });
        } catch (error) {
          console.log("payment intent route is not working!");
        }
      }
    );

    // add student payment history route is here
    app.post(
      "/createpaymenthistory",
      verifyToken,
      verifystudent,
      async (req, res) => {
        try {
          const data = req.body;
          const result = await paymentHistory.insertOne(data);
          res.send(result);
        } catch (error) {
          console.log("create payment history is not working!");
        }
      }
    );

    // update class after payment route is here
    app.post(
      "/updateclassafterpayment",
      verifyToken,
      verifystudent,
      async (req, res) => {
        try {
          const id = req.query.id;
          const updateclass = await classes.findOne({ _id: new ObjectId(id) });
          const newseats = updateclass.aviableseats - 1;
          const newtotalstudent = updateclass.TotalStudent + 1;
          const query = { _id: new ObjectId(id) };
          const updatedocument = {
            $set: {
              aviableseats: newseats,
              TotalStudent: newtotalstudent,
            },
          };
          const result = await classes.updateOne(query, updatedocument);
          res.send(result);
        } catch (error) {
          console.log("update class after paying is not working!");
        }
      }
    );

    // update instractor after payment student
    app.patch("/updatestudentinstractor", async (req, res) => {
      try {
        const instractoremail = req.query.email;
        const instractor = await allusers.findOne({ email: instractoremail });
        const query = { email: instractoremail };
        const option = { upset: true };
        const updatestudent = {
          $set: {
            student: instractor.student + 1,
          },
        };
        const result = await allusers.updateOne(query, updatestudent, option);
        res.send(result);
      } catch (error) {
        console.log("update instractor student route is not working!");
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
