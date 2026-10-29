import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
app.use(cors());
app.use(express.json());

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  console.log(authHeader, "auth header is...");

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  console.log(token, "without bearer token is");

  const JWKS = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks"),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    // console.log(payload, "the payload is...");
    next();
  } catch (error) {
    return res.status(500).send({msg: 'The token is not verifyed, Internal Server Error!'})
  }
};

const PORT = 5000;
// http:localhost:5000
app.get("/", (req, res) => {
  res.send({ message: "server is running fine!" });
});

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("wanderlastDB");
const destinationCollection = db.collection("destination");
const bookingCollection = db.collection("bookings");

// add-destination:post-api
app.post("/add-destination",verifyToken, async (req, res) => {
  const data = req.body;
  const result = await destinationCollection.insertOne(data);
  console.log(result);
  res.send(result);
});
// get api:
app.get("/all-destination", async (req, res) => {
  const result = await destinationCollection.find({}).toArray();
  res.send(result);
});
// destinationId detail page api:
app.get("/all-destination/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const result = await destinationCollection.findOne({
    _id: new ObjectId(id),
  });
  // console.log(result);
  res.send(result);
});
// destination updated api:
app.patch("/all-destination/:id",verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { _id, ...updatedData } = req.body; // ekhane _id, ...updateData mane _id ta destructure kroe then bad deya holo, causes mongoDB _id change korbe na!
    const result = await destinationCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData },
    );
    res.json(result);
    // console.log(result, "updated data");
  } catch (error) {
    res.status(500).json({
      message: "Failed to update destination!",
    });
  }
});
// delete destination api:
app.delete("/all-destination/:id",verifyToken, async (req, res) => {
  const id = req.params.id;
  const result = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);

  console.log(result, "delete for server");
});

// booking collection api:
// post api:
app.post("/bookings", async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  res.send(result);
});
// my-bookinsg get api:
app.get("/my-bookings/:email",verifyToken, async (req, res) => {
  const email = req.params.email;
  const result = await bookingCollection.find({ email: email }).toArray();
  res.send(result);
  // console.log(result);
});
// delete my-booking data api:
app.delete("/my-bookings/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookingCollection.deleteOne({ _id: id }); // objectId korlam na causes mongodb te jodi objectId thake tahole objectId diye access korte hobe r string akare thakle string diye access korte hobe;
  res.send(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
