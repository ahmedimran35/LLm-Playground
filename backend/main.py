from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import g4f
import json
import asyncio
import uuid
from datetime import datetime
import logging
from g4f.client import Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Nexus",
    description="A beautiful web application connecting you to multiple AI models and providers",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str
    provider: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

class ChatResponse(BaseModel):
    message: str
    model: str
    provider: str
    timestamp: str
    usage: Optional[Dict[str, Any]] = None

class ImageGenerationRequest(BaseModel):
    prompt: str
    model: str
    provider: Optional[str] = None
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    quality: Optional[str] = "standard"
    style: Optional[str] = "vivid"

class ImageGenerationResponse(BaseModel):
    image_url: str
    model: str
    provider: str
    timestamp: str
    prompt: str

class ChatSession(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]
    model: str
    provider: str
    created_at: str
    updated_at: str

# In-memory storage (replace with database in production)
chat_sessions: Dict[str, ChatSession] = {}

# Available models and providers (Tested & Working)
AVAILABLE_MODELS = {
    "microsoft/phi-4": ["g4f.Provider.DeepInfra"],
    "google/gemma-3-4b-it": ["g4f.Provider.DeepInfra"],
    "google/gemma-3-12b-it": ["g4f.Provider.DeepInfra"],
    "Qwen/Qwen3-14B": ["g4f.Provider.DeepInfra"],
    "Qwen/Qwen3-32B": ["g4f.Provider.DeepInfra"],
    "deepseek-ai/DeepSeek-V3.1": ["g4f.Provider.DeepInfra"],
    "anthropic/claude-4-sonnet": ["g4f.Provider.DeepInfra"],
    "google/gemini-2.5-flash": ["g4f.Provider.DeepInfra"],
    "zai-org/GLM-4.5": ["g4f.Provider.DeepInfra"],
    "moonshotai/Kimi-K2-Instruct": ["g4f.Provider.DeepInfra"],
    "anthropic/claude-4-opus": ["g4f.Provider.DeepInfra"],
    "google/gemini-2.5-pro": ["g4f.Provider.DeepInfra"],
    "deepseek-ai/DeepSeek-R1-0528-Turbo": ["g4f.Provider.DeepInfra"],
    "meta-llama/Llama-3.3-70B-Instruct": ["g4f.Provider.DeepInfra"],
    "meta-llama/Llama-3.3-70B-Instruct-Turbo": ["g4f.Provider.DeepInfra"],
    "Qwen/Qwen3-235B-A22B-Instruct-2507": ["g4f.Provider.DeepInfra"],
    "mistralai/Mistral-Small-3.2-24B-Instruct-2506": ["g4f.Provider.DeepInfra"],
    "microsoft/phi-4-reasoning-plus": ["g4f.Provider.DeepInfra"],
    "google/gemma-3-27b-it": ["g4f.Provider.DeepInfra"],
    "zai-org/GLM-4.5-Air": ["g4f.Provider.DeepInfra"],
    "Qwen/Qwen3-Coder-480B-A35B-Instruct": ["g4f.Provider.DeepInfra"],
    "Qwen/QwQ-32B": ["g4f.Provider.DeepInfra"],
    "deepseek-chat": ["g4f.Provider.DeepSeek"],
    "deepseek-coder": ["g4f.Provider.DeepSeek"],
    "deepseek-v2.5": ["g4f.Provider.DeepSeek"],
    "gpt-4": ["g4f.Provider.OpenaiChat"],
    "gpt-4-turbo": ["g4f.Provider.OpenaiChat"],
    "gpt-4o": ["g4f.Provider.OpenaiChat"],
    "gpt-4o-mini": ["g4f.Provider.OpenaiChat"],
    "gpt-3.5-turbo": ["g4f.Provider.OpenaiChat"],
    "gemini-pro": ["g4f.Provider.Gemini"],
    "gemini-flash": ["g4f.Provider.Gemini"],
    "llama-3.1-8b": ["g4f.Provider.Groq"],
    "llama-3.1-70b": ["g4f.Provider.Groq"],
    "mixtral-8x7b": ["g4f.Provider.Groq"],
    "gemma-2-9b": ["g4f.Provider.Groq"],
    "openai/gpt-4": ["g4f.Provider.OpenRouter"],
    "openai/gpt-4-turbo": ["g4f.Provider.OpenRouter"],
    "openai/gpt-3.5-turbo": ["g4f.Provider.OpenRouter"],
    "anthropic/claude-3-opus": ["g4f.Provider.OpenRouter"],
    "anthropic/claude-3-sonnet": ["g4f.Provider.OpenRouter"],
    "google/gemini-pro": ["g4f.Provider.OpenRouter"],
    "claude-3-opus": ["g4f.Provider.Anthropic"],
    "claude-3-sonnet": ["g4f.Provider.Anthropic"],
    "claude-3-haiku": ["g4f.Provider.Anthropic"],
    "huggingchat/mistral-7b-instruct": ["g4f.Provider.HuggingChat"],
    "huggingchat/llama-2-70b-chat": ["g4f.Provider.HuggingChat"],
    "huggingchat/codellama-34b-instruct": ["g4f.Provider.HuggingChat"],
    "you": ["g4f.Provider.You"],
    "bing": ["g4f.Provider.Bing"],
}

