import dotenv from 'dotenv';
import { join } from "path";
dotenv.config({ path: join(process.cwd(), '.env') });

//Express server setup
import express from 'express';
import type { Request, Response } from 'express';

//DB connection setup
import mongoose from 'mongoose';
import { User } from './model/userschema.js' ;
import { Content, contentType } from './model/contentschema.js';
import { Link } from './model/linkSchema.js';
import { Tag } from './model/tagschema.js';
import { authenticateToken } from './middleware/userMiddleware.js';

//Auth and user validation setup
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';

//For FE BE connection establishment
import cors from 'cors';

//JWT_SECTRET management // It is a chatgpt code due to error in my implementation
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
}


const port = process.env.PORT || 4000;

const app = express();
app.use(express.json());
app.use(cors());

async function connectToDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToDatabase();

app.post('/api/v1/signup/', async (req: Request, res: Response) => {
  const requiredBody = z.object({
    username: z.string().min(3, "Username too short"),
    email: z.string().trim().email("Invalid Email"),
    password: z.string().min(8, "Password too short").max(100)
  })

  const parsedBody = requiredBody.safeParse(req.body);
   if(!parsedBody.success) {
    res.status(400).send("Incorrect Format");
    return;
  }
  const { username, email, password } = parsedBody.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
        username: username,
        email: email,
        password: hashedPassword
  });

    res.status(200).send({ message: "You are Signed Up" });
})

app.post('/api/v1/signin/', async (req: Request, res: Response) =>{
  const email = req.body.email;
  const password = req.body.password;
  
  if (!email || !password) {
            return res.status(401).json({
                msg: "Email & Password is Required"
            })
        }

  const matchedUser = await User.findOne({email: email});
  if(!matchedUser){
     res.status(403).send({message: "The user does not exist"});
  }
  //@ts-ignore
  const matchedPassword = await bcrypt.compare(password, matchedUser.password);
  if(matchedPassword){
        const token = jwt.sign({
            //@ts-ignore
            id: matchedUser._id.toString() //payload bar bar bhule jachhi
        }, getJwtSecret())
        res.status(200).send({ message: "You are Signed In", token: token })
    } else {
        res.status(403).send({ message: "Invalid credentials" })
    }

})

app.post('/api/v1/content/', authenticateToken, async (req: Request, res: Response) => {
    const contentbody = z.object({
      title: z.string().min(5, "Title is too short"),
      link: z.string().url(),
      type: z.enum(contentType)
    })

    const parsedContent = contentbody.safeParse(req.body);
    if(!parsedContent.success){
      res.status(400).send({ message: "Please fill up correctly" })
      return;
    }

    const { title, link, type } = parsedContent.data;
    await Content.create({
      title: title,
      link: link,
      type: type,
      tag : [],
      //@ts-ignore
      userId: req.userId //To simulate Foreign relation in Mongo 
    })

    res.status(201).send({ message: "Content created successfully" })
})

app.get('/api/v1/getcontent/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).send({ message: "User ID missing from request" });
    }

    const contents = await Content.find( {userId} ).populate('userId', 'username').populate('tags'); 

    res.status(200).send({
      message: "Content fetched successfully",
      data: contents
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).send({ message: "Server error while fetching content" });
  }
})

app.delete('/api/v1/deletecontent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).send({ message: "User ID missing from request" });

    const { contentId } = req.body;    
    if (!contentId) return res.status(400).send({ message: "contentId required in body" });

    const result = await Content.deleteOne({ _id: contentId, userId });
    if (result.deletedCount === 0) return res.status(404).send({ message: "Not found or not authorized" });

    return res.status(200).send({ message: "Content deleted successfully" });
  } catch (e) {
    console.error("Error deleting content:", e);
    return res.status(500).send({ message: "Server error while deleting content" });
  }
})

app.post("/api/v1/brain/share", authenticateToken, async (req, res) => {
  const shareBody = z.object({
    share: z.coerce.boolean()
  });

  const parsedShare = shareBody.safeParse(req.body);
  if (!parsedShare.success) {
    return res.status(400).send({ message: "share must be true or false" });
  }

  const { share } = parsedShare.data;
  const userId = (req as any).userId;

  try {
    if (share) {
      let existingLink = await Link.findOne({ userId });
      if (!existingLink) {
        const hashedLink = crypto.randomBytes(8).toString("hex");
        existingLink = await Link.create({ hashedLink, userId });
      }

      await User.findByIdAndUpdate(userId, { shareEnabled: true });

      return res.status(200).send({
        link: `${req.protocol}://${req.get("host")}/api/v1/brain/${existingLink.hashedLink}`
      });
    } else {
      await User.findByIdAndUpdate(userId, { shareEnabled: false });
      await Link.deleteOne({ userId });

      return res.status(200).send({ message: "Sharing disabled" });
    }
  } catch (error) {
    console.error("Error sharing brain:", error);
    res.status(500).send({ message: "Server error while sharing brain" });
  }
})

app.get('/api/v1/brain/:shareLink', async (req, res) => {
  const { shareLink } = req.params;

  try {
    const linkDoc = await Link.findOne({ hashedLink: shareLink })
      .populate<{ userId: { username: string; _id: string; shareEnabled: boolean } }>(
        'userId',
        'username shareEnabled'
      );

    if (!linkDoc) {
      return res.status(404).send({ message: "Invalid share link" });
    }

    if (!linkDoc.userId.shareEnabled) {
      return res.status(403).send({ message: "Sharing is disabled for this user" });
    }

    const contents = await Content.find({ userId: linkDoc.userId._id })
      .populate('tags', 'title')
      .lean();

    return res.status(200).send({
      username: linkDoc.userId.username,
      content: contents.map(c => ({
        id: c._id,
        type: c.type,
        link: c.link,
        title: c.title,
        tags: c.tags?.map((t: any) => t.title) || []
      }))
    });
  } catch (error) {
    console.error("Error fetching shared brain:", error);
    res.status(500).send({ message: "Server error while fetching brain" });
  }
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})