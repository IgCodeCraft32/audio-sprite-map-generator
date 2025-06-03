# Audio SpriteMap Generator

This is a audio spriteMap generator for usesound package by using ffmpeg

## How to use

1. npm install
2. copy audio files to ./sounds folder
3. node .\normalize.mjs
   normalize sounds/\*.mp3 and save them in normalized folder
4. node .\merge_spritemap.mjs
   merge the normalized mp3 files and generate sprite in results folder
