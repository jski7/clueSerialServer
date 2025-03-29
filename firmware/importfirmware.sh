#!/bin/bash

# Define source and destination paths
SRC="/Users/elektrojakub/Desktop/_PROJECTS/CLUE/_CODE/clue. - lamp code/.pio/build/clue_esp32s3"
DEST="/Users/elektrojakub/Desktop/_PROJECTS/CLUE/_CODE/clueSerialServer/firmware"

# Create destination directory if it doesn't exist
mkdir -p "$DEST"

# List of files to copy
FILES=("firmware.bin" "bootloader.bin" "partitions.bin")

# Copy each file
for FILE in "${FILES[@]}"; do
    cp "$SRC/$FILE" "$DEST"
    echo "Copied $FILE to $DEST"
done
