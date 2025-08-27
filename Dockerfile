FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt ./requirements.txt
COPY graph_visualizer/requirements.txt ./graph_visualizer/requirements.txt

COPY api ./api
COPY core ./core
COPY datasource_rdf ./datasource_rdf
COPY plugins/pypi_datasource ./plugins/pypi_datasource
COPY datasource_json ./datasource_json
COPY block_visualizer ./block_visualizer
COPY simple_visualizer ./simple_visualizer
COPY graph_visualizer ./graph_visualizer

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["sh", "./entrypoint.sh"]