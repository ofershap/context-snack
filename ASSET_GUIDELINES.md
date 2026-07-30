# 🎭 Mood Reaction Assets Guide

## 📁 File Structure

Place your asset files in the following structure:

```
assets/
└── reactions/
    ├── magic/
    │   ├── animation.gif  (primary - animated magic GIF)
    │   ├── image.png      (fallback - static magic image)
    │   └── sound.mp3      (magic sound effect)
    └── angry/
        ├── animation.gif  (primary - animated angry face)
        ├── image.png      (fallback - static angry image)
        └── sound.mp3      (angry voice/sound)
```

## 📐 Asset Specifications

### 🎬 Animation Files (animation.gif)
- **Format**: GIF (animated)
- **Recommended Size**: 400x300px to 600x400px
- **Duration**: 2-4 seconds (will loop automatically)
- **File Size**: Under 2MB for performance
- **Content**: 
  - **Magic**: Classic "magic hands" meme or sparkles animation
  - **Angry**: Animated angry face or rage reaction

### 🖼️ Image Files (image.png)
- **Format**: PNG (static fallback)
- **Size**: Same as GIF dimensions
- **Quality**: High resolution, transparent background preferred
- **Content**: Static version of the animation

### 🔊 Sound Files (sound.mp3)
- **Format**: MP3
- **Duration**: 1-3 seconds
- **Quality**: 128kbps or higher
- **Volume**: Normalized (not too loud/quiet)
- **Content**:
  - **Magic**: Magical sound effect, chime, or "ta-da!" sound
  - **Angry**: Angry voice, groan, or frustration sound

## 🎯 Recommended Sources

### For Magic Reaction:
- **GIF**: Search "magic hands meme gif" or "sparkles animation"
- **Sound**: Magical chime, fairy sound, or classic "ta-da!"

### For Angry Reaction:
- **GIF**: Animated angry face, rage meme, or frustration animation
- **Sound**: Record yourself saying "AAARRRGHHH!" or use frustration sound effects

## 🚀 How It Works

1. **Click** the "🎭 Mood" button in status bar
2. **Choose** your reaction from dropdown:
   - ✨ Magic! (when something works perfectly)
   - 😠 Angry (when AI pisses you off)
3. **Watch** the animated reaction in a popup window
4. **Hear** the sound effect automatically
5. **Auto-closes** after 5 seconds

## 📝 File Naming (Important!)

Files MUST be named exactly:
- `animation.gif` (not Animation.gif or magic.gif)
- `image.png` (not Image.png or fallback.png)  
- `sound.mp3` (not Sound.mp3 or audio.mp3)

## 🔄 Adding New Reactions

To add more reactions later:

1. Create new folder: `assets/reactions/yourReaction/`
2. Add the 3 files: `animation.gif`, `image.png`, `sound.mp3`
3. Edit `src/moodReactionProvider.ts` and add to the `reactions` array:

```typescript
{
    id: 'yourReaction',
    name: 'Your Reaction',
    emoji: '🎉',
    description: 'When something awesome happens!',
    hasAnimation: true,
    hasSound: true
}
```

## 🎪 Example Usage

**When AI gives you perfect code:**
→ Click "🎭 Mood" → "✨ Magic!" → See sparkles + hear magical sound

**When AI gives you garbage:**
→ Click "🎭 Mood" → "😠 Angry" → See angry face + hear frustration sound

## 📋 Fallback Behavior

- If `animation.gif` not found → tries `image.png`
- If `image.png` not found → shows emoji fallback
- If `sound.mp3` not found → plays system beep
- Always shows reaction even without assets!



