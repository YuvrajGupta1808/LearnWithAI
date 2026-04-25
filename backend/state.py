from typing import Annotated, List, Optional, TypedDict
import operator

class ChapterContent(TypedDict):
    chapterId: int
    content: str
    videoId: Optional[str]

class CourseLayout(TypedDict):
    name: str
    description: str
    duration: str
    numberOfChapters: int
    chapters: List[dict]

class CourseState(TypedDict):
    # Input
    topic: str
    category: str
    level: str
    duration: str
    noOfChapters: int
    includeVideo: str
    
    # Internal State
    course_id: str
    layout: Optional[CourseLayout]
    
    # Aggregated results from parallel workers
    # Annotated with operator.add means updates to this list will be APPENDED
    completed_chapters: Annotated[List[ChapterContent], operator.add]
    
    # Final Result
    status: str
    error: Optional[str]
