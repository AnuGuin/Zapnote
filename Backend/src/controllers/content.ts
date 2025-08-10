import type { Request, Response } from 'express';
import { z } from 'zod';
import { Content, contentType } from '../model/contentschema.js';

const contentBodySchema = z.object({
  title: z.string().min(5, "Title is too short"),
  link: z.string().url(),
  type: z.enum(contentType)
});

export const createContent = async (req: Request, res: Response) => {
  const parsedContent = contentBodySchema.safeParse(req.body);
  if (!parsedContent.success) {
    return res.status(400).json({ message: "Please fill up correctly", errors: parsedContent.error.flatten() });
  }

  try {
    const { title, link, type } = parsedContent.data;
    // Access userId using a type assertion
    const userId = (req as any).userId;
    
    await Content.create({ title, link, type, userId: userId, tags: [] });
    res.status(201).json({ message: "Content created successfully" });
  } catch (error) {
    console.error("Error creating content:", error);
    res.status(500).json({ message: "Server error while creating content" });
  }
};

export const getContent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const contents = await Content.find({ userId: userId }).populate('tags');
    res.status(200).json({
      message: "Content fetched successfully",
      data: contents
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Server error while fetching content" });
  }
};


export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.body;
    if (!contentId) {
      return res.status(400).json({ message: "contentId is required in the body" });
    }
    
    const userId = (req as any).userId;

    const result = await Content.deleteOne({ _id: contentId, userId: userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Content not found or you are not authorized to delete it" });
    }

    return res.status(200).json({ message: "Content deleted successfully" });
  } catch (e) {
    console.error("Error deleting content:", e);
    return res.status(500).json({ message: "Server error while deleting content" });
  }
};