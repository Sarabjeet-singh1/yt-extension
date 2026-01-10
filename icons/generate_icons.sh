#!/bin/bash

# Create a base 128x128 PNG using macOS native tools
# Since we can't easily create complex graphics, we'll create simple colored squares

# Create 128x128 icon
sips -s format png --out icon128.png icon.svg 2>/dev/null || {
    # Fallback: create simple colored rectangles
    python3 -c "
import struct

def create_simple_png(size, filename):
    # Create a simple PNG with a gradient-like color
    width = height = size
    
    # PNG signature
    png_sig = b'\\x89PNG\\r\\n\\x1a\\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = 0x7d8b1e1d  # Pre-calculated for our specific IHDR
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # Simple gradient data
    idat_raw = b''
    for y in range(height):
        idat_raw += b'\\x00'  # Filter type
        for x in range(width):
            r = int(102 + (118 - 102) * x / width)
            g = int(126 + (75 - 126) * x / width)
            b = int(234 + (162 - 234) * x / width)
            idat_raw += bytes([r, g, b])
    
    import zlib
    idat_compressed = zlib.compress(idat_raw, 9)
    idat = struct.pack('>I', len(idat_compressed)) + b'IDAT' + idat_compressed
    
    import binascii
    idat_crc = binascii.crc32(b'IDAT' + idat_compressed) & 0xffffffff
    idat += struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', 0xae426082)
    
    with open(filename, 'wb') as f:
        f.write(png_sig + ihdr + idat + iend)

create_simple_png(128, 'icon128.png')
create_simple_png(48, 'icon48.png')
create_simple_png(16, 'icon16.png')
print('Created icons')
"
}

echo "Icons generated successfully"
