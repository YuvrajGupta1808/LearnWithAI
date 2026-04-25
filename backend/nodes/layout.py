import os
import json
from langchain_openai import ChatOpenAI
from backend.state import CourseState

def generate_layout(state: CourseState):
    api_key = os.getenv("FIREWORKS_API_KEY")
    model_name = os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/kimi-k2p6")
    
    llm = ChatOpenAI(
        api_key=api_key,
        base_url="https://api.fireworks.ai/inference/v1",
        model=model_name,
        temperature=0.7
    )
    
    prompt = f"""
    Generate a highly structured and educational course syllabus in JSON format for the following topic:
    Topic: {state['topic']}
    Category: {state['category']}
    Level: {state['level']}
    Duration: {state['duration']}
    Number of Chapters: {state['noOfChapters']}
    
    The output must be a single JSON object with the following schema:
    {{
      "course": {{
        "name": "Course Title",
        "description": "Comprehensive course overview",
        "duration": "Estimated time (e.g., 5 Hours)",
        "numberOfChapters": {state['noOfChapters']},
        "chapters": [
          {{
            "chapterId": 1,
            "name": "Chapter Title",
            "about": "Brief summary of what this chapter covers",
            "duration": "Time for this chapter"
          }}
        ]
      }}
    }}
    
    Return ONLY the JSON object. No markdown, no explanations.
    """
    
    response = llm.invoke(prompt)
    content = response.content.replace("```json", "").replace("```", "").strip()
    layout_data = json.loads(content)
    
    return {
        "layout": layout_data.get("course", layout_data),
        "status": "layout_generated"
    }
