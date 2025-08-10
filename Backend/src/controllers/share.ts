import type { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../model/userschema.js';
import { Link } from '../model/linkSchema.js';
import { Content } from '../model/contentschema.js';

const shareBodySchema = z.object({
  share: z.coerce.boolean()
});

export const toggleSharing = async (req: Request, res: Response) => {
  const parsedShare = shareBodySchema.safeParse(req.body);
  if (!parsedShare.success) {
    return res.status(400).send({ message: "The 'share' property must be a boolean (true or false)" });
  }

  const userId = (req as any).userId;
  const { share } = parsedShare.data;

  try {
    if (share) {
      let link = await Link.findOne({ userId });
      if (!link) {
        const hashedLink = crypto.randomBytes(8).toString("hex");
        link = await Link.create({ hashedLink, userId });
      }

      await User.findByIdAndUpdate(userId, { shareEnabled: true });
      
      return res.status(200).json({
        link: `${req.protocol}://${req.get("host")}/api/v1/brain/${link.hashedLink}`
      });
    } else {
      
      await User.findByIdAndUpdate(userId, { shareEnabled: false });
      await Link.deleteOne({ userId });
      
      return res.status(200).json({ message: "Sharing disabled successfully" });
    }
  } catch (error) {
    console.error("Error toggling sharing status:", error);
    res.status(500).send({ message: "Server error while updating sharing status" });
  }
};

export const getSharedBrain = async (req: Request, res: Response) => {
  try {
    const { shareLink } = req.params;
    const linkDoc = await Link.findOne({ hashedLink: shareLink }).populate('userId', 'username shareEnabled');

    if (!linkDoc || !linkDoc.userId) {
      return res.status(404).send({ message: "Invalid or expired share link" });
    }

    const user = linkDoc.userId as any; 
    if (!user.shareEnabled) {
      return res.status(403).send({ message: "The user has disabled sharing for this link" });
    }

    const contents = await Content.find({ userId: user._id }).populate('tags', 'title').lean();
    
    return res.status(200).json({
      username: user.username,
      content: contents.map(c => ({
        id: c._id,
        type: c.type,
        link: c.link,
        title: c.title,
        tags: (c.tags as any[])?.map(t => t.title) || []
      }))
    });
  } catch (error) {
    console.error("Error fetching shared brain:", error);
    res.status(500).send({ message: "Server error while fetching shared content" });
  }
};