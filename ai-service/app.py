from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from googletrans import Translator
import pandas as pd
import numpy as np
import torch
from PIL import Image
import torchvision.transforms as transforms
from torchvision import models
from huggingface_hub import hf_hub_download

app = Flask(__name__)
CORS(app)

# === Load LLM from HuggingFace ===
tokenizer = AutoTokenizer.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0")
model = AutoModelForCausalLM.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0")

def generate_ai_response(prompt):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs, max_new_tokens=300, temperature=0.6)
    return tokenizer.decode(outputs[0], skip_special_tokens=True).split("<|assistant|>")[-1].strip()

# === FAQ Setup ===
faq_encoder = SentenceTransformer('all-MiniLM-L6-v2')
df = pd.read_csv("medical_faqs.csv")
faq_embeddings = faq_encoder.encode(df['question'].tolist())
faq_answers = df['answer'].tolist()

translator = Translator()

SYSTEM_PROMPT_EN = "You're a helpful health assistant who provides short and friendly replies (2–3 sentences max). You never diagnose, but suggest possibilities and always add: 'This is AI-generated, not a medical diagnosis.'"
SYSTEM_PROMPT_HI = "तुम एक सहायक स्वास्थ्य सहायक हो जो 2-3 पंक्तियों में छोटा और स्पष्ट उत्तर देता है। तुम कभी भी डायग्नोसिस नहीं करते, सिर्फ संभावनाएं बताते हो और हमेशा यह कहते हो: 'यह AI द्वारा जनरेट किया गया उत्तर है, यह चिकित्सा निदान नहीं है।'"

def get_faq_response(query):
    query_embed = faq_encoder.encode([query])
    scores = cosine_similarity(query_embed, faq_embeddings)[0]
    max_idx = np.argmax(scores)
    return faq_answers[max_idx] if scores[max_idx] > 0.7 else None

# === Chat History ===
def save_to_log(user_id, user_input, ai_reply):
    os.makedirs("chat_logs", exist_ok=True)
    path = f"chat_logs/{user_id}.json"
    log = []
    if os.path.exists(path):
        with open(path, 'r') as f:
            log = json.load(f)
    log.append({"sender": "user", "text": user_input})
    log.append({"sender": "ai", "text": ai_reply})
    with open(path, 'w') as f:
        json.dump(log, f, indent=2)

@app.route('/api/message', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    user_id = data.get("userId", "default")
    lang = "hi" if "hi" in data.get("lang", "en-IN") else "en"

    if not user_input:
        return jsonify({'response': 'No message provided'}), 400

    input_en = translator.translate(user_input, src=lang, dest='en').text if lang == 'hi' else user_input

    faq = get_faq_response(input_en)
    if faq:
        reply = translator.translate(faq, src='en', dest='hi').text if lang == 'hi' else faq
        save_to_log(user_id, user_input, reply)
        return jsonify({'response': reply})

    prompt = f"<|system|>{SYSTEM_PROMPT_HI if lang == 'hi' else SYSTEM_PROMPT_EN}<|end|>\n<|user|>{input_en}<|end|>\n<|assistant|>"
    try:
        reply = generate_ai_response(prompt)
        final_reply = translator.translate(reply, src='en', dest='hi').text if lang == 'hi' else reply
        save_to_log(user_id, user_input, final_reply)
        return jsonify({'response': final_reply})
    except Exception as e:
        return jsonify({'response': f"AI error: {str(e)}"})

@app.route('/api/chat', methods=['GET'])
def get_chat_history():
    user_id = request.args.get("userId", "default")
    path = f"chat_logs/{user_id}.json"
    if os.path.exists(path):
        with open(path, 'r') as f:
            return jsonify({'messages': json.load(f)})
    return jsonify({'messages': []})

# === IMAGE DIAGNOSIS ===
NUM_CLASSES = 7
model_resnet = models.resnet18(pretrained=False)
model_resnet.fc = torch.nn.Linear(model_resnet.fc.in_features, NUM_CLASSES)

resnet_path = hf_hub_download(
    repo_id="yyc297/tinyllama-health-model",  # your HF repo
    filename="resnet18_skin_disease.pt",
    local_dir="models"
)
model_resnet.load_state_dict(torch.load(resnet_path, map_location='cpu'))
model_resnet.eval()

skin_labels = {
    0: ("AKIEC", "Sun damage patch. Avoid sun, consult doctor."),
    1: ("BCC", "Common skin cancer. Use sunscreen."),
    2: ("BKL", "Benign lesion. Usually harmless."),
    3: ("DF", "Small skin nodule. Harmless."),
    4: ("MEL", "Serious melanoma. Monitor moles."),
    5: ("NV", "Normal mole. Track changes."),
    6: ("VASC", "Blood vessel lesion. Usually benign.")
}

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

@app.route('/api/image', methods=['POST'])
def diagnose_image():
    if 'image' not in request.files:
        return jsonify({'response': 'No image uploaded'}), 400

    image = Image.open(request.files['image']).convert('RGB')
    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        out = model_resnet(tensor)
        probs = torch.nn.functional.softmax(out[0], dim=0)
        pred = torch.argmax(probs).item()
        confidence = round(torch.max(probs).item() * 100, 2)

    label, desc = skin_labels.get(pred, ("Unknown", "No description available."))
    return jsonify({
        'response': f"{desc} This is an AI-generated guess. Please consult a doctor.",
        'diagnosis': { 'label': label, 'confidence': confidence }
    })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
