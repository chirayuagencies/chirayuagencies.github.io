from carton_generator import process_cartons

# File paths
DATA_FILE = "../../public/sha_lookup.json"
PVTDATA_FILE = "../../pvtdata/sha_lookup.json"
QR_DIR = "../../pvtdata/qrcodes"

recipient = input("Enter recipient name (common): ").strip()
contents = input("Enter contents (common): ").strip() or "unspecified goods"
num_boxes = int(input("Enter number of cartons in this batch: "))
allow_per_box = input("Do you want to enter recipient/contents per carton? (y/N): ").strip().lower() == "y"

carton_list = []

for i in range(num_boxes):
    print(f"\n--- Carton {i+1} ---")
    this_recipient = recipient
    this_contents = contents

    if allow_per_box:
        r = input("Enter recipient (leave blank to use common): ").strip()
        if r: this_recipient = r
        c = input("Enter contents (leave blank to use common): ").strip()
        if c: this_contents = c

    carton_list.append({
        "recipient": this_recipient,
        "contents": this_contents
    })

process_cartons(
    data_file=DATA_FILE,
    pvtdata_file=PVTDATA_FILE,
    qr_dir=QR_DIR,
    carton_list=carton_list
)
