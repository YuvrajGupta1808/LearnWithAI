from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.graph import course_generator
import uuid
import os
from dotenv import load_dotenv

# Load env vars from backend/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI()

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CourseRequest(BaseModel):
    topic: str
    category: str
    level: str
    duration: str
    noOfChapters: int
    includeVideo: str

@app.post("/generate-course")
async def generate_course(request: CourseRequest):
    try:
        # Initial state
        initial_state = {
            "topic": request.topic,
            "category": request.category,
            "level": request.level,
            "duration": request.duration,
            "noOfChapters": request.noOfChapters,
            "includeVideo": request.includeVideo,
            "course_id": str(uuid.uuid4()),
            "completed_chapters": [],
            "status": "starting"
        }
        
        # Run the graph
        final_state = await course_generator.ainvoke(initial_state)
        
        return {
            "courseId": final_state["course_id"],
            "layout": final_state["layout"],
            "chapters": final_state["completed_chapters"],
            "status": final_state["status"]
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
