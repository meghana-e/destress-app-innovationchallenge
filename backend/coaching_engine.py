import os
import json
import requests
from typing import Dict, List, Optional


def build_coaching_prompt(strain_index: float, top_factors: List[str],
                           burnout_risk: str, trend: str,
                           language: str = "English") -> str:
    """Build a privacy-safe prompt using only derived metrics."""
    factors_text = ", ".join(top_factors) if top_factors else "Multiple workplace factors"

    prompt = f"""You are a compassionate workplace wellness coach in Singapore.
A working adult has completed a stress check-in with these DERIVED metrics only:
- Stress Strain Index: {strain_index}/100
- Burnout Risk Level: {burnout_risk}
- Weekly Trend: {trend}
- Top Contributing Factors: {factors_text}

Please provide:
1. A warm, non-clinical 2-sentence observation about their situation
2. One specific, immediately actionable micro-intervention (under 5 minutes)
3. One encouraging closing sentence

Important rules:
- Do NOT diagnose or use clinical language
- Do NOT mention employer reporting
- Keep response under 100 words
- Respond in {language}
- Be culturally sensitive for a Singapore workplace context"""

    return prompt


def _get_factor_tip(factor: str, language: str = "English") -> str:
    """Generate tips based on the user's main stress factor."""
    
    tips = {
        "English": {
            "Long work hours": "Try the Pomodoro technique: work 25 minutes, rest 5 minutes. Set a hard stop time each day.",
            "Low managerial support": "Have a brief, positive check-in with your manager this week to align on priorities.",
            "Poor sleep": "Avoid screens 1 hour before bed. Keep your bedroom cool and consistent wake times help.",
            "Low exercise": "Take a 10-minute walk during lunch break or stretch at your desk every 2 hours.",
            "Low job satisfaction": "Identify one task you enjoy and prioritize it this week. Small wins build momentum.",
            "Low work-life balance": "Block 'personal time' in your calendar like a meeting. Protect it fiercely.",
            "Social isolation": "Reach out to one colleague for a 15-minute coffee chat this week.",
            "Family stress": "Set clear on/off times for work. Your family needs your presence, not just availability.",
        },
        "Chinese": {
            "Long work hours": "尝试番茄工作法：工作25分钟，休息5分钟。每天设定一个硬性结束时间。",
            "Low managerial support": "本周与经理进行一次简短、积极的沟通，统一工作优先级。",
            "Poor sleep": "睡前1小时避免看屏幕。保持卧室凉爽和一致的起床时间有帮助。",
            "Low exercise": "午饭时散步10分钟或每2小时在办公桌前进行拉伸。",
            "Low job satisfaction": "找出一项你喜欢的任务并本周优先完成。小的胜利会积累动力。",
            "Low work-life balance": "在日历中拉出'个人时间'。坚决保护它。",
            "Social isolation": "本周与一位同事进行15分钟的咖啡聊天。",
            "Family stress": "为工作设定明确的开始和结束时间。你的家人需要你的陪伴，而不仅仅是可用性。",
        },
        "Malay": {
            "Long work hours": "Cuba teknik Pomodoro: kerja 25 minit, istirahat 5 minit. Tetapkan waktu henti yang tetap setiap hari.",
            "Low managerial support": "Adakan pertemuan singkat dengan pengurus anda minggu ini untuk menyelaraskan prioriti.",
            "Poor sleep": "Elakkan skrin 1 jam sebelum tidur. Bilik tidur yang sejuk dan waktu bangun konsisten membantu.",
            "Low exercise": "Berjalan 10 minit semasa rehat tengah hari atau regangkan di meja kerja setiap 2 jam.",
            "Low job satisfaction": "Kenal pasti satu tugas yang anda suka dan prioritaskan minggu ini.",
            "Low work-life balance": "Blok 'masa peribadi' dalam kalendar anda seperti mesyuarat. Lindunginya dengan tegas.",
            "Social isolation": "Hubungi seorang rakan sekerja untuk perbincangan 15 minit minggu ini.",
            "Family stress": "Tetapkan waktu kerja dan tidur yang jelas. Keluarga anda memerlukan kehadiran anda, bukan hanya ketersediaan.",
        },
        "Tamil": {
            "Long work hours": "போமோடோரோ நுட்பத்தை முயற்சி செய்யுங்கள்: 25 நிமிடம் வேலை, 5 நிமிடம் ஓய்வு. ஒவ்வொரு நாளும் ஒரு கடினமான நிறுத்த நேரத்தை அமைக்கவும்.",
            "Low managerial support": "இந்த வாரம் உங்கள் மேலாளருடன் ஒரு சுருக்கமான, ஆக்கபூர்வமான சந்திப்பு கொண்டு குறிக்கோள்களை சீரமைக்கவும்.",
            "Poor sleep": "தூங்குவதற்கு 1 மணிநேரம் முன் திரைகளைத் தவிர்க்கவும். குளிர்ந்த படுக்கை அறை மற்றும் நிலையான விழிப்பு நேரம் உதவுகிறது.",
            "Low exercise": "மதிய உணவு நேரத்தில் 10 நிமிட நடைப்பயணம் அல்லது ஒவ்வொரு 2 மணிநேரத்திற்கும் உங்கள் மேজில் நீட்ட முயற்சி செய்யுங்கள்.",
            "Low job satisfaction": "நீங்கள் விரும்பும் ஒரு பணியைக் கண்டறிந்து இந்த வாரம் முன்னுரிமை கொடுக்கவும்.",
            "Low work-life balance": "உங்கள் நாட்காட்டில் 'ব្যক្తিগত সময়' ব্লক করুন। அதை দৃঢ়ভাবে রক্ষা করুন।",
            "Family stress": "வேலার জন்য স্পষ্ট সময় সীমা নির্ধারণ করুন। আপনার পরিবার আপনার উপস্থিতি প্রয়োজন, শুধু প্রাপ্যতা নয়।",
        }
    }

    # Get the tip for the given factor and language
    if language in tips:
        return tips[language].get(factor, tips[language].get("Low job satisfaction", "Focus on one small win this week."))
    
    # Fallback to English if language not found
    return tips["English"].get(factor, tips["English"].get("Low job satisfaction", "Focus on one small win this week."))


