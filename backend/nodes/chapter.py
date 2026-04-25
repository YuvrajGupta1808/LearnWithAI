import os
import json
import requests
from langchain_openai import ChatOpenAI
from backend.state import ChapterContent

def get_youtube_video(query):
    api_key = os.getenv("YOUTUBE_API_KEY") or os.getenv("NEXT_PUBLIC_YOUTUBE_API_KEY")
    if not api_key:
        return ""
    
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        'part': 'snippet',
        'q': query,
        'maxResults': 1,
        'type': 'video',
        'key': api_key
    }
    try:
        response = requests.get(url, params=params)
        data = response.json()
        if data.get('items'):
            return data['items'][0]['id']['videoId']
    except Exception as e:
        print(f"YouTube Search Error: {e}")
    return ""

def generate_chapter_content(chapter_input: dict):
    chapter = chapter_input['chapter']
    course_name = chapter_input['course_name']
    level = chapter_input['level']
    
    api_key = os.getenv("FIREWORKS_API_KEY")
    model_name = os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/kimi-k2p6")
    
    llm = ChatOpenAI(
        api_key=api_key,
        base_url="https://api.fireworks.ai/inference/v1",
        model=model_name,
        temperature=0.7
    )
    
    prompt = f"""
    Generate interactive and concise educational content for a specific course chapter.
    
    Course: {course_name}
    Chapter Name: {chapter['name']}
    Level: {level}
    About: {chapter['about']}
    
    Required JSON format:
    {{
      "chapterId": {chapter['chapterId']},
      "content": [
        {{
          "title": "Key Concept",
          "explanation": "Concise, high-impact explanation (max 2 paragraphs).",
          "codeExample": "Short, clean code snippet if relevant"
        }}
      ],
      "interactive": {{
        "quiz": [
          {{
            "question": "A concept-check question",
            "options": ["A", "B", "C", "D"],
            "answer": "Correct option"
          }}
        ],
        "challenge": "A small 'Try it yourself' exercise"
      }}
    }}
    
    Focus on clarity and interaction. Avoid long walls of text.
    Return ONLY JSON.
    """
    
    response = llm.invoke(prompt)
    content = response.content.replace("```json", "").replace("```", "").strip()
    chapter_data = json.loads(content)
    
    # Search for a relevant video
    video_query = f"{course_name} {chapter['name']} tutorial"
    video_id = get_youtube_video(video_query)
    
    return {
        "completed_chapters": [
            {
                "chapterId": chapter['chapterId'],
                "content": chapter_data, # Return the whole interactive object
                "videoId": video_id
            }
        ]
    }
