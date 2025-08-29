# Graph Visualizer

A Django-based application for visualizing and interacting with graphs.

## Team Members

| Name             | Plugin            | GitHub                                       |
|------------------|-------------------|----------------------------------------------|
| Milica Radić     | Block Visualizer  | [milicaradicc](https://github.com/milicaradicc) |
| Nadja Zorić      | Simple Visualizer | [zoricnadja](https://github.com/zoricnadja)          |
| Mijat Krivokapić | Rdf Datasource    | [mijatkrivokapic](https://github.com/mijatkrivokapic) |
| Andjela Ristić   | Json Datasource   | [RisticAndjela](https://github.com/RisticAndjela) |
| Damjan Vincić    | PyPI Datasource   | [DamjanVincic](https://github.com/DamjanVincic) |

## Development Setup

### **1. Without Docker**

#### **Create a virtual environment:**

```sh
python3 -m venv .venv
source .venv/bin/activate # Linux
    or
source .venv\Scripts\activate # Windows
```

#### **Install all dependencies:**

```sh
pip install -r requirements.txt
```

#### **Run Django migrations and start the server:**

```sh
cd graph_visualizer
python manage.py migrate
python manage.py runserver
```

---

### **2. With Docker**

#### **Build and start the app:**

```sh
docker-compose up -d
```

#### **Stopping the app:**

```sh
docker-compose down
```

---

- The app will be available at [http://localhost:8000](http://localhost:8000).
- Code changes in `graph_visualizer`, `core`, and `api` are reflected instantly without the need to restart the container or app (if running without Docker).


## Project Structure

```
graph-visualizer/
│
├── api/                # Models and interfaces for core
├── core/               # Core business logic
├── graph_visualizer/   # Django app (entry point)
├── requirements.txt    # Package requirements
├── Dockerfile
├── docker-compose.yml
└── README.md
```


## Troubleshooting

- If you get permission errors with `entrypoint.sh`, ensure it is executable:
  ```sh
  chmod +x entrypoint.sh
  ```
