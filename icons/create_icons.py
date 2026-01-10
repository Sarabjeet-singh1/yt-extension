from PIL import Image, ImageDraw

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    draw.rounded_rectangle([(0, 0), (size, size)], radius=size//5, fill='#667eea')
    
    arrow_width = size // 16
    arrow_start_y = size // 4
    arrow_end_y = int(size * 0.55)
    center_x = size // 2
    
    draw.rectangle([(center_x - arrow_width, arrow_start_y), (center_x + arrow_width, arrow_end_y)], fill='white')
    
    arrow_head_size = size // 8
    points = [
        (center_x, arrow_end_y),
        (center_x - arrow_head_size, arrow_end_y - arrow_head_size),
        (center_x + arrow_head_size, arrow_end_y - arrow_head_size)
    ]
    draw.polygon(points, fill='white')
    
    tray_y = int(size * 0.65)
    tray_height = size // 16
    tray_margin = size // 4
    draw.rounded_rectangle([(tray_margin, tray_y), (size - tray_margin, tray_y + tray_height)], radius=tray_height//2, fill='white')
    
    base_y = tray_y + tray_height
    base_height = size // 8
    draw.rectangle([(tray_margin, base_y), (tray_margin + size//20, base_y + base_height)], fill='white')
    draw.rectangle([(size - tray_margin - size//20, base_y), (size - tray_margin, base_y + base_height)], fill='white')
    
    return img

for size in [16, 48, 128]:
    icon = create_icon(size)
    icon.save(f'icon{size}.png')
    print(f'Created icon{size}.png')
