from PIL import Image, ImageDraw, ImageFont
import os

# Create a simple test image
img = Image.new('RGB', (400, 300), color='white')
draw = ImageDraw.Draw(img)

# Draw a colorful pattern
draw.rectangle([50, 50, 150, 150], fill='red')
draw.rectangle([200, 50, 300, 150], fill='blue')
draw.rectangle([125, 150, 225, 250], fill='green')

# Add text
try:
    draw.text((150, 20), "Test Image", fill='black')
except:
    pass  # Font not available

# Save to frontend fixtures
output_dir = os.path.join(os.path.dirname(__file__), '..', 'fronted', 'e2e', 'fixtures')
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, 'test-image.png')
img.save(output_path, 'PNG')
print(f"Test image created at: {output_path}")
