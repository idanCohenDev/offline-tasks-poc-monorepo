import { Request, Response, Router } from "express";
import { Record } from "../models/Record";
import { CreateRecordDTO } from "../types";

const router = Router();

router.post("/records", async (req: Request<{}, {}, CreateRecordDTO>, res: Response) => {
  try {
    const { value, metadata } = req.body;

    if (!value) {
      return res.status(400).json({ error: "Value is required" });
    }

    const record = new Record({
      value,
      metadata: metadata || {},
      timestamp: new Date(),
    });

    const savedRecord = await record.save();

    res.status(201).json({
      success: true,
      data: savedRecord,
      message: "Record saved successfully",
    });
  } catch (error) {
    console.error("Error saving record:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save record",
    });
  }
});

export default router;
