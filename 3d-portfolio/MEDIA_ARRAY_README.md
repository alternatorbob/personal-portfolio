# Media Array Structure

This document explains how to use the new `media` array structure to control the order of media items in project galleries.

## Overview

The new `media` array allows you to specify the exact order in which images, videos, and other media should appear in the project gallery, rather than having them automatically grouped by type (images first, then videos, then gifs).

## How It Works

### New Structure
```json
{
  "title": "Project Title",
  "content": {
    "media": [
      "/projects/project/image1.webp",
      "<iframe src=\"https://player.vimeo.com/video/...\"></iframe>",
      "/projects/project/video.mp4",
      "/projects/project/image2.webp",
      "/projects/project/image3.webp"
    ]
  }
}
```

### Legacy Structure (Still Supported)
```json
{
  "title": "Project Title", 
  "content": {
    "images": ["/projects/project/image1.webp", "/projects/project/image2.webp"],
    "videos": ["/projects/project/video.mp4", "<iframe src=\"...\"></iframe>"],
    "gifs": ["/projects/project/animation.gif"]
  }
}
```

## Media Type Detection

The system automatically detects media types based on file extensions and content:

- **Images**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, etc.
- **Videos**: `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`
- **GIFs**: `.gif`
- **Iframes**: Content starting with `<iframe` (Vimeo embeds)

## Examples

### Simple Ordering
```json
"media": [
  "/projects/project/cover.webp",
  "/projects/project/video.mp4",
  "/projects/project/details.webp"
]
```

### Mixed Media with Custom Order
```json
"media": [
  "/projects/project/cover.webp",
  "<iframe src=\"https://player.vimeo.com/video/123456\" frameborder=\"0\"></iframe>",
  "/projects/project/image1.webp",
  "/projects/project/image2.webp",
  "/projects/project/demo.mp4",
  "/projects/project/final.webp"
]
```

## Benefits

1. **Custom Ordering**: Mix images, videos, and iframes in any order you want
2. **Backward Compatibility**: Old structure still works if no `media` array is provided
3. **Automatic Type Detection**: No need to specify media types in the JSON
4. **Clean JSON**: Simpler structure without separate arrays for each media type

## Migration

To migrate existing projects:

1. Create a `media` array in the `content` object
2. List all media items in the desired order
3. Keep the old `images`, `videos`, and `gifs` arrays for backward compatibility
4. The system will use the `media` array if present, otherwise fall back to the old structure

## Notes

- The system will automatically detect media types, so you don't need to specify them
- All existing functionality (preloading, video optimization, etc.) works with the new structure
- The old structure remains fully supported for backward compatibility 