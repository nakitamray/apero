"""Wipe dishes, reviews and user rankings. Asks first.

Handy when testing. Does not touch Firebase Auth accounts.
"""

from common import connect

COLLECTIONS = ["dishes", "reviews", "users"]


def delete_collection(ref, batch_size=200):
    while True:
        docs = list(ref.limit(batch_size).stream())
        if not docs:
            return
        for doc in docs:
            for sub in doc.reference.collections():
                delete_collection(sub, batch_size)
            doc.reference.delete()


if __name__ == "__main__":
    print("This deletes everything in:", ", ".join(COLLECTIONS))
    if input("Type DELETE to keep going: ") == "DELETE":
        db = connect()
        for name in COLLECTIONS:
            delete_collection(db.collection(name))
            print(f"cleared {name}")
    else:
        print("cancelled")