# Image Generation Models (providerless via Client API)
IMAGE_GENERATION_MODELS: List[str] = [
    "flux",
    "sdxl",
    "kandinsky",
    "realistic-vision"
]

# g4f Client for image generation
_g4f_client = Client()

def get_provider_class(provider_name: str):
    try:
        if provider_name == "g4f.Provider.DeepInfra":
            return g4f.Provider.DeepInfra
        elif provider_name == "g4f.Provider.DeepSeek":
            return g4f.Provider.DeepSeek
        elif provider_name == "g4f.Provider.OpenaiChat":
            return g4f.Provider.OpenaiChat
        elif provider_name == "g4f.Provider.Gemini":
            return g4f.Provider.Gemini
        elif provider_name == "g4f.Provider.Groq":
            return g4f.Provider.Groq
        elif provider_name == "g4f.Provider.OpenRouter":
            return g4f.Provider.OpenRouter
        elif provider_name == "g4f.Provider.Anthropic":
            return g4f.Provider.Anthropic
        elif provider_name == "g4f.Provider.HuggingChat":
            return g4f.Provider.HuggingChat
        elif provider_name == "g4f.Provider.You":
            return g4f.Provider.You
        elif provider_name == "g4f.Provider.Bing":
            return g4f.Provider.Bing
        else:
            return g4f.Provider.DeepInfra
    except Exception as e:
        logger.error(f"Error getting provider class: {e}")
        return g4f.Provider.DeepInfra

@app.get("/")
async def root():
    return {"message": "AI Nexus API", "status": "running"}

@app.get("/api/capabilities")
async def capabilities():
    return {
        "chat": True,
        "image_generation": True,
    }

@app.get("/api/models")
async def get_models():
    return {
        "models": AVAILABLE_MODELS,
        "image_models": IMAGE_GENERATION_MODELS,
        "total_models": len(AVAILABLE_MODELS),
        "total_image_models": len(IMAGE_GENERATION_MODELS)
    }

@app.get("/api/models/health")
async def models_health(models: Optional[List[str]] = None, per_model_timeout: float = 8.0):
    test_list = models or [
        "microsoft/phi-4",
        "google/gemma-3-4b-it",
        "anthropic/claude-4-sonnet",
        "deepseek-ai/DeepSeek-V3.1",
    ]

    async def test_model(model_name: str) -> Dict[str, Any]:
        providers = AVAILABLE_MODELS.get(model_name, [])
        if not providers:
            return {"model": model_name, "ok": False, "error": "unknown model"}
        provider_name = providers[0]
        provider_class = get_provider_class(provider_name)
        try:
            resp = await asyncio.wait_for(
                g4f.ChatCompletion.create_async(
                    model=model_name,
                    messages=[{"role": "user", "content": "ping"}],
                    provider=provider_class,
                    temperature=0.0,
                    max_tokens=10
                ),
                timeout=per_model_timeout
            )
            return {"model": model_name, "ok": True, "provider": provider_name, "sample": str(resp)[:80]}
        except Exception as e:
            return {"model": model_name, "ok": False, "provider": provider_name, "error": str(e)}

    results = await asyncio.gather(*(test_model(m) for m in test_list))
    working = [r for r in results if r.get("ok")]
    return {"results": results, "working": [r["model"] for r in working], "count_working": len(working)}

