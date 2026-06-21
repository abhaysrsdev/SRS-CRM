from typing import List, Dict, Any
from app.models.party import Party
from app.models.transaction import Transaction

def calculate_dashboard_metrics(parties: List[Party], transactions: List[Transaction]) -> Dict[str, Any]:
    total_parties = len(parties)
    revenue_pipeline = sum(p.revenue_generated for p in parties)
    hot_parties = sum(1 for p in parties if p.party_score >= 80)
    cold_leads = sum(1 for p in parties if p.segment == 'Cold Leads')
    lost_parties = sum(1 for p in parties if p.segment == 'Lot Parties')

    return {
        "metrics": {
            "Total Parties": total_parties,
            "Revenue Pipeline": revenue_pipeline,
            "Hot Parties": hot_parties,
            "Cold Leads": cold_leads,
            "Lost Parties": lost_parties
        }
    }