def get_rule_based_coaching(strain_index: float, top_factors: List[str],
                             burnout_risk: str, trend: str,
                             language: str = "English") -> Dict:
    """Rule-based fallback coaching when API is unavailable."""
    
    coaching_templates = {
        "English": {
            "High": {
                "increasing": "You're under significant stress and it's increasing. Please take immediate action: reach out to your manager or HR about support options, and prioritize one recovery activity today.",
                "stable": "Your stress levels are elevated and stable. Consider a change to your routine this week—even 15-minute breaks can help. Speak with someone you trust.",
                "decreasing": "Good news: your stress is decreasing! Keep up your current recovery efforts. You're heading in the right direction.",
            },
            "Moderate": {
                "increasing": "Your stress is moderate but growing. Now is the time to act before it escalates. Focus on one area you can control this week.",
                "stable": "Your stress is at a manageable level. Maintain your current coping strategies and check in with yourself regularly.",
                "decreasing": "Your stress is improving. Celebrate this progress and stick with what's working for you.",
            },
            "Low": {
                "increasing": "Your stress is low but starting to increase. Stay aware and practice preventive wellness habits.",
                "stable": "Great! Your stress is low and stable. Keep doing what you're doing.",
                "decreasing": "Excellent! Your wellness is improving. Maintain these positive habits.",
            }
        },
        "Chinese": {
            "High": {
                "increasing": "您的压力很大且在增加。请立即采取行动：向经理或人力资源部寻求支持，并优先考虑今天的一项恢复活动。",
                "stable": "您的压力水平高且稳定。考虑本周改变您的例程—即使是15分钟的休息也能帮助。与您信任的人交谈。",
                "decreasing": "好消息：您的压力在减少！继续您目前的恢复努力。您正朝着正确的方向前进。",
            },
            "Moderate": {
                "increasing": "您的压力适度但在增加。现在是采取行动的时候，以免升级。本周重点关注您可以控制的一个领域。",
                "stable": "您的压力处于可管理的水平。保持您目前的应对策略并定期自我检查。",
                "decreasing": "您的压力在改善。庆祝这一进展并坚持对您有效的方法。",
            },
            "Low": {
                "increasing": "您的压力很低但开始增加。保持警惕并养成预防性健康习惯。",
                "stable": "太好了！您的压力很低且稳定。继续做您正在做的事情。",
                "decreasing": "太棒了！您的健康在改善。保持这些积极的习惯。",
            }
        },
        "Malay": {
            "High": {
                "increasing": "Anda berada di bawah tekanan yang signifikan dan ia meningkat. Sila ambil tindakan segera: hubungi pengurus atau HR anda tentang pilihan sokongan, dan prioritaskan satu aktiviti pemulihan hari ini.",
                "stable": "Tahap tekanan anda tinggi dan stabil. Pertimbangkan perubahan kepada rutin anda minggu ini—bahkan rehat 15 minit dapat membantu. Berbicara dengan seseorang yang anda percayai.",
                "decreasing": "Berita bagus: tekanan anda berkurangan! Terus dengan usaha pemulihan anda yang sekarang. Anda sedang menuju ke arah yang betul.",
            },
            "Moderate": {
                "increasing": "Tekanan anda sederhana tetapi berkembang. Sekarang adalah masa yang tepat untuk bertindak sebelum ia meningkat. Fokus pada satu bidang yang anda boleh kawalan minggu ini.",
                "stable": "Tekanan anda berada pada tahap yang dapat diurus. Pertahankan strategi pengatasan semasa anda dan periksa diri anda secara teratur.",
                "decreasing": "Tekanan anda bertambah baik. Rayakan kemajuan ini dan terus dengan apa yang berkesan untuk anda.",
            },
            "Low": {
                "increasing": "Tekanan anda rendah tetapi mula meningkat. Kekal sedar dan praktik tabiat kesihatan pencegahan.",
                "stable": "Hebat! Tekanan anda rendah dan stabil. Terus buat apa yang anda buat.",
                "decreasing": "Cemerlang! Kesejahteraan anda bertambah baik. Mengekalkan tabiat positif ini.",
            }
        },
        "Tamil": {
            "High": {
                "increasing": "நீங்கள் குறிப்பிடத்தக்க அழுத்தத்தின் கீழ் உள்ளீர்கள் மற்றும் அது அதிகரிக்கிறது. உடனடி조치 எடுக்கவும்: உங்கள் மேலாளர் அல்லது HR ஐப் பற்றி সமர்థன விருப்பங்களைப் பெறுங்கள், மற்றும் இன்று ஒரு மீட்பு செயல்பாட்டுக்கு முன்னுரிமை கொடுங்கள்.",
                "stable": "உங்கள் அழுத்த நிலைகள் அதிகமாக மற்றும் நிலையானவை. இந்த வாரம் உங்கள் வழக்கத்திற்கு ஒரு மாற்றத்தைக் கவனியுங்கள்—15 நிமிட இடைவேலைகளும் உதவ முடியும். நீங்கள் நம்பும் யாருடனாவது பேசுங்கள்.",
                "decreasing": "நல்ல செய்திகள்: உங்கள் அழுத்தம் குறைந்து வருகிறது! உங்கள் தற்போதைய மீட்பு முயற்சிகளைத் தொடரவும். நீங்கள் சரியான திசையை நோக்கி செல்கிறீர்கள்.",
            },
            "Moderate": {
                "increasing": "உங்கள் அழுத்தம் மிதமான ஆனால் பெரிதாகிறது. இப்போது நடவடிக்கை எடுக்க வேண்டிய நேரம் முன்பு அது அதிகரிக்கிறது. இந்த வாரம் நீங்கள் கட்டுப்படுத்த முடிய ஒரு பகுதিতে கவனம் செலுத்தவும்.",
                "stable": "உங்கள் அழுத்தம் நிர்வகிக்கக்கூடிய மட்டத்தில் உள்ளது. உங்கள் தற்போதைய சாதனை உத்திகளைப் பராமரிக்கவும் மற்றும் தয়மாறு உங்களைச் சரிபார்க்கவும்.",
                "decreasing": "உங்கள் அழுத்தம் மேம்பட்டு வருகிறது. இந்த முன்னேற்றத்தைக் கொண்டாட வேண்டும் மற்றும் உங்களுக்குச் சாதகமான முறையை மாற்றி வைக்கவும்.",
            },
            "Low": {
                "increasing": "உங்கள் அழுத்தம் குறைவாக ஆனால் அதிகரிக்கத் தொடங்குகிறது. விழிப்புடன் இருங்கள் மற்றும் தடுப்பு நலக்கள் பயிற்சிகளை நடைமுறைபடுத்தவும்।",
                "stable": "சிறந்தது! உங்கள் அழுத்தம் குறைவாக மற்றும் நிலையானது. நீங்கள் செய்வதை தொடரவும்.",
                "decreasing": "அद்புதமான! உங்கள் நல்வாழ்வு மேம்பட்டு வருகிறது. இந்த நேர்மறை பழக்கவழக்கங்களைப் பராமரிக்கவும்.",
            }
        }
    }

    # Normalize burnout_risk to match template keys
    risk_level = burnout_risk if burnout_risk in coaching_templates.get(language, {}) else "Moderate"
    
    # Get appropriate message based on language, risk level, and trend
    lang_templates = coaching_templates.get(language, coaching_templates["English"])
    base_msg = lang_templates.get(risk_level, {}).get(trend, "Focus on your wellbeing this week.")
    
    # Add factor-specific tip
    primary_factor = top_factors[0] if top_factors else "work stress"
    tip = _get_factor_tip(primary_factor, language)
    
    coaching_text = f"{base_msg}\n\n💡 {tip}"

    return {
        "source": "Rule-based (MERaLiON pending)",
        "language": language,
        "coaching": coaching_text
    }


