#!/usr/bin/env python3
"""
Test script to verify that the most reliable models are working
"""

import asyncio
import g4f
import time

# Test models that should work reliably
TEST_MODELS = [
    ("microsoft/phi-4", g4f.Provider.DeepInfra),
    ("google/gemma-3-4b-it", g4f.Provider.DeepInfra),
    ("anthropic/claude-4-sonnet", g4f.Provider.DeepInfra),
    ("deepseek-ai/DeepSeek-V3.1", g4f.Provider.DeepInfra),
]

async def test_model(model_name, provider):
    """Test a single model"""
    try:
        print(f"Testing {model_name} with {provider.__name__}...")
        
        messages = [{"role": "user", "content": "Hello! Please respond with just 'OK' to confirm you're working."}]
        
        start_time = time.time()
        response = await g4f.ChatCompletion.create_async(
            model=model_name,
            messages=messages,
            provider=provider,
            timeout=30
        )
        end_time = time.time()
        
        print(f"✅ {model_name}: {response[:100]}... ({(end_time - start_time):.2f}s)")
        return True
        
    except Exception as e:
        print(f"❌ {model_name}: {str(e)}")
        return False

async def test_image_model(model_name, provider):
    """Test a single image model"""
    try:
        print(f"Testing image model {model_name} with {provider.__name__}...")
        
        start_time = time.time()
        response = await g4f.ImageGeneration.create_async(
            model=model_name,
            prompt="A simple red circle on white background",
            provider=provider,
            width=512,
            height=512,
            timeout=60
        )
        end_time = time.time()
        
        print(f"✅ {model_name}: Image URL received ({(end_time - start_time):.2f}s)")
        return True
        
    except Exception as e:
        print(f"❌ {model_name}: {str(e)}")
        return False

async def main():
    """Main test function"""
    print("🤖 Testing Chat Models...")
    print("=" * 50)
    
    chat_results = []
    for model_name, provider in TEST_MODELS:
        result = await test_model(model_name, provider)
        chat_results.append((model_name, result))
        await asyncio.sleep(1)  # Small delay between tests
    
    print("\n🎨 Testing Image Models...")
    print("=" * 50)
    
    # Test image models
    image_models = [
        ("dall-e-3", g4f.Provider.OpenaiChat),
        ("stable-diffusion", g4f.Provider.DeepInfra),
    ]
    
    image_results = []
    for model_name, provider in image_models:
        result = await test_image_model(model_name, provider)
        image_results.append((model_name, result))
        await asyncio.sleep(1)  # Small delay between tests
    
    # Summary
    print("\n📊 Test Summary")
    print("=" * 50)
    
    working_chat = sum(1 for _, result in chat_results if result)
    total_chat = len(chat_results)
    print(f"Chat Models: {working_chat}/{total_chat} working")
    
    working_image = sum(1 for _, result in image_results if result)
    total_image = len(image_results)
    print(f"Image Models: {working_image}/{total_image} working")
    
    print("\n✅ Working Chat Models:")
    for model_name, result in chat_results:
        if result:
            print(f"  - {model_name}")
    
    print("\n✅ Working Image Models:")
    for model_name, result in image_results:
        if result:
            print(f"  - {model_name}")

if __name__ == "__main__":
    asyncio.run(main())
