import os, httpx, asyncio
from dotenv import load_dotenv
load_dotenv()
from agents.personalization_agent import run

customer={'id': '1', 'name': 'Priya'}
event={'top_event': 'salary_hike', 'confidence': 0.95}

async def main():
    try:
        await run(customer, event)
        print("Success")
    except httpx.HTTPStatusError as e:
        print('ERROR_TEXT:', e.response.text)

asyncio.run(main())
