from app.models.party import Party
from app.models.transaction import Transaction
from typing import List
from datetime import datetime, timezone

def calculate_party_score(party: Party, transactions: List[Transaction]) -> float:
    """
    Score Range: 0-100
    Factors:
    - Purchase Frequency (30%)
    - Revenue (30%)
    - Recency (20%)
    - Payment Behaviour (10%) (assumed good if frequent)
    - Growth Trend (10%)
    """
    score = 0.0

    # 1. Purchase Frequency (up to 30 points)
    # Let's say 20+ purchases is max score
    freq = party.purchase_frequency
    freq_score = min(30, (freq / 20) * 30)
    score += freq_score

    # 2. Revenue (up to 30 points)
    # Let's say 500k+ is max score
    rev = party.revenue_generated
    rev_score = min(30, (rev / 500000) * 30)
    score += rev_score

    # 3. Recency (up to 20 points)
    recency_score = 0
    if transactions:
        latest_txn = max((t.date for t in transactions if t.date), default=None)
        if latest_txn:
            # ensure datetime is timezone aware
            now = datetime.now(timezone.utc)
            if latest_txn.tzinfo is None:
                latest_txn = latest_txn.replace(tzinfo=timezone.utc)
            days_ago = (now - latest_txn).days
            
            if days_ago <= 30:
                recency_score = 20
            elif days_ago <= 90:
                recency_score = 15
            elif days_ago <= 180:
                recency_score = 10
            elif days_ago <= 365:
                recency_score = 5
    score += recency_score

    # 4. Payment Behaviour & Growth Trend (Assumed constant 20 points for now as placeholders)
    score += 15

    return min(100.0, score)

def calculate_customer_intelligence(party: Party, transactions: List[Transaction]):
    clv = party.revenue_generated * 1.2 # predictive CLV simplified
    aov = party.revenue_generated / party.purchase_frequency if party.purchase_frequency > 0 else 0
    
    score = calculate_party_score(party, transactions)
    
    segment = 'Cold Leads'
    if score >= 80:
        segment = 'High Ranking Parties'
    elif score >= 50:
        segment = 'Mid Revenue Parties'
    elif party.purchase_frequency > 0 and party.purchase_frequency < 3:
        segment = 'Purchased < 3 Times'
    elif party.purchase_frequency == 0:
        segment = 'Lot Parties'

    return {
        "score": score,
        "clv": clv,
        "aov": aov,
        "segment": segment
    }
