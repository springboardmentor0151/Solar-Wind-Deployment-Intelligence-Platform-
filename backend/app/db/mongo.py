from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.core.config import get_settings


def insert_document(collection_name: str, document: dict) -> None:
    settings = get_settings()
    try:
        client = MongoClient(settings.mongodb_url, serverSelectionTimeoutMS=1500)
        client.admin.command("ping")
        client[settings.mongodb_database][collection_name].insert_one(document)
    except PyMongoError:
        return
    finally:
        try:
            client.close()
        except UnboundLocalError:
            pass
