# ================================
# FASTAPI BACKEND FOR IMAGE ENHANCER
# ================================

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from enhance import ProfessionalImageEnhancer
import uvicorn
import io

# Initialize FastAPI app
app = FastAPI(
    title="Image Enhancer Pro API",
    description="Professional Image Enhancement Service with 2X/4X/8X Super Resolution",
    version="2.1.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://image-enhancer.vercel.app",  # Your Vercel URL
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize enhancer
enhancer = ProfessionalImageEnhancer()

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "🚀 Image Enhancer Pro API is running!",
        "version": "2.1.0",
        "features": {
            "sharpness": "Adjust image sharpness (0.5-3.0)",
            "contrast": "Adjust image contrast (0.5-2.0)",
            "brightness": "Adjust image brightness (0.5-2.0)",
            "color": "Adjust color saturation (0.5-2.0)",
            "denoise": "Remove noise from images",
            "super_resolution": "2X, 4X, or 8X upscaling"
        },
        "endpoints": {
            "GET /health": "Check API health",
            "POST /enhance": "Basic enhancement",
            "POST /enhance-advanced": "Advanced enhancement with controls"
        }
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "image-enhancer", "version": "2.1.0"}

# Basic enhancement endpoint
@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    """
    Basic enhancement with default settings
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Read image
        image_bytes = await file.read()
        
        # Apply basic enhancement
        enhanced_bytes = enhancer.enhance_image(image_bytes)
        
        # Return enhanced image
        return StreamingResponse(
            io.BytesIO(enhanced_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=enhanced_{file.filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(500, f"Enhancement failed: {str(e)}")

# Advanced enhancement endpoint
@app.post("/enhance-advanced")
async def enhance_image_advanced(
    file: UploadFile = File(...),
    sharpness: float = 2.0,
    contrast: float = 1.2,
    brightness: float = 1.1,
    color: float = 1.1,
    denoise: bool = False,
    super_resolution: int = 1
):
    """
    Advanced enhancement with customizable parameters
    
    Parameters:
    - sharpness: 0.5 to 3.0 (default: 2.0)
    - contrast: 0.5 to 2.0 (default: 1.2)
    - brightness: 0.5 to 2.0 (default: 1.1)
    - color: 0.5 to 2.0 (default: 1.1)
    - denoise: Enable noise reduction (default: False)
    - super_resolution: 1 (no scaling), 2 (2x), 4 (4x), or 8 (8x) (default: 1)
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Validate super_resolution parameter
        if super_resolution not in [1, 2, 4, 8]:
            raise HTTPException(400, "super_resolution must be 1, 2, 4, or 8")
        
        # Validate other parameters
        if sharpness < 0.5 or sharpness > 3.0:
            raise HTTPException(400, "sharpness must be between 0.5 and 3.0")
        if contrast < 0.5 or contrast > 2.0:
            raise HTTPException(400, "contrast must be between 0.5 and 2.0")
        if brightness < 0.5 or brightness > 2.0:
            raise HTTPException(400, "brightness must be between 0.5 and 2.0")
        if color < 0.5 or color > 2.0:
            raise HTTPException(400, "color must be between 0.5 and 2.0")
        
        # Read image
        image_bytes = await file.read()
        
        # Create config
        config = {
            "sharpness": sharpness,
            "contrast": contrast,
            "brightness": brightness,
            "color": color,
            "denoise": denoise,
            "super_resolution": super_resolution
        }
        
        # Apply enhancement
        enhanced_bytes = enhancer.enhance_image(image_bytes, config)
        
        # Return enhanced image
        return StreamingResponse(
            io.BytesIO(enhanced_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=enhanced_{super_resolution}x_{file.filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Enhancement failed: {str(e)}")

# Image info endpoint
@app.post("/image-info")
async def get_image_info(file: UploadFile = File(...)):
    """Get information about the uploaded image"""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        image_bytes = await file.read()
        info = enhancer.get_image_info(image_bytes)
        
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "size_bytes": len(image_bytes),
            "image_info": info
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error getting image info: {str(e)}")

# Run the application
if __name__ == "__main__":
    print("🚀 Starting Image Enhancer Pro API v2.1.0...")
    print("📡 Server running at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("⚠️  Press Ctrl+C to stop the server")
    print("\n🌟 Features:")
    print("  • Sharpness, Contrast, Brightness, Color controls")
    print("  • Noise reduction")
    print("  • 2X, 4X, 8X Super Resolution")
    print("=" * 50)
    
    # Run uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )