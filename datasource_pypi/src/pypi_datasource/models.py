from typing import Dict


class Package:
    def __init__(self, data: Dict, **kwargs):
        self.name = data.get("name", "")
        self.version = data.get("version", "")
        self.author = data.get("author", "")
        self.license = data.get("license", "")
        self.summary = data.get("summary", "")

        for key, value in kwargs.items():
            setattr(self, key, value)
