"""
Agent 1 — Behavior Monitor
Analyzes raw transaction data and outputs behavioral signals.
No ML needed — rule-based pattern detection on Pandas DataFrames.
"""

import pandas as pd
from collections import defaultdict
from typing import Any


def run(customer: dict[str, Any]) -> dict[str, Any]:
    transactions = customer.get("transactions", [])
    if not transactions:
        return {"error": "No transactions found"}

    df = pd.DataFrame(transactions)
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M").astype(str)

    signals = {}

    # --- Salary trend ---
    salary_df = df[df["category"] == "salary"].copy()
    salary_by_month = salary_df.groupby("month")["amount"].sum().sort_index()
    salaries = salary_by_month.tolist()
    signals["salary_history"] = {k: float(v) for k, v in salary_by_month.items()}
    if len(salaries) >= 2:
        pct_change = ((salaries[-1] - salaries[0]) / salaries[0]) * 100
        signals["salary_trend_pct"] = round(pct_change, 2)
        signals["salary_trend_direction"] = (
            "increasing" if pct_change > 5 else
            "decreasing" if pct_change < -5 else
            "stable"
        )
    else:
        signals["salary_trend_pct"] = 0
        signals["salary_trend_direction"] = "unknown"

    # --- Location change detection ---
    merchant_cities: dict[str, set] = defaultdict(set)
    city_keywords = {
        "bengaluru": "Bengaluru", "bangalore": "Bengaluru",
        "mumbai": "Mumbai", "pune": "Pune",
        "hyderabad": "Hyderabad", "chennai": "Chennai",
        "lucknow": "Lucknow", "kochi": "Kochi", "delhi": "Delhi",
        "mysuru": "Mysuru", "mysore": "Mysuru",
        "jaipur": "Jaipur", "kolkata": "Kolkata",
        "patna": "Patna", "thiruvananthapuram": "Thiruvananthapuram",
        "nagpur": "Nagpur", "indore": "Indore", "surat": "Surat",
        "ahmedabad": "Ahmedabad", "coimbatore": "Coimbatore",
    }
    for _, row in df.iterrows():
        desc = str(row.get("description", "")).lower()
        merchant = str(row.get("merchant", "")).lower()
        combined = desc + " " + merchant
        month = row["month"]
        for kw, city in city_keywords.items():
            if kw in combined:
                merchant_cities[month].add(city)

    all_cities = set()
    for cities in merchant_cities.values():
        all_cities.update(cities)

    if len(all_cities) > 1:
        months_sorted = sorted(merchant_cities.keys())
        first_cities = merchant_cities.get(months_sorted[0], set())
        last_cities = merchant_cities.get(months_sorted[-1], set())
        new_cities = last_cities - first_cities
        signals["location_change_detected"] = bool(new_cities)
        signals["cities_detected"] = list(all_cities)
        signals["new_city"] = list(new_cities)[0] if new_cities else None
        signals["original_city"] = list(first_cities)[0] if first_cities else customer.get("city")
    else:
        signals["location_change_detected"] = False
        signals["cities_detected"] = list(all_cities)
        signals["new_city"] = None
        signals["original_city"] = customer.get("city")

    # --- EMI detection ---
    # Detects BOTH: first-ever EMI and new additional EMI on top of existing ones
    emi_df = df[df["category"] == "emi"].copy()
    all_months = sorted(df["month"].unique().tolist())
    first_month = all_months[0] if all_months else None

    new_emi = False
    emi_amount = 0
    emi_merchant = None

    if not emi_df.empty and first_month:
        # Get unique merchants per month
        first_month_merchants = set(emi_df[emi_df["month"] == first_month]["merchant"].str.lower())
        later_months_merchants = set(emi_df[emi_df["month"] != first_month]["merchant"].str.lower())

        # New EMI = appears in later months but NOT in first month
        truly_new_merchants = later_months_merchants - first_month_merchants

        if truly_new_merchants or (not first_month_merchants and later_months_merchants):
            new_emi = True
            new_rows = emi_df[emi_df["merchant"].str.lower().isin(
                truly_new_merchants if truly_new_merchants else later_months_merchants
            )]
            if not new_rows.empty:
                emi_amount = abs(int(new_rows["amount"].mean()))
                emi_merchant = new_rows.iloc[0].get("merchant", "Unknown")

    signals["emi_detected"] = new_emi
    signals["emi_amount"] = emi_amount
    signals["emi_merchant"] = emi_merchant

    # --- Insurance gap detection ---
    insurance_keywords = ["insurance", "lic", "life ins", "health ins", "term plan", "policy premium"]
    insurance_found = df["description"].str.lower().str.contains(
        "|".join(insurance_keywords), na=False
    ).any()
    signals["insurance_premium_found"] = bool(insurance_found)

    # --- Baby / family event detection ---
    baby_keywords = ["baby", "firstcry", "mothercare", "baby formula", "delivery charges",
                     "prenatal", "kiddieland", "johnsons baby", "infant"]
    wedding_keywords = ["wedding", "bridal", "jewellers", "kalyan", "marriage hall",
                        "mehendi", "honeymoon", "mangalsutra", "silks saree"]

    baby_txn_count = df["description"].str.lower().str.contains(
        "|".join(baby_keywords), na=False
    ).sum()
    wedding_txn_count = df["description"].str.lower().str.contains(
        "|".join(wedding_keywords), na=False
    ).sum()

    signals["baby_spend_detected"] = int(baby_txn_count) >= 2
    signals["baby_spend_count"] = int(baby_txn_count)
    signals["wedding_spend_detected"] = int(wedding_txn_count) >= 2
    signals["wedding_spend_count"] = int(wedding_txn_count)

    # --- Spending pattern ---
    debit_df = df[df["type"] == "debit"].copy()
    category_totals = debit_df.groupby("category")["amount"].sum().abs().to_dict()
    signals["spending_by_category"] = {k: round(float(v), 2) for k, v in category_totals.items()}

    # --- Average monthly balance ---
    balances = [b["balance"] for b in customer.get("account_balance_history", [])]
    signals["avg_monthly_balance"] = round(sum(balances) / len(balances), 2) if balances else 0
    signals["balance_trend"] = (
        "growing" if len(balances) >= 2 and balances[-1] > balances[0] else
        "declining" if len(balances) >= 2 and balances[-1] < balances[0] else
        "stable"
    )

    return {
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "signals": signals,
    }
