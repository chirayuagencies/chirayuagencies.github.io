import json, os, uuid, hashlib, base64
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import qrcode
import pandas as pd

def to_b64(text):
    return base64.urlsafe_b64encode(text.encode()).decode()

def ensure_dirs(*paths):
    for path in paths:
        os.makedirs(os.path.dirname(path), exist_ok=True)

def load_json(path):
    return json.load(open(path)) if os.path.exists(path) else {}

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def generate_uuid_and_hash(prefix=""):
    new_uuid = prefix+str(uuid.uuid4())
    sha_hash = hashlib.sha256(new_uuid.encode()).hexdigest()
    return new_uuid, sha_hash

def generate_qr_with_label(uuid_val, recipient, box_number, date, save_path):
    qr_url = f"https://chirayuagencies.com/verify?uuid={uuid_val}"
    qr_img = qrcode.make(qr_url)
    font = ImageFont.load_default()
    label = f"To: {recipient}\nBox #{box_number} | {date}"

    w, h = qr_img.size
    text_img = Image.new("RGB", (w, 40), "white")
    draw = ImageDraw.Draw(text_img)
    draw.text((10, 0), label, font=font, fill="black")

    final = Image.new("RGB", (w, h + 40), "white")
    final.paste(qr_img, (0, 0))
    final.paste(text_img, (0, h))
    final.save(save_path)

def process_cartons(data_file, pvtdata_file, qr_dir, carton_list,prefix=""):
    ensure_dirs(data_file, pvtdata_file, qr_dir)

    data = load_json(data_file)
    pvtdata = load_json(pvtdata_file)
    next_box_number = len(data) + 1
    summary_rows = []

    for i, carton in enumerate(carton_list):
        recipient = carton["recipient"]
        contents = carton["contents"]
        date = carton.get("date", datetime.now().strftime("%Y-%m-%d"))
        box_number = next_box_number + i

        uuid_val, sha_hash = generate_uuid_and_hash(prefix)
        recipient_b64 = to_b64(recipient)

        # Save entries
        data[sha_hash] = {
            "box_number": box_number,
            "recipient": recipient_b64,
            "date": date,
            "contents": contents
        }
        pvtdata[sha_hash] = {
            "uuid": uuid_val,
            "box_number": box_number,
            "recipient": recipient,
            "date": date,
            "contents": contents
        }

        # QR
        qr_path = os.path.join(qr_dir, f"{box_number}_{uuid_val}.png")
        generate_qr_with_label(uuid_val, recipient, box_number, date, qr_path)

        summary_rows.append({
            "Box Number": box_number,
            "UUID": uuid_val,
            "Recipient Hash": recipient_b64,
            "Date": date
        })

    save_json(data_file, data)
    save_json(pvtdata_file, pvtdata)

    df = pd.DataFrame(summary_rows).sort_values("Box Number")
    csv_path = os.path.join(qr_dir, f"batch_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    df.to_csv(csv_path, index=False)
    print(f"\n✅ Summary CSV saved: {csv_path}")
    return df

def generate_batch(recipient, contents, num_cartons, data_file, pvtdata_file, qr_dir,prefix=""):
    carton_list = [{"recipient": recipient, "contents": contents} for _ in range(num_cartons)]
    df = process_cartons(data_file, pvtdata_file, qr_dir, carton_list,prefix=prefix)
    return df
