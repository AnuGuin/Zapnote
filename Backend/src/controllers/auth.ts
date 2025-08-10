import type { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../model/userschema.js';
import { getJwtSecret } from '../config/jwtconnect.js';


const signupBodySchema = z.object({
  username: z.string().min(3, "Username too short"),
  email: z.string().trim().email("Invalid Email"),
  password: z.string().min(8, "Password too short").max(100)
});

export const signup = async (req: Request, res: Response) => {
  const parsedBody = signupBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ message: "Incorrect Format", errors: parsedBody.error.flatten() });
  }

  try {
    const { username, email, password } = parsedBody.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: "You are Signed Up" });
  } catch (error: any) {
    if (error.code === 11000) { // Handle duplicate key error
      return res.status(409).json({ message: "Username or email already exists." });
    }
    res.status(500).json({ message: "Server error during signup." });
  }
};



export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Email & Password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(403).json({ message: "The user does not exist" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch) {
      const token = jwt.sign({ id: user._id.toString() }, getJwtSecret());
      return res.status(200).json({ message: "You are Signed In", token });
    } else {
      return res.status(403).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Server error during signin." });
  }
};



