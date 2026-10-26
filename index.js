import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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

// add-destination:post-api
app.post("/add-destination", async (req, res) => {
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
app.get("/all-destination/:id", async (req, res) => {
  const id = req.params.id;
  const result = await destinationCollection.findOne({ _id: new ObjectId(id) });
  // console.log(result);
  res.send(result);
});
// destination updated api:
app.patch("/all-destination/:id", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
