@echo off
TITLE SpatialMind Backend
echo ==================================================
echo SPATIALMIND BACKEND - FastAPI
echo ==================================================

cd SpatialMind_Backend

IF NOT EXIST venv (
    echo [1/3] Tao moi truong ao venv...
    python -m venv venv
)

echo [2/3] Kich hoat moi truong va cai dat thu vien...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip -q
python -m pip install -r requirements.txt -q

echo [3/3] Dang khoi dong Server FastAPI tai http://localhost:8000
echo Nhan Ctrl+C de dung chay.
echo ==================================================
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
