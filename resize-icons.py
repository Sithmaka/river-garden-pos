#!/usr/bin/env python3
"""
Icon Resizer Script for CodeBell POS PWA
Automatically resizes logo1.png to all required icon sizes
"""

from PIL import Image
import os

# Define icon sizes needed
ICONS = {
    'icon-192x192.png': (192, 192),
    'icon-512x512.png': (512, 512),
    'apple-touch-icon.png': (180, 180),
}

def resize_icons():
    # Paths
    source_image = 'public/logo1.png'
    icons_dir = 'public/icons'
    
    # Check if source image exists
    if not os.path.exists(source_image):
        print(f"❌ Error: {source_image} not found!")
        return False
    
    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)
    
    try:
        # Open source image
        img = Image.open(source_image)
        print(f"✓ Opened: {source_image}")
        print(f"  Original size: {img.size}")
        
        # Resize to each required size
        for filename, size in ICONS.items():
            output_path = os.path.join(icons_dir, filename)
            
            # Use high-quality resampling
            resized = img.resize(size, Image.Resampling.LANCZOS)
            
            # Save with high quality
            resized.save(output_path, 'PNG', quality=95)
            print(f"✓ Created: {filename} ({size[0]}×{size[1]})")
        
        print("\n✅ All icons created successfully!")
        print(f"📁 Location: {os.path.abspath(icons_dir)}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    resize_icons()
