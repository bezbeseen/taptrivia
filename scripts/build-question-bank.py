#!/usr/bin/env python3
"""Build the SLAP 15 spoken-aloud trivia library.

Sources:
  - Existing local bank (cleaned)
  - The Trivia API (https://the-trivia-api.com)
  - Open Trivia Database (https://opentdb.com)
  - Curated party pack + generated public-fact questions
"""

from __future__ import annotations

import html
import json
import re
import ssl
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "src" / "data" / "questions.json"
LEGACY_PATH = ROOT / "src" / "data" / "legacy-questions.json"
PARTY_PATH = ROOT / "src" / "data" / "party-pack.json"
CACHE_DIR = Path("/tmp/slap15-trivia-cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

UA = "SLAP15/1.0 (party trivia table game)"
CTX = ssl.create_default_context()

CATEGORY_LABELS = {
    "arts_and_literature": "Arts & Literature",
    "arts & literature": "Arts & Literature",
    "film_and_tv": "Film & TV",
    "film & tv": "Film & TV",
    "entertainment: film": "Movies",
    "entertainment: television": "Television",
    "entertainment: music": "Music",
    "entertainment: books": "Books",
    "entertainment: musicals & theatres": "Musicals",
    "entertainment: video games": "Video Games",
    "entertainment: board games": "Board Games",
    "entertainment: comics": "Comics",
    "entertainment: japanese anime & manga": "Anime",
    "entertainment: cartoon & animations": "Cartoons",
    "food_and_drink": "Food & Drink",
    "food & drink": "Food & Drink",
    "general_knowledge": "General Knowledge",
    "general knowledge": "General Knowledge",
    "geography": "Geography",
    "history": "History",
    "music": "Music",
    "science": "Science",
    "science & nature": "Science",
    "science: computers": "Computers",
    "science: mathematics": "Math",
    "science: gadgets": "Gadgets",
    "society_and_culture": "Society & Culture",
    "society & culture": "Society & Culture",
    "sport_and_leisure": "Sports",
    "sport & leisure": "Sports",
    "sports": "Sports",
    "animals": "Animals",
    "celebrities": "Pop Culture",
    "politics": "Politics",
    "art": "Art",
    "vehicles": "Vehicles",
    "mythology": "Mythology",
    "movies": "Movies",
    "television": "Television",
    "pop culture": "Pop Culture",
}

WHICH_OF_RE = re.compile(
    r"\bwhich of (these|the following|the below|the above)\b|"
    r"\bwhich one of (these|the following)\b|"
    r"\bin the (image|picture|photo)\b|"
    r"\bshown (here|below|above)\b|"
    r"\btrue or false\b",
    re.I,
)
PREFIX_RE = re.compile(r"^\[([^\]]+)\]\s*")
SPACE_RE = re.compile(r"\s+")
TAG_RE = re.compile(r"<[^>]+>")
BAD_Q_RE = re.compile(
    r"\b(wait duplicate|wait that's|skip\.|not a question)\b",
    re.I,
)

TRIVIA_CATEGORIES = [
    "arts_and_literature",
    "film_and_tv",
    "food_and_drink",
    "general_knowledge",
    "geography",
    "history",
    "music",
    "science",
    "society_and_culture",
    "sport_and_leisure",
]


def get_json(url: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
        return json.loads(resp.read().decode("utf-8"))


def clean_text(value: str) -> str:
    text = html.unescape(str(value or ""))
    text = TAG_RE.sub("", text)
    text = (
        text.replace("\u00a0", " ")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )
    return SPACE_RE.sub(" ", text).strip()


def category_label(raw: str) -> str:
    key = clean_text(raw).lower()
    if key in CATEGORY_LABELS:
        return CATEGORY_LABELS[key]
    if key.startswith("entertainment:"):
        rest = key.split(":", 1)[1].strip().title()
        return rest or "Entertainment"
    if not key:
        return "General Knowledge"
    return clean_text(raw).replace("_", " ").title()


def question_key(text: str) -> str:
    t = PREFIX_RE.sub("", clean_text(text).lower())
    t = re.sub(r"[^a-z0-9 ]+", "", t)
    return SPACE_RE.sub(" ", t).strip()


def answer_key(text: str) -> str:
    t = clean_text(text).lower()
    t = re.sub(r"[^a-z0-9 ]+", "", t)
    return SPACE_RE.sub(" ", t).strip()


def looks_spoken(question: str, answer: str) -> bool:
    q = clean_text(question)
    a = clean_text(answer)
    if not q or not a:
        return False
    if len(q) < 16 or len(q) > 180:
        return False
    if len(a) < 1 or len(a) > 48:
        return False
    if WHICH_OF_RE.search(q) or BAD_Q_RE.search(q):
        return False
    if a.lower() in {"true", "false", "yes", "no"}:
        return False
    if "____" in q or "___" in q:
        return False
    return True


def ensure_question_mark(text: str) -> str:
    text = clean_text(text)
    if not text.endswith("?"):
        text = text.rstrip(".!") + "?"
    return text


def record(
    question: str,
    answer: str,
    difficulty: str,
    category: str,
    distractors: list[str] | None = None,
    source: str = "curated",
    niche: bool = False,
) -> dict | None:
    q = ensure_question_mark(question)
    a = clean_text(answer)
    if not looks_spoken(q, a):
        return None
    diff = difficulty
    if niche and diff == "hard":
        diff = "smart"
    if diff not in {"easy", "medium", "hard", "smart"}:
        diff = "medium"
    seen = {answer_key(a)}
    clean_d: list[str] = []
    for item in distractors or []:
        text = clean_text(item)
        key = answer_key(text)
        if not text or key in seen or len(text) > 48:
            continue
        seen.add(key)
        clean_d.append(text)
        if len(clean_d) == 3:
            break
    return {
        "question": q,
        "answer": a,
        "difficulty": diff,
        "category": category_label(category),
        "distractors": clean_d,
        "source": source,
    }


def normalize_existing(item: dict) -> dict | None:
    raw_q = clean_text(item.get("question", ""))
    answer = clean_text(item.get("answer", ""))
    category = "General Knowledge"
    match = PREFIX_RE.match(raw_q)
    if match:
        category = category_label(match.group(1))
        raw_q = raw_q[match.end() :].strip()
    q = raw_q
    q = re.sub(r"^Which continent contains (.+) located\?$", r"On which continent is \1 located?", q)
    q = re.sub(r"^Precisely identify the capital of (.+)\?$", r"What is the capital of \1?", q)
    q = re.sub(r"^Identify the capital of (.+)\?$", r"What is the capital of \1?", q)
    q = re.sub(r"^Name the capital of (.+)\?$", r"What is the capital of \1?", q)
    q = re.sub(r"^Precisely identify the chemical symbol for (.+)\?$", r"What is the chemical symbol for \1?", q)
    q = re.sub(r"^Identify the chemical symbol for (.+)\?$", r"What is the chemical symbol for \1?", q)
    q = re.sub(r"^Give the chemical symbol for (.+)\?$", r"What is the chemical symbol for \1?", q)
    q = re.sub(r"^Precisely identify the atomic number of (.+)\?$", r"What is the atomic number of \1?", q)
    q = re.sub(r"^Identify the atomic number of (.+)\?$", r"What is the atomic number of \1?", q)
    q = re.sub(r"^Name the author of (.+)\?$", r"Who wrote \1?", q)
    q = re.sub(r"^Which author wrote (.+)\?$", r"Who wrote \1?", q)
    q = re.sub(r"^Which author is responsible for (.+)\?$", r"Who wrote \1?", q)
    q = re.sub(r"^Name the director of (.+)\?$", r"Who directed \1?", q)
    q = re.sub(r"^Which director made the film (.+)\?$", r"Who directed \1?", q)
    q = re.sub(r"^Name the filmmaker behind (.+)\?$", r"Who directed \1?", q)
    q = re.sub(
        r"^Identify the person who is most closely associated with inventing or developing the (.+)\?$",
        r"Who is credited with inventing the \1?",
        q,
    )
    q = re.sub(r"^Identify the official currency of (.+)\?$", r"What is the currency of \1?", q)
    diff = str(item.get("difficulty") or "medium").lower()
    if diff == "medium-hard":
        diff = "hard"
    if any(s in q.lower() for s in ("chemical symbol", "atomic number", "chemical formula")):
        diff = "smart"
    return record(q, answer, diff, category, source="legacy")


def generated_facts() -> list[dict]:
    items: list[dict] = []

    easy_caps = [
        ("France", "Paris", ["Lyon", "Marseille", "Nice"]),
        ("Japan", "Tokyo", ["Osaka", "Kyoto", "Hiroshima"]),
        ("Italy", "Rome", ["Milan", "Naples", "Venice"]),
        ("Spain", "Madrid", ["Barcelona", "Seville", "Valencia"]),
        ("Germany", "Berlin", ["Munich", "Hamburg", "Frankfurt"]),
        ("United Kingdom", "London", ["Manchester", "Birmingham", "Edinburgh"]),
        ("United States", "Washington, D.C.", ["New York City", "Los Angeles", "Chicago"]),
        ("Canada", "Ottawa", ["Toronto", "Vancouver", "Montreal"]),
        ("Mexico", "Mexico City", ["Guadalajara", "Cancun", "Monterrey"]),
        ("China", "Beijing", ["Shanghai", "Hong Kong", "Guangzhou"]),
        ("India", "New Delhi", ["Mumbai", "Kolkata", "Bangalore"]),
        ("Russia", "Moscow", ["St. Petersburg", "Kiev", "Minsk"]),
        ("Brazil", "Brasilia", ["Rio de Janeiro", "Sao Paulo", "Salvador"]),
        ("Australia", "Canberra", ["Sydney", "Melbourne", "Perth"]),
        ("Egypt", "Cairo", ["Alexandria", "Luxor", "Giza"]),
        ("Greece", "Athens", ["Thessaloniki", "Sparta", "Crete"]),
        ("Ireland", "Dublin", ["Cork", "Galway", "Belfast"]),
        ("Portugal", "Lisbon", ["Porto", "Madrid", "Faro"]),
        ("Sweden", "Stockholm", ["Gothenburg", "Oslo", "Copenhagen"]),
        ("Norway", "Oslo", ["Bergen", "Stockholm", "Copenhagen"]),
        ("Denmark", "Copenhagen", ["Aarhus", "Oslo", "Stockholm"]),
        ("Netherlands", "Amsterdam", ["Rotterdam", "The Hague", "Utrecht"]),
        ("Belgium", "Brussels", ["Antwerp", "Bruges", "Ghent"]),
        ("Switzerland", "Bern", ["Zurich", "Geneva", "Basel"]),
        ("Austria", "Vienna", ["Salzburg", "Innsbruck", "Graz"]),
        ("Poland", "Warsaw", ["Krakow", "Gdansk", "Wroclaw"]),
        ("Turkey", "Ankara", ["Istanbul", "Izmir", "Antalya"]),
        ("South Korea", "Seoul", ["Busan", "Pyongyang", "Incheon"]),
        ("Thailand", "Bangkok", ["Phuket", "Chiang Mai", "Pattaya"]),
        ("Argentina", "Buenos Aires", ["Cordoba", "Mendoza", "Rosario"]),
    ]
    for country, capital, distractors in easy_caps:
        items.append(
            record(
                f"What is the capital of {country}?",
                capital,
                "easy",
                "Geography",
                distractors,
                "generated",
            )
        )

    medium_caps = [
        ("Kenya", "Nairobi", ["Mombasa", "Addis Ababa", "Kampala"]),
        ("Nigeria", "Abuja", ["Lagos", "Accra", "Kano"]),
        ("Morocco", "Rabat", ["Casablanca", "Marrakech", "Fes"]),
        ("Peru", "Lima", ["Cusco", "Quito", "La Paz"]),
        ("Chile", "Santiago", ["Valparaiso", "Lima", "Buenos Aires"]),
        ("Colombia", "Bogota", ["Medellin", "Cali", "Cartagena"]),
        ("New Zealand", "Wellington", ["Auckland", "Christchurch", "Hamilton"]),
        ("Hungary", "Budapest", ["Bucharest", "Belgrade", "Prague"]),
        ("Czech Republic", "Prague", ["Bratislava", "Vienna", "Budapest"]),
        ("Finland", "Helsinki", ["Oslo", "Stockholm", "Tallinn"]),
        ("Iceland", "Reykjavik", ["Oslo", "Helsinki", "Copenhagen"]),
        ("Ukraine", "Kyiv", ["Kharkiv", "Lviv", "Odesa"]),
        ("Vietnam", "Hanoi", ["Ho Chi Minh City", "Hue", "Da Nang"]),
        ("Philippines", "Manila", ["Cebu", "Davao", "Quezon City"]),
        ("Indonesia", "Jakarta", ["Bali", "Surabaya", "Bandung"]),
        ("Malaysia", "Kuala Lumpur", ["Singapore", "Penang", "Johor Bahru"]),
        ("Saudi Arabia", "Riyadh", ["Jeddah", "Mecca", "Doha"]),
        ("United Arab Emirates", "Abu Dhabi", ["Dubai", "Sharjah", "Doha"]),
        ("Israel", "Jerusalem", ["Tel Aviv", "Haifa", "Amman"]),
        ("Pakistan", "Islamabad", ["Karachi", "Lahore", "Kabul"]),
        ("Bangladesh", "Dhaka", ["Kolkata", "Chittagong", "Kathmandu"]),
        ("Nepal", "Kathmandu", ["Thimphu", "Pokhara", "Dhaka"]),
        ("Croatia", "Zagreb", ["Split", "Dubrovnik", "Ljubljana"]),
        ("Serbia", "Belgrade", ["Zagreb", "Sarajevo", "Sofia"]),
        ("Romania", "Bucharest", ["Budapest", "Sofia", "Belgrade"]),
        ("Bulgaria", "Sofia", ["Bucharest", "Belgrade", "Skopje"]),
        ("Slovakia", "Bratislava", ["Prague", "Vienna", "Budapest"]),
        ("Ecuador", "Quito", ["Guayaquil", "Lima", "Bogota"]),
        ("Uruguay", "Montevideo", ["Buenos Aires", "Asuncion", "Santiago"]),
        ("Cuba", "Havana", ["Santiago de Cuba", "Miami", "Kingston"]),
    ]
    for country, capital, distractors in medium_caps:
        items.append(
            record(
                f"What is the capital of {country}?",
                capital,
                "medium",
                "Geography",
                distractors,
                "generated",
            )
        )

    hard_caps = [
        ("Kazakhstan", "Astana", ["Almaty", "Tashkent", "Bishkek"]),
        ("Uzbekistan", "Tashkent", ["Samarkand", "Bishkek", "Dushanbe"]),
        ("Mongolia", "Ulaanbaatar", ["Astana", "Bishkek", "Tashkent"]),
        ("Bhutan", "Thimphu", ["Kathmandu", "Paro", "Dhaka"]),
        ("Laos", "Vientiane", ["Phnom Penh", "Hanoi", "Yangon"]),
        ("Cambodia", "Phnom Penh", ["Siem Reap", "Vientiane", "Ho Chi Minh City"]),
        ("Myanmar", "Naypyidaw", ["Yangon", "Mandalay", "Bangkok"]),
        ("Sri Lanka", "Sri Jayawardenepura Kotte", ["Colombo", "Kandy", "Galle"]),
        ("Ghana", "Accra", ["Lagos", "Abuja", "Kumasi"]),
        ("Ethiopia", "Addis Ababa", ["Nairobi", "Khartoum", "Asmara"]),
        ("Tanzania", "Dodoma", ["Dar es Salaam", "Nairobi", "Kampala"]),
        ("Uganda", "Kampala", ["Nairobi", "Kigali", "Dodoma"]),
        ("Rwanda", "Kigali", ["Kampala", "Bujumbura", "Nairobi"]),
        ("Senegal", "Dakar", ["Bamako", "Conakry", "Banjul"]),
        ("Mali", "Bamako", ["Dakar", "Ouagadougou", "Niamey"]),
        ("Burkina Faso", "Ouagadougou", ["Bamako", "Niamey", "Accra"]),
        ("Angola", "Luanda", ["Kinshasa", "Maputo", "Lagos"]),
        ("Mozambique", "Maputo", ["Luanda", "Harare", "Lusaka"]),
        ("Zimbabwe", "Harare", ["Lusaka", "Maputo", "Gaborone"]),
        ("Zambia", "Lusaka", ["Harare", "Lilongwe", "Gaborone"]),
        ("Botswana", "Gaborone", ["Lusaka", "Harare", "Windhoek"]),
        ("Namibia", "Windhoek", ["Gaborone", "Lusaka", "Maputo"]),
        ("Madagascar", "Antananarivo", ["Maputo", "Lusaka", "Harare"]),
        ("Papua New Guinea", "Port Moresby", ["Suva", "Honiara", "Port Vila"]),
        ("Fiji", "Suva", ["Nadi", "Port Vila", "Apia"]),
        ("Estonia", "Tallinn", ["Riga", "Vilnius", "Helsinki"]),
        ("Latvia", "Riga", ["Tallinn", "Vilnius", "Helsinki"]),
        ("Lithuania", "Vilnius", ["Riga", "Tallinn", "Minsk"]),
        ("Belarus", "Minsk", ["Vilnius", "Kyiv", "Riga"]),
        ("Georgia", "Tbilisi", ["Yerevan", "Baku", "Ankara"]),
        ("Armenia", "Yerevan", ["Tbilisi", "Baku", "Ankara"]),
        ("Azerbaijan", "Baku", ["Tbilisi", "Yerevan", "Ashgabat"]),
        ("Kyrgyzstan", "Bishkek", ["Tashkent", "Dushanbe", "Almaty"]),
        ("Tajikistan", "Dushanbe", ["Tashkent", "Bishkek", "Ashgabat"]),
        ("Turkmenistan", "Ashgabat", ["Tashkent", "Bishkek", "Dushanbe"]),
        ("Albania", "Tirana", ["Skopje", "Pristina", "Podgorica"]),
        ("North Macedonia", "Skopje", ["Tirana", "Sofia", "Pristina"]),
        ("Montenegro", "Podgorica", ["Tirana", "Sarajevo", "Belgrade"]),
        ("Moldova", "Chisinau", ["Bucharest", "Kyiv", "Odessa"]),
        ("Jordan", "Amman", ["Damascus", "Beirut", "Baghdad"]),
        ("Lebanon", "Beirut", ["Damascus", "Amman", "Tel Aviv"]),
        ("Syria", "Damascus", ["Aleppo", "Beirut", "Amman"]),
        ("Iraq", "Baghdad", ["Basra", "Mosul", "Tehran"]),
        ("Iran", "Tehran", ["Baghdad", "Isfahan", "Shiraz"]),
        ("Oman", "Muscat", ["Dubai", "Abu Dhabi", "Doha"]),
        ("Qatar", "Doha", ["Dubai", "Abu Dhabi", "Manama"]),
        ("Kuwait", "Kuwait City", ["Doha", "Manama", "Riyadh"]),
        ("Bahrain", "Manama", ["Doha", "Kuwait City", "Muscat"]),
        ("Yemen", "Sanaa", ["Aden", "Riyadh", "Muscat"]),
        ("Afghanistan", "Kabul", ["Islamabad", "Tehran", "Kandahar"]),
        ("Bolivia", "La Paz", ["Sucre", "Santa Cruz", "Quito"]),
        ("Paraguay", "Asuncion", ["Montevideo", "La Paz", "Buenos Aires"]),
        ("Honduras", "Tegucigalpa", ["San Salvador", "Managua", "Guatemala City"]),
        ("Nicaragua", "Managua", ["Tegucigalpa", "San Jose", "San Salvador"]),
        ("Costa Rica", "San Jose", ["San Salvador", "Panama City", "Managua"]),
        ("Panama", "Panama City", ["San Jose", "Bogota", "Caracas"]),
        ("Jamaica", "Kingston", ["Montego Bay", "Havana", "Nassau"]),
        ("Haiti", "Port-au-Prince", ["Santo Domingo", "Kingston", "Havana"]),
        ("Dominican Republic", "Santo Domingo", ["Port-au-Prince", "San Juan", "Havana"]),
        ("Tunisia", "Tunis", ["Algiers", "Tripoli", "Rabat"]),
        ("Algeria", "Algiers", ["Tunis", "Rabat", "Tripoli"]),
        ("Libya", "Tripoli", ["Benghazi", "Tunis", "Algiers"]),
        ("Sudan", "Khartoum", ["Juba", "Addis Ababa", "Cairo"]),
        ("Cameroon", "Yaounde", ["Douala", "Lagos", "Libreville"]),
        ("Ivory Coast", "Yamoussoukro", ["Abidjan", "Accra", "Dakar"]),
        ("Malawi", "Lilongwe", ["Lusaka", "Harare", "Maputo"]),
        ("Mauritius", "Port Louis", ["Victoria", "Antananarivo", "Maputo"]),
        ("Seychelles", "Victoria", ["Port Louis", "Male", "Port Vila"]),
        ("Maldives", "Male", ["Colombo", "Victoria", "Male'"]),
        ("Brunei", "Bandar Seri Begawan", ["Kuala Lumpur", "Jakarta", "Singapore"]),
        ("Timor-Leste", "Dili", ["Jakarta", "Dili", "Port Moresby"]),
    ]
    for country, capital, distractors in hard_caps:
        items.append(
            record(
                f"What is the capital of {country}?",
                capital,
                "smart",
                "Geography",
                distractors,
                "generated",
            )
        )

    symbols = [
        ("gold", "Au", ["Ag", "Gd", "Go"]),
        ("silver", "Ag", ["Au", "Si", "Sr"]),
        ("iron", "Fe", ["Ir", "In", "I"]),
        ("lead", "Pb", ["Ld", "Le", "Pl"]),
        ("tin", "Sn", ["Ti", "Tn", "T"]),
        ("mercury", "Hg", ["Me", "Mc", "Mr"]),
        ("potassium", "K", ["P", "Po", "Pt"]),
        ("sodium", "Na", ["So", "Sd", "S"]),
        ("tungsten", "W", ["Tu", "Tg", "Tn"]),
        ("copper", "Cu", ["Co", "Cp", "Cr"]),
        ("helium", "He", ["H", "Hl", "Hy"]),
        ("oxygen", "O", ["Ox", "Og", "On"]),
        ("carbon", "C", ["Ca", "Co", "Cb"]),
        ("nitrogen", "N", ["Ni", "Nt", "Ng"]),
        ("calcium", "Ca", ["C", "Cl", "Cs"]),
        ("chlorine", "Cl", ["C", "Ch", "Co"]),
        ("fluorine", "F", ["Fl", "Fr", "Fe"]),
        ("neon", "Ne", ["N", "No", "Na"]),
        ("argon", "Ar", ["Ag", "A", "Rn"]),
        ("zinc", "Zn", ["Z", "Zi", "Zr"]),
        ("nickel", "Ni", ["N", "Nk", "Nc"]),
        ("platinum", "Pt", ["Pl", "Pa", "P"]),
        ("uranium", "U", ["Ur", "Un", "Um"]),
        ("plutonium", "Pu", ["Pl", "Pt", "Po"]),
        ("silicon", "Si", ["S", "Sn", "Sc"]),
        ("phosphorus", "P", ["Ph", "Po", "F"]),
        ("sulfur", "S", ["Su", "Sf", "Si"]),
        ("iodine", "I", ["Io", "Id", "In"]),
        ("bromine", "Br", ["B", "Bo", "Bm"]),
        ("radon", "Rn", ["Ra", "Rd", "R"]),
    ]
    for name, symbol, distractors in symbols:
        items.append(
            record(
                f"What is the chemical symbol for {name}?",
                symbol,
                "smart",
                "Science",
                distractors,
                "generated",
            )
        )

    authors = [
        ("easy", "Who wrote Pride and Prejudice?", "Jane Austen", ["Charlotte Bronte", "George Eliot", "Emily Bronte"]),
        ("easy", "Who wrote Romeo and Juliet?", "William Shakespeare", ["Christopher Marlowe", "Ben Jonson", "John Milton"]),
        ("easy", "Who wrote 1984?", "George Orwell", ["Aldous Huxley", "Ray Bradbury", "Kurt Vonnegut"]),
        ("easy", "Who wrote Harry Potter and the Sorcerer's Stone?", "J. K. Rowling", ["Philip Pullman", "Rick Riordan", "Suzanne Collins"]),
        ("medium", "Who wrote The Great Gatsby?", "F. Scott Fitzgerald", ["Ernest Hemingway", "John Steinbeck", "William Faulkner"]),
        ("medium", "Who wrote To Kill a Mockingbird?", "Harper Lee", ["Truman Capote", "Flannery O'Connor", "Carson McCullers"]),
        ("medium", "Who wrote The Catcher in the Rye?", "J. D. Salinger", ["John Steinbeck", "Jack Kerouac", "Kurt Vonnegut"]),
        ("medium", "Who wrote Frankenstein?", "Mary Shelley", ["Bram Stoker", "Jane Austen", "Emily Bronte"]),
        ("hard", "Who wrote One Hundred Years of Solitude?", "Gabriel Garcia Marquez", ["Isabel Allende", "Mario Vargas Llosa", "Jorge Luis Borges"]),
        ("hard", "Who wrote Beloved?", "Toni Morrison", ["Maya Angelou", "Alice Walker", "Zora Neale Hurston"]),
        ("hard", "Who wrote The Handmaid's Tale?", "Margaret Atwood", ["Ursula K. Le Guin", "Octavia Butler", "Doris Lessing"]),
        ("smart", "Who wrote The Brothers Karamazov?", "Fyodor Dostoevsky", ["Leo Tolstoy", "Anton Chekhov", "Ivan Turgenev"]),
        ("smart", "Who wrote Ulysses?", "James Joyce", ["Samuel Beckett", "Oscar Wilde", "W. B. Yeats"]),
        ("smart", "Who wrote Paradise Lost?", "John Milton", ["John Donne", "Edmund Spenser", "William Blake"]),
        ("smart", "Who wrote The Metamorphosis?", "Franz Kafka", ["Thomas Mann", "Hermann Hesse", "Bertolt Brecht"]),
        ("smart", "Who wrote The Waste Land?", "T. S. Eliot", ["Ezra Pound", "W. B. Yeats", "Wallace Stevens"]),
        ("smart", "Who wrote Invisible Man, the 1952 novel?", "Ralph Ellison", ["James Baldwin", "Richard Wright", "Toni Morrison"]),
        ("smart", "Who wrote The Tale of Genji?", "Murasaki Shikibu", ["Sei Shonagon", "Yoshida Kenko", "Basho"]),
    ]
    for diff, q, a, d in authors:
        items.append(record(q, a, diff, "Arts & Literature", d, "generated"))

    return [item for item in items if item]


def load_party_pack() -> list[dict]:
    if not PARTY_PATH.exists():
        return []
    raw = json.loads(PARTY_PATH.read_text())
    out = []
    for item in raw:
        rec = record(
            item["question"],
            item["answer"],
            item.get("difficulty", "medium"),
            item.get("category", "General Knowledge"),
            item.get("distractors") or [],
            "party",
        )
        if rec:
            out.append(rec)
    return out


def parse_trivia_api(item: dict) -> dict | None:
    question = item.get("question")
    if isinstance(question, dict):
        question = question.get("text") or ""
    answer = item.get("correctAnswer") or item.get("correct_answer") or ""
    distractors = item.get("incorrectAnswers") or item.get("incorrect_answers") or []
    diff = str(item.get("difficulty") or "medium").lower()
    niche = bool(item.get("isNiche"))
    if item.get("type") == "image_choice":
        return None
    return record(
        str(question),
        str(answer),
        diff,
        str(item.get("category") or "General Knowledge"),
        list(distractors),
        "trivia-api",
        niche=niche,
    )


def parse_opentdb(item: dict) -> dict | None:
    if item.get("type") == "boolean":
        return None
    q = item.get("question") or ""
    a = item.get("correct_answer") or ""
    distractors = item.get("incorrect_answers") or []
    diff = str(item.get("difficulty") or "medium").lower()
    category = str(item.get("category") or "General Knowledge")
    smart_cats = (
        "science: mathematics",
        "science: computers",
        "mythology",
        "history",
        "science & nature",
    )
    niche = diff == "hard" and category.lower() in smart_cats
    return record(q, a, diff, category, list(distractors), "opentdb", niche=niche)


def fetch_trivia_api(limit_unique: int = 8000, max_requests: int = 280) -> list[dict]:
    cache = CACHE_DIR / "trivia-api.json"
    if cache.exists() and cache.stat().st_size > 1000:
        print(f"Using cached Trivia API dump ({cache})")
        return json.loads(cache.read_text())

    lock = Lock()
    by_id: dict[str, dict] = {}
    requests_done = 0

    def one(cat: str, diff: str, kind: str) -> list[dict]:
        url = (
            "https://the-trivia-api.com/v2/questions"
            f"?limit=50&categories={cat}&difficulties={diff}&types={kind}"
        )
        try:
            data = get_json(url)
            return data if isinstance(data, list) else []
        except Exception as exc:
            print("Trivia API miss:", cat, diff, kind, exc)
            return []

    jobs = [
        (cat, diff, kind)
        for cat in TRIVIA_CATEGORIES
        for diff in ("easy", "medium", "hard")
        for kind in ("text_choice",)
    ]
    empty_streak = 0
    print(f"Fetching The Trivia API ({len(jobs)} buckets)...")
    while len(by_id) < limit_unique and requests_done < max_requests and empty_streak < 18:
        batch = jobs[requests_done % len(jobs) : requests_done % len(jobs) + 8]
        if len(batch) < 8:
            batch = (jobs * 2)[requests_done % len(jobs) : requests_done % len(jobs) + 8]
        new = 0
        with ThreadPoolExecutor(max_workers=8) as pool:
            futs = [pool.submit(one, *job) for job in batch]
            for fut in as_completed(futs):
                requests_done += 1
                for item in fut.result():
                    qid = str(item.get("id") or question_key(str(item.get("question"))))
                    parsed = parse_trivia_api(item)
                    if not parsed:
                        continue
                    with lock:
                        if qid not in by_id:
                            by_id[qid] = parsed
                            new += 1
        if new == 0:
            empty_streak += 1
        else:
            empty_streak = 0
        print(f"  Trivia API unique={len(by_id)} requests={requests_done} new={new}")
        time.sleep(0.12)

    rows = list(by_id.values())
    cache.write_text(json.dumps(rows))
    return rows


def fetch_opentdb() -> list[dict]:
    cache = CACHE_DIR / "opentdb.json"
    if cache.exists() and cache.stat().st_size > 1000:
        print(f"Using cached OpenTDB dump ({cache})")
        return json.loads(cache.read_text())

    token = ""
    try:
        token = get_json("https://opentdb.com/api_token.php?command=request").get("token") or ""
    except Exception as exc:
        print("OpenTDB token failed:", exc)

    rows: list[dict] = []
    seen = set()
    print("Fetching Open Trivia DB...")
    for i in range(90):
        url = "https://opentdb.com/api.php?amount=50&type=multiple"
        if token:
            url += f"&token={token}"
        try:
            payload = get_json(url)
        except Exception as exc:
            print("OpenTDB error:", exc)
            time.sleep(6)
            continue
        code = payload.get("response_code")
        if code in (1, 4):
            print("OpenTDB exhausted")
            break
        if code == 5:
            print("OpenTDB rate limited, waiting")
            time.sleep(6)
            continue
        if code != 0:
            print("OpenTDB code", code)
            time.sleep(5.2)
            continue
        added = 0
        for item in payload.get("results") or []:
            parsed = parse_opentdb(item)
            if not parsed:
                continue
            key = question_key(parsed["question"])
            if key in seen:
                continue
            seen.add(key)
            rows.append(parsed)
            added += 1
        print(f"  OpenTDB unique={len(rows)} batch={i + 1} new={added}")
        time.sleep(5.2)

    cache.write_text(json.dumps(rows))
    return rows


def merge(banks: list[list[dict]]) -> list[dict]:
    seen_q: set[str] = set()
    seen_pair: set[tuple[str, str]] = set()
    out: list[dict] = []
    for bank in banks:
        for item in bank:
            if not item:
                continue
            qk = question_key(item["question"])
            pair = (qk, answer_key(item["answer"]))
            if qk in seen_q or pair in seen_pair:
                continue
            seen_q.add(qk)
            seen_pair.add(pair)
            out.append(
                {
                    "question": item["question"],
                    "answer": item["answer"],
                    "difficulty": item["difficulty"],
                    "category": item["category"],
                    "distractors": item.get("distractors") or [],
                }
            )
    return out


def main() -> None:
    legacy = []
    if LEGACY_PATH.exists():
        raw = json.loads(LEGACY_PATH.read_text())
        for item in raw:
            rec = normalize_existing(item)
            if rec:
                legacy.append(rec)
        print("Legacy kept", len(legacy))

    party = load_party_pack()
    generated = generated_facts()
    print("Party pack", len(party), "generated", len(generated))

    trivia = fetch_trivia_api()
    print("Trivia API kept", len(trivia))
    opentdb = fetch_opentdb()
    print("OpenTDB kept", len(opentdb))

    # Prefer curated wording, then APIs, then the old padded bank.
    merged = merge([party, generated, trivia, opentdb, legacy])
    counts: dict[str, int] = {}
    for item in merged:
        counts[item["difficulty"]] = counts.get(item["difficulty"], 0) + 1
    print("Merged", len(merged), counts)

    # If Smart AF is thin, promote remaining hard science/history/geography.
    if counts.get("smart", 0) < 750:
        for item in merged:
            if item["difficulty"] != "hard":
                continue
            if item["category"] in {
                "Science",
                "History",
                "Geography",
                "Arts & Literature",
                "Math",
                "Computers",
                "Mythology",
                "Books",
                "Society & Culture",
            }:
                item["difficulty"] = "smart"
                counts["smart"] = counts.get("smart", 0) + 1
                counts["hard"] = counts.get("hard", 0) - 1
                if counts["smart"] >= 750:
                    break
        print("After promote", counts)

    OUT_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n")
    print("Wrote", OUT_PATH, "bytes", OUT_PATH.stat().st_size)


if __name__ == "__main__":
    main()
