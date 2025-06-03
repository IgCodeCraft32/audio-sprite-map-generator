import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

const getDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath).ffprobe((err, metadata) => {
      if (err) {
        return reject(err);
      }
      const duration = metadata.format.duration * 1000; // Convert to milliseconds
      resolve(duration);
    });
  });
};

/**
 * Normalizes an MP3 file to a common bitrate and format.
 * @param {string} filePath - The path to the MP3 file.
 * @param {string} outputPath - The path to save the normalized MP3 file.
 * @returns {Promise<string>} - The path to the normalized MP3 file.
 */
const normalizeMp3File = (filePath, outputPath, duration) => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .audioCodec("libmp3lame") // Use the MP3 codec
      .audioChannels(1) // Use the MP3 codec
      .audioBitrate("128k") // Set desired bitrate (128 kbps)
      .format("mp3") // Ensure it's in MP3 format
      .outputOptions([
        "-af",
        "apad", // Append silence (padding)
        "-t",
        duration, // Set the duration explicitly
      ])
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath); // Save to the output path
  });
};

/**
 * Normalize all MP3 files in the inputFolderPath folder and save them in the outputFolderPath folder.
 * @param {string} inputFolderPath - The path to the inputFolderPath folder.
 * @param {string} outputFolderPath - The path to the outputFolderPath folder.
 */
const normalizeMp3FilesInFolder = async (inputFolderPath, outputFolderPath) => {
  try {
    // Ensure the output folder exists
    if (!fs.existsSync(outputFolderPath)) {
      fs.mkdirSync(outputFolderPath, { recursive: true });
    }

    // Get all MP3 files from the inputFolderPath folder
    const files = fs
      .readdirSync(inputFolderPath)
      .filter((file) => path.extname(file).toLowerCase() === ".mp3") // Only MP3 files
      .map((file) => path.join(inputFolderPath, file)); // Get full path for each file

    if (files.length === 0) {
      console.log("No MP3 files found in the folder.");
      return;
    }

    console.log("Normalizing MP3 files...");

    // Process each MP3 file
    for (const file of files) {
      const outputFilePath = path.join(outputFolderPath, path.basename(file));

      const duration = await getDuration(file);
      await normalizeMp3File(file, outputFilePath, Math.ceil(duration / 1000));
      const duration2 = await getDuration(outputFilePath);
      console.log(file, duration, duration2);
      // console.log(
      //   `Normalized: ${path.basename(file)} -> ${path.basename(outputFilePath)}`
      // );
    }

    console.log("All MP3 files have been normalized.");
  } catch (error) {
    console.error("Error normalizing MP3 files:", error);
  }
};

// Input and output folder paths
const inputFolderPath = "./sounds"; // Path to the "sounds" folder
const outputFolderPath = "./normalized"; // Path to the "normalized" folder

// Normalize MP3 files in the inputFolderPath folder and save them to the outputFolderPath folder
normalizeMp3FilesInFolder(inputFolderPath, outputFolderPath);
