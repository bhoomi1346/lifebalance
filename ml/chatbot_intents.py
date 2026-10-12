"""
Example questions for each chatbot intent (SRS FR-7.2).
Each intent has 15 examples. Add more later if the classifier confuses two intents.
"""

INTENTS = {
    "greeting": [
        "hi", "hello", "hey there", "good morning", "good evening", "hi there",
        "hello bot", "hey, how are you", "good afternoon", "hiya", "greetings",
        "hi life balance", "morning", "hello, are you there", "hey",
    ],
    "sleep": [
        "how was my sleep this week", "how much sleep should I get",
        "I cannot sleep well", "why am I so tired in the morning",
        "what is a good bedtime", "how many hours of sleep do I need",
        "my sleep was short last night", "tips for better sleep",
        "I wake up many times at night", "how can I fall asleep faster",
        "is seven hours of sleep enough", "my sleep schedule is messed up",
        "how did I sleep yesterday", "what helps me sleep better", "I feel sleepy all day",
    ],
    "stress": [
        "what was my stress level yesterday", "I feel stressed all the time",
        "how can I calm down", "my stress is very high", "why do I feel so anxious at work",
        "how do I manage stress", "I feel overwhelmed", "is my stress getting worse",
        "how can I relax after work", "stress relief tips", "I am under a lot of pressure",
        "my stress level this week", "I cannot switch off from work stress",
        "how do I handle pressure", "tips to reduce stress",
    ],
    "work_life_balance": [
        "how is my work life balance", "I work too many hours",
        "how do I separate work and home", "my balance score is low",
        "how can I improve my work life balance", "I never have time for myself",
        "I cannot stop checking emails after work", "how do I set work boundaries",
        "what is a good number of working hours", "my work is taking over my life",
        "I need more time for family", "how can I switch off after office hours",
        "balance between home and office", "how is my balance score", "I have no personal time",
    ],
    "activity": [
        "how active was I this week", "how much exercise do I need",
        "give me a simple workout", "how many steps should I walk",
        "I never exercise", "what counts as physical activity",
        "can you suggest an easy exercise", "how can I move more during the day",
        "I sit all day at work", "is a short walk enough",
        "how many minutes of activity per day", "stretches for desk workers",
        "I want to be more active", "did I hit my activity target", "how do I start exercising",
    ],
    "hydration_food": [
        "how much water should I drink", "am I drinking enough water",
        "I forget to drink water", "what should I eat for lunch",
        "my meals are irregular", "how can I eat better", "healthy snack ideas",
        "how often should I eat", "is skipping breakfast bad",
        "tips for regular meal times", "how much water is too much",
        "I often skip meals", "what is a balanced diet", "remind me to hydrate",
        "my food habits are not good",
    ],
    "tips": [
        "give me a tip for today", "any advice for me", "what should I do today",
        "suggest something to improve my day", "I need a suggestion",
        "what can I change this week", "give me a healthy habit to start",
        "what is one thing I can do now", "recommend something for me",
        "any ideas to feel better", "what should I focus on", "help me plan my day",
        "what would you suggest", "quick tip please", "how can I feel better today",
    ],
    "report_request": [
        "show me my weekly report", "can I see my monthly report",
        "download my report", "give me a summary of this month",
        "open the weekly report", "I want my daily report", "send me my report",
        "how was my week in numbers", "report for last month please",
        "show my progress report", "generate a PDF report", "export my data to excel",
        "where is my report", "make a report for this week", "show my summary",
    ],
    "help": [
        "help", "what can you do", "how do I use this app", "what are your features",
        "I need help", "how does this work", "show me what to ask",
        "what questions can I ask you", "how do I log my day", "where do I see my charts",
        "how do I use the simulator", "what does the stress score mean",
        "how do I change my profile", "can you guide me", "what can I type here",
    ],
}