from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from backend.state import CourseState
from backend.nodes.layout import generate_layout
from backend.nodes.chapter import generate_chapter_content

def parallel_chapters(state: CourseState):
    """
    Fan-out: Send each chapter to a parallel worker.
    """
    layout = state['layout']
    chapters = layout.get('chapters', [])
    
    return [
        Send("generate_chapter", {
            "chapter": chapter,
            "course_name": layout.get('name'),
            "level": state['level'],
            "include_video": state['includeVideo']
        }) 
        for chapter in chapters
    ]

def finalize_course(state: CourseState):
    """
    Join point: All chapters are done. Combine them with the layout.
    """
    # Sort chapters by ID to ensure order
    sorted_chapters = sorted(state['completed_chapters'], key=lambda x: x['chapterId'])
    
    return {
        "status": "completed",
        "completed_chapters": sorted_chapters # This replaces the list with the sorted one
    }

def create_graph():
    workflow = StateGraph(CourseState)
    
    # Add Nodes
    workflow.add_node("generate_layout", generate_layout)
    workflow.add_node("generate_chapter", generate_chapter_content)
    workflow.add_node("finalize", finalize_course)
    
    # Define Edges
    workflow.add_edge(START, "generate_layout")
    
    # Conditional edge for fan-out
    workflow.add_conditional_edges(
        "generate_layout",
        parallel_chapters,
        ["generate_chapter"]
    )
    
    # All parallel chapters go to finalize
    workflow.add_edge("generate_chapter", "finalize")
    workflow.add_edge("finalize", END)
    
    return workflow.compile()

# Compile the graph
course_generator = create_graph()
