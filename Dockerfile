FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt ./
COPY graph_visualizer/requirements.txt ./graph_visualizer/requirements.txt

COPY api ./api
COPY core ./core

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["sh", "./entrypoint.sh"]