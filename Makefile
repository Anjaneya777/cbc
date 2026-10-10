.PHONY: install test backend frontend run clean

install:
	cd backend && python -m pip install -r requirements.txt
	cd frontend && npm install

test:
	cd backend && python -m pytest tests -v

backend:
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

run:
	bash run.sh

clean:
	rm -rf backend/__pycache__ backend/app/__pycache__ backend/tests/__pycache__ backend/.pytest_cache