@app.get("/api/providers")
async def get_providers():
    providers = list(set([provider for providers in AVAILABLE_MODELS.values() for provider in providers]))
    return {
        "providers": providers,
        "total_providers": len(providers)
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if request.model not in AVAILABLE_MODELS:
            raise HTTPException(status_code=400, detail=f"Model {request.model} not available")
        available_providers = AVAILABLE_MODELS[request.model]
        if request.provider and request.provider not in available_providers:
            raise HTTPException(status_code=400, detail=f"Provider {request.provider} not available for model {request.model}")
        provider_name = request.provider or available_providers[0]
        provider_class = get_provider_class(provider_name)
        g4f_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        try:
            response = await asyncio.wait_for(
                g4f.ChatCompletion.create_async(
                    model=request.model,
                    messages=g4f_messages,
                    provider=provider_class,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens
                ),
                timeout=60.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=408, detail="Request timeout - the AI model took too long to respond")
        except Exception as e:
            logger.error(f"Error in g4f.ChatCompletion.create_async: {e}")
            raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")
        return ChatResponse(
            message=response,
            model=request.model,
            provider=provider_name,
            timestamp=datetime.now().isoformat(),
            usage={"tokens": len(response.split())}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@app.post("/api/generate-image", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    if request.model not in IMAGE_GENERATION_MODELS:
        raise HTTPException(status_code=400, detail=f"Image model {request.model} not available")
    try:
        result = await asyncio.to_thread(
            _g4f_client.images.generate,
            model=request.model,
            prompt=request.prompt,
            response_format="url",
        )
        # Try to extract URL (client API returns data list)
        image_url = None
        try:
            image_url = result.data[0].url  # type: ignore[attr-defined]
        except Exception:
            image_url = str(result)
        return ImageGenerationResponse(
            image_url=image_url,
            model=request.model,
            provider="g4f-client",
            timestamp=datetime.now().isoformat(),
            prompt=request.prompt
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Request timeout - image generation took too long")
    except Exception as e:
        logger.error(f"Error generating image via g4f Client API: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating image: {str(e)}")

@app.post("/api/sessions")
async def create_session(title: str, model: str, provider: str):
    session_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    session = ChatSession(
        id=session_id,
        title=title,
        messages=[],
        model=model,
        provider=provider,
        created_at=now,
        updated_at=now
    )
    chat_sessions[session_id] = session
    return session

@app.get("/api/sessions")
async def get_sessions():
    return list(chat_sessions.values())

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return chat_sessions[session_id]

@app.post("/api/sessions/{session_id}/messages")
async def add_message(session_id: str, message: ChatMessage):
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session = chat_sessions[session_id]
    message.timestamp = datetime.now().isoformat()
    session.messages.append(message)
    session.updated_at = datetime.now().isoformat()
    return {"message": "Message added successfully"}

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    del chat_sessions[session_id]
    return {"message": "Session deleted successfully"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            try:
                g4f_messages = [{"role": msg["role"], "content": msg["content"]} for msg in message_data.get("messages", [])]
                model = message_data.get("model", "gpt-4o-mini")
                provider_name = message_data.get("provider", "g4f.Provider.DeepInfra")
                provider_class = get_provider_class(provider_name)
                response = await g4f.ChatCompletion.create_async(
                    model=model,
                    messages=g4f_messages,
                    provider=provider_class
                )
                response_data = {
                    "type": "response",
                    "content": response,
                    "model": model,
                    "provider": provider_name,
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_personal_message(json.dumps(response_data), websocket)
            except Exception as e:
                error_data = {
                    "type": "error",
                    "message": str(e)
                }
                await manager.send_personal_message(json.dumps(error_data), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
