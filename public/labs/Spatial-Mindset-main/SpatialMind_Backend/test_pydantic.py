import json
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class DrawElement(BaseModel):
    type: str
    from_point: Optional[str] = Field(None, alias="from")
    to_point: Optional[str] = Field(None, alias="to")
    name: Optional[str] = None
    color: str = "black"
    style: str = "solid"

class Step(BaseModel):
    step_number: int
    explanation: str
    draw_elements: List[DrawElement]

class GeometryResponse(BaseModel):
    vertices: Dict[str, List[float]]
    edges: List[List[str]]
    steps: List[Step]
    hint: Optional[str] = None

data = {
    "steps": [
        {
            "step_number": 1,
            "explanation": "Vẽ đáy...",
            "draw_elements": [
                {"type": "line", "from": "A", "to": "B", "style": "dashed"}
            ]
        }
    ]
}

try:
    resp = GeometryResponse(vertices={}, edges=[], steps=data.get("steps", []))
    print(resp.model_dump(by_alias=True))
except Exception as e:
    print(f"Error: {e}")
