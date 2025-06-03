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

const joinMp3FilesWithSprite = async (
  inputDir,
  outputDir,
  outputPath,
  spritePath
) => {
  try {
    const fileNames = fs
      .readdirSync(outputDir)
      .filter((f) => f.toLowerCase().endsWith(".mp3"))
      .sort((a, b) => a.localeCompare(b));

    if (fileNames.length === 0) {
      console.warn("No MP3 files to join.");
      return;
    }

    let spriteMap = {};
    let currentStart = 0;

    const command = ffmpeg();

    for (const fileName of fileNames) {
      const fullPath = path.join(outputDir, fileName);
      command.input(fullPath);

      const id = path.parse(fileName).name.replaceAll("-", "_");
      const duration = await getDuration(fullPath);
      const effectiveDuration = await getDuration(
        path.join(inputDir, fileName)
      );

      spriteMap[id] = [Math.ceil(currentStart), Math.ceil(effectiveDuration)];

      currentStart += duration; // round to next full second
    }

    const audioInputs = fileNames.map((_, i) => `[${i}:a]`).join("");
    const concatFilter = `${audioInputs}concat=n=${fileNames.length}:v=0:a=1[outa]`;

    command
      .complexFilter([concatFilter])
      .outputOptions(["-map", "[outa]"])
      .on("end", () => {
        fs.writeFileSync(spritePath, JSON.stringify(spriteMap, null, 2));
        console.log(`✅ Joined MP3 saved to: ${outputPath}`);
        console.log(`✅ Sprite map saved to: ${spritePath}`);
      })
      .on("error", (err, stdout, stderr) => {
        console.error("❌ Error joining MP3 files:");
        console.error(stderr);
      })
      .save(outputPath);
  } catch (err) {
    console.error("❌ Failed to join and sprite:", err);
  }
};

// Input and output folder paths
const inputFolderPath = "./sounds"; // Path to the "sounds" folder
const outputFolderPath = "./normalized"; // Path to the "normalized" folder
const joinedFilePath = "./results/sound_effects.mp3"; // Path to the "normalized" folder
const spritePath = "./results/spritemap.json";

// After normalization is done:
joinMp3FilesWithSprite(
  inputFolderPath,
  outputFolderPath,
  joinedFilePath,
  spritePath
);
