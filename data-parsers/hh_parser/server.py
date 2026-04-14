from flask import Flask, request, jsonify
import requests
import re
import random

app = Flask(__name__)

EXCHANGE_RATES = {
    'USD': 93.5,
    'EUR': 100.2,
    'KZT': 0.21,
    'BYR': 28.5
}

def clean_html(raw_html):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', raw_html)
    return ' '.join(cleantext.split())

@app.route('/parse', methods=['GET'])
def parse_vacancies():
    query = request.args.get('query', '')
    if not query:
        return jsonify([])

    print(f"Searching HH.ru for: {query}")
    
    url = f"https://api.hh.ru/vacancies?text={query}&per_page=4&area=113"
    headers = {'User-Agent': 'CareerMateParser/1.0'}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        items = response.json().get('items', [])
        
        results = []
        for item in items:
            vid = item.get('id')
            employer = item.get('employer', {}).get('name', 'Unknown')
            location = item.get('area', {}).get('name', '')
            
            # Fetch details for description and skills
            det_url = f"https://api.hh.ru/vacancies/{vid}"
            det_res = requests.get(det_url, headers=headers)
            
            if det_res.status_code == 200:
                data = det_res.json()
                
                # Format Salary
                salary_label = 'Зарплата не указана'
                salary_data = data.get('salary')
                if salary_data:
                    currency = salary_data.get('currency')
                    multiplier = EXCHANGE_RATES.get(currency, 1)
                    
                    s_from = data['salary'].get('from')
                    s_to = data['salary'].get('to')
                    gross = data['salary'].get('gross')
                    
                    s_from = int(s_from * multiplier) if s_from else None
                    s_to = int(s_to * multiplier) if s_to else None
                    
                    if s_from and s_to:
                        salary_label = f"от {s_from:,} до {s_to:,} ₽".replace(',', ' ')
                    elif s_from:
                        salary_label = f"от {s_from:,} ₽".replace(',', ' ')
                    elif s_to:
                        salary_label = f"до {s_to:,} ₽".replace(',', ' ')
                        
                    if gross:
                        salary_label += ' до вычета'
                
                # Fetch skills
                skills = [k['name'] for k in data.get('key_skills', [])]
                clean_desc = clean_html(data.get('description', ''))[:150] + '...'
                
                results.append({
                    "id": data['id'],
                    "title": data['name'],
                    "employer": employer,
                    "location": location,
                    "salaryLabel": salary_label,
                    "matchScore": random.randint(75, 98),
                    "skills": skills,
                    "descriptionPreview": clean_desc
                })
                
        return jsonify(results)
    
    except Exception as e:
        print(f"Error parsing HH: {e}")
        return jsonify([]), 500

if __name__ == '__main__':
    app.run(port=5000)
