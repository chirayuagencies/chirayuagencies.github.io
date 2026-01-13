from carton_generator import process_cartons

# Inputs
recipient = input("Enter recipient name: ").strip()
contents = input("Enter contents: ").strip() or "unspecified goods"

# File paths
DATA_FILE = "../../public/sha_lookup.json"
PVTDATA_FILE = "../../pvtdata/sha_lookup.json"
QR_DIR = "../../pvtdata/qrcodes"

# Process single carton
process_cartons(
    data_file=DATA_FILE,
    pvtdata_file=PVTDATA_FILE,
    qr_dir=QR_DIR,
    carton_list=[{
        "recipient": recipient,
        "contents": contents
    }]
)
