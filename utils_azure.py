# utils_azure.py
from azure.storage.blob import BlobServiceClient
import os

def download_model_from_blob(local_path: str = "./models/model_ner_cv"):
    if os.path.exists(local_path) and len(os.listdir(local_path)) > 0:
        print(f"Modele deja present : {local_path}")
        return

    account_url = "https://stcvmodels.blob.core.windows.net"
    account_key  = os.environ["AZURE_STORAGE_KEY"]

    client    = BlobServiceClient(account_url=account_url, credential=account_key)
    container = client.get_container_client("models")

    os.makedirs(local_path, exist_ok=True)
    print("Telechargement du modele depuis Azure Blob...")

    for blob in container.list_blobs(name_starts_with="model_ner_cv/"):
        relative = blob.name[len("model_ner_cv/"):]
        if not relative:
            continue
        dest = os.path.join(local_path, relative.replace("/", os.sep))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            data = container.download_blob(blob.name).readall()
            f.write(data)
        print(f"  OK : {blob.name}")

    print("Modele telecharge avec succes.")