def get_meralion_coaching(strain_index: float, top_factors: List[str],
                          burnout_risk: str, trend: str,
                          language: str = "English") -> Dict:
    """
    Call the MERaLiON / SEA-LION API if available, otherwise use rule-based fallback.
    """
    
    api_key = os.getenv("MERALION_API_KEY", "").strip()
    api_url = os.getenv("MERALION_API_URL", "").strip()
    
    # If API key is not configured, use rule-based fallback
    if not api_key or not api_url:
        return get_rule_based_coaching(strain_index, top_factors, burnout_risk, trend, language)

    try:
        # Build the prompt
        prompt = build_coaching_prompt(strain_index, top_factors, burnout_risk, trend, language)
        
        # Prepare the request payload
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "meralion",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 150,
            "temperature": 0.7
        }
        
        # Call the API
        response = requests.post(api_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse the response
        result = response.json()
        coaching_text = result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
        if not coaching_text:
            # If response is empty, fall back to rule-based
            return get_rule_based_coaching(strain_index, top_factors, burnout_risk, trend, language)
        
        return {
            "source": "MERaLiON",
            "language": language,
            "coaching": coaching_text
        }
    
    except requests.exceptions.RequestException as e:
        # If API call fails, fall back to rule-based
        return get_rule_based_coaching(strain_index, top_factors, burnout_risk, trend, language)
    
    except (KeyError, ValueError) as e:
        # If response parsing fails, fall back to rule-based
        return get_rule_based_coaching(strain_index, top_factors, burnout_risk, trend, language)
