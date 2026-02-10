"""
PROFESSIONAL IMAGE ENHANCEMENT MODULE
Traditional image processing without AI
Supports 2X, 4X, and 8X super resolution
"""

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import cv2
import numpy as np
from typing import Optional, Tuple
import io
import base64
import logging
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProfessionalImageEnhancer:
    """
    Professional image enhancer using traditional algorithms
    """
    
    def __init__(self):
        self.default_config = {
            "sharpness": 2.0,
            "contrast": 1.2,
            "brightness": 1.1,
            "color": 1.1,
            "denoise": False,
            "super_resolution": 1  # 1=no scaling, 2=2x, 4=4x, 8=8x
        }
    
    def enhance_image(self, image_bytes: bytes, config: Optional[dict] = None) -> bytes:
        """
        Main enhancement method with support for 2X, 4X, 8X super resolution
        """
        if config is None:
            config = self.default_config
            
        try:
            start_time = time.time()
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            original_size = image.size
            
            # Apply enhancements
            enhanced = image.copy()
            
            logger.info(f"Starting enhancement: {original_size[0]}x{original_size[1]}")
            
            # 1. Denoise (if enabled - do this first for best results)
            if config.get("denoise", False):
                enhanced = self._apply_denoise(enhanced)
                logger.info("Applied denoising")
            
            # 2. Sharpness
            if config.get("sharpness", 1.0) != 1.0:
                enhancer = ImageEnhance.Sharpness(enhanced)
                enhanced = enhancer.enhance(float(config["sharpness"]))
                logger.info(f"Applied sharpness: {config['sharpness']}x")
            
            # 3. Contrast
            if config.get("contrast", 1.0) != 1.0:
                enhancer = ImageEnhance.Contrast(enhanced)
                enhanced = enhancer.enhance(float(config["contrast"]))
                logger.info(f"Applied contrast: {config['contrast']}x")
            
            # 4. Brightness
            if config.get("brightness", 1.0) != 1.0:
                enhancer = ImageEnhance.Brightness(enhanced)
                enhanced = enhancer.enhance(float(config["brightness"]))
                logger.info(f"Applied brightness: {config['brightness']}x")
            
            # 5. Color
            if config.get("color", 1.0) != 1.0:
                enhancer = ImageEnhance.Color(enhanced)
                enhanced = enhancer.enhance(float(config["color"]))
                logger.info(f"Applied color: {config['color']}x")
            
            # 6. Super Resolution (2X, 4X, or 8X)
            super_res_factor = config.get("super_resolution", 1)
            if super_res_factor in [2, 4, 8]:
                enhanced = self._apply_super_resolution(enhanced, super_res_factor)
                new_size = enhanced.size
                logger.info(f"Applied {super_res_factor}X super resolution: {original_size} -> {new_size}")
            
            # 7. Final sharpening for super-resolved images
            if super_res_factor > 1:
                enhanced = self._apply_final_sharpening(enhanced)
                logger.info("Applied final sharpening")
            
            # Convert back to bytes
            buffer = io.BytesIO()
            
            # Use PNG format for lossless quality
            enhanced.save(buffer, format="PNG", optimize=True, quality=95)
            buffer.seek(0)
            
            processing_time = time.time() - start_time
            logger.info(f"Enhancement completed in {processing_time:.2f} seconds")
            
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Enhancement error: {e}")
            raise
    
    def _apply_denoise(self, image: Image.Image) -> Image.Image:
        """Apply OpenCV denoising if available"""
        try:
            # Convert PIL to OpenCV
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Apply advanced denoising
            denoised = cv2.fastNlMeansDenoisingColored(
                cv_image, None, 10, 10, 7, 21
            )
            
            # Convert back to PIL
            return Image.fromarray(cv2.cvtColor(denoised, cv2.COLOR_BGR2RGB))
        except Exception as e:
            logger.warning(f"OpenCV denoising failed: {e}")
            # Fallback to PIL filter with multiple passes
            return image.filter(ImageFilter.SMOOTH_MORE).filter(ImageFilter.SMOOTH)
    
    def _apply_super_resolution(self, image: Image.Image, scale_factor: int) -> Image.Image:
        """
        Apply super resolution with different interpolation methods
        scale_factor: 2, 4, or 8
        """
        width, height = image.size
        new_size = (width * scale_factor, height * scale_factor)
        
        # Choose interpolation method based on scale factor
        if scale_factor == 2:
            # For 2x, use LANCZOS (best for moderate upscaling)
            return image.resize(new_size, Image.Resampling.LANCZOS)
        
        elif scale_factor == 4:
            # For 4x, use a 2-step approach for better quality
            # First scale to 2x, then apply sharpening, then scale to 4x
            intermediate_size = (width * 2, height * 2)
            intermediate = image.resize(intermediate_size, Image.Resampling.LANCZOS)
            
            # Apply slight sharpening to intermediate
            enhancer = ImageEnhance.Sharpness(intermediate)
            intermediate = enhancer.enhance(1.2)
            
            # Scale to final 4x
            return intermediate.resize(new_size, Image.Resampling.LANCZOS)
        
        elif scale_factor == 8:
            # For 8x, use a 3-step approach for best quality
            # Scale 2x -> sharpen -> scale 2x -> sharpen -> scale 2x
            current_image = image.copy()
            
            # Step 1: Scale to 2x
            size_2x = (width * 2, height * 2)
            current_image = current_image.resize(size_2x, Image.Resampling.LANCZOS)
            
            # Step 1.5: Sharpen
            enhancer = ImageEnhance.Sharpness(current_image)
            current_image = enhancer.enhance(1.15)
            
            # Step 2: Scale to 4x
            size_4x = (width * 4, height * 4)
            current_image = current_image.resize(size_4x, Image.Resampling.LANCZOS)
            
            # Step 2.5: Sharpen
            enhancer = ImageEnhance.Sharpness(current_image)
            current_image = enhancer.enhance(1.1)
            
            # Step 3: Scale to 8x
            return current_image.resize(new_size, Image.Resampling.LANCZOS)
        
        else:
            # Fallback for invalid scale factors
            return image.resize(new_size, Image.Resampling.LANCZOS)
    
    def _apply_final_sharpening(self, image: Image.Image) -> Image.Image:
        """Apply final sharpening to super-resolved images"""
        enhancer = ImageEnhance.Sharpness(image)
        # Mild sharpening to enhance details without artifacts
        return enhancer.enhance(1.1)
    
    def _apply_contrast_enhancement(self, image: Image.Image) -> Image.Image:
        """Advanced contrast enhancement"""
        # Convert to LAB color space for better contrast adjustment
        try:
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(cv_image)
            
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            # Merge channels back
            enhanced_lab = cv2.merge((l, a, b))
            
            # Convert back to RGB
            enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
            return Image.fromarray(enhanced)
        except Exception as e:
            logger.warning(f"Advanced contrast enhancement failed: {e}")
            # Fallback to PIL contrast enhancement
            enhancer = ImageEnhance.Contrast(image)
            return enhancer.enhance(1.2)
    
    def enhance_from_to(self, input_path: str, output_path: str, config: Optional[dict] = None) -> str:
        """Enhance from file to file"""
        try:
            with open(input_path, 'rb') as f:
                image_bytes = f.read()
            
            enhanced_bytes = self.enhance_image(image_bytes, config)
            
            with open(output_path, 'wb') as f:
                f.write(enhanced_bytes)
            
            logger.info(f"Enhanced image saved to: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"File enhancement error: {e}")
            raise
    
    def batch_enhance(self, input_paths: list, output_dir: str, config: Optional[dict] = None) -> list:
        """Enhance multiple images"""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        results = []
        for input_path in input_paths:
            try:
                filename = os.path.basename(input_path)
                name, ext = os.path.splitext(filename)
                
                # Add scale factor to filename if super resolution is applied
                scale_factor = config.get("super_resolution", 1) if config else 1
                if scale_factor > 1:
                    output_filename = f"{name}_{scale_factor}x{ext}"
                else:
                    output_filename = f"enhanced_{filename}"
                
                output_path = os.path.join(output_dir, output_filename)
                
                self.enhance_from_to(input_path, output_path, config)
                results.append(output_path)
                logger.info(f"Enhanced: {filename} -> {output_filename}")
                
            except Exception as e:
                logger.error(f"Failed to enhance {input_path}: {e}")
                results.append(None)
        
        return results
    
    def get_image_info(self, image_bytes: bytes) -> dict:
        """Get information about the image"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            return {
                "width": image.width,
                "height": image.height,
                "format": image.format,
                "mode": image.mode,
                "size_bytes": len(image_bytes)
            }
        except Exception as e:
            logger.error(f"Error getting image info: {e}")
            return {}
    
    def preview_enhancement(self, image_bytes: bytes, config: Optional[dict] = None) -> dict:
        """Generate a preview with different enhancement levels"""
        if config is None:
            config = self.default_config
        
        results = {}
        
        # Original
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        buffer = io.BytesIO()
        original_image.save(buffer, format="PNG")
        buffer.seek(0)
        results["original"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
        
        # Enhanced with current config
        enhanced_bytes = self.enhance_image(image_bytes, config)
        results["enhanced"] = f"data:image/png;base64,{base64.b64encode(enhanced_bytes).decode()}"
        
        # Preview with 2x super resolution
        config_2x = config.copy()
        config_2x["super_resolution"] = 2
        enhanced_2x_bytes = self.enhance_image(image_bytes, config_2x)
        results["enhanced_2x"] = f"data:image/png;base64,{base64.b64encode(enhanced_2x_bytes).decode()}"
        
        return results

# Simple function for backward compatibility
def enhance_image_simple(input_path: str, output_path: str, sharpness: float = 1.5, contrast: float = 1.2) -> str:
    """Simple enhancement (original function)"""
    enhancer = ProfessionalImageEnhancer()
    config = {"sharpness": sharpness, "contrast": contrast}
    return enhancer.enhance_from_to(input_path, output_path, config)

def enhance_image_advanced(input_path: str, output_path: str, 
                          sharpness: float = 1.5,
                          contrast: float = 1.2,
                          brightness: float = 1.1,
                          color: float = 1.1,
                          denoise: bool = False,
                          super_resolution: int = 1) -> str:
    """
    Advanced enhancement with more parameters
    super_resolution: 1=no scaling, 2=2x, 4=4x, 8=8x
    """
    config = {
        "sharpness": sharpness,
        "contrast": contrast,
        "brightness": brightness,
        "color": color,
        "denoise": denoise,
        "super_resolution": super_resolution
    }
    
    enhancer = ProfessionalImageEnhancer()
    return enhancer.enhance_from_to(input_path, output_path, config)

# Test function
def test_enhancement():
    """Test the enhancement functions"""
    print("🧪 Testing Image Enhancement Module...")
    
    # Create a test image
    test_image = Image.new('RGB', (100, 100), color='red')
    buffer = io.BytesIO()
    test_image.save(buffer, format='PNG')
    test_bytes = buffer.getvalue()
    
    enhancer = ProfessionalImageEnhancer()
    
    # Test 1: Basic enhancement
    print("1. Testing basic enhancement...")
    try:
        enhanced = enhancer.enhance_image(test_bytes)
        print("✅ Basic enhancement passed")
    except Exception as e:
        print(f"❌ Basic enhancement failed: {e}")
    
    # Test 2: 2X super resolution
    print("2. Testing 2X super resolution...")
    try:
        config = {"super_resolution": 2}
        enhanced_2x = enhancer.enhance_image(test_bytes, config)
        print("✅ 2X super resolution passed")
    except Exception as e:
        print(f"❌ 2X super resolution failed: {e}")
    
    # Test 3: 4X super resolution
    print("3. Testing 4X super resolution...")
    try:
        config = {"super_resolution": 4}
        enhanced_4x = enhancer.enhance_image(test_bytes, config)
        print("✅ 4X super resolution passed")
    except Exception as e:
        print(f"❌ 4X super resolution failed: {e}")
    
    # Test 4: 8X super resolution
    print("4. Testing 8X super resolution...")
    try:
        config = {"super_resolution": 8}
        enhanced_8x = enhancer.enhance_image(test_bytes, config)
        print("✅ 8X super resolution passed")
    except Exception as e:
        print(f"❌ 8X super resolution failed: {e}")
    
    # Test 5: All features combined
    print("5. Testing all features combined...")
    try:
        config = {
            "sharpness": 2.0,
            "contrast": 1.5,
            "brightness": 1.2,
            "color": 1.3,
            "denoise": True,
            "super_resolution": 4
        }
        enhanced_all = enhancer.enhance_image(test_bytes, config)
        print("✅ All features combined passed")
    except Exception as e:
        print(f"❌ All features combined failed: {e}")
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    print("=" * 50)
    print("PROFESSIONAL IMAGE ENHANCEMENT MODULE")
    print("=" * 50)
    print("Features:")
    print("  • Sharpness enhancement")
    print("  • Contrast adjustment")
    print("  • Brightness control")
    print("  • Color saturation")
    print("  • Noise reduction")
    print("  • 2X, 4X, 8X Super Resolution")
    print("=" * 50)
    
    # Run tests
    test_enhancement()
    
    print("\n🚀 Module is ready to use!")
    print("Usage examples:")
    print("  enhancer = ProfessionalImageEnhancer()")
    print("  enhanced_bytes = enhancer.enhance_image(image_bytes, config)")
    print("\nConfig options:")
    print("  sharpness: 0.5 to 3.0 (default: 2.0)")
    print("  contrast: 0.5 to 2.0 (default: 1.2)")
    print("  brightness: 0.5 to 2.0 (default: 1.1)")
    print("  color: 0.5 to 2.0 (default: 1.1)")
    print("  denoise: True/False (default: False)")
    print("  super_resolution: 1, 2, 4, or 8 (default: 1)")