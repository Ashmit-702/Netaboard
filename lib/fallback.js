// Static fallback data — used whenever Supabase env vars aren't set yet,
// so the app looks and works correctly before you've run the seed script.
export const fallbackElection = {
  name: "Bihar Assembly Election 2026",
  optionA: { label: "NDA", probability: 72 },
  optionB: { label: "Mahagathbandhan", probability: 28 },
  history: [
    { d: "Jul 10", v: 60 },
    { d: "Jul 25", v: 67 },
    { d: "Aug 4", v: 72 },
  ],
};

export const fallbackParties = [
  { name: "BJP", abbreviation: "BJP", seats_current: 74 },
  { name: "RJD", abbreviation: "RJD", seats_current: 79 },
  { name: "JD(U)", abbreviation: "JD(U)", seats_current: 43 },
  { name: "Congress", abbreviation: "Congress", seats_current: 19 },
  { name: "LJP(RV)", abbreviation: "LJP(RV)", seats_current: 5 },
  { name: "HAM", abbreviation: "HAM", seats_current: 4 },
  { name: "VIP", abbreviation: "VIP", seats_current: 4 },
  { name: "Independents", abbreviation: "IND", seats_current: 15 },
];

export const fallbackPredictors = [
  { display_name: "Ashmit R.", accuracy_pct: 92 },
  { display_name: "Rahul K.", accuracy_pct: 90 },
  { display_name: "Ananya S.", accuracy_pct: 88 },
  { display_name: "Devansh P.", accuracy_pct: 85 },
  { display_name: "Meher I.", accuracy_pct: 83 },
];

export const fallbackPoliticians = [
  {
    slug: "narendra-modi", name: "Narendra Modi", role: "Prime Minister of India",
    party: { abbreviation: "BJP" },
    promises: [
      { text: "Ram Mandir construction in Ayodhya", status: "done" },
      { text: "Revocation of Article 370 in J&K", status: "done" },
      { text: "Uniform Civil Code nationwide", status: "partial" },
      { text: "Two crore jobs a year", status: "broken" },
    ],
  },
  {
    slug: "nitish-kumar", name: "Nitish Kumar", role: "Chief Minister, Bihar",
    party: { abbreviation: "JD(U)" },
    promises: [
      { text: "Statewide liquor prohibition", status: "done" },
      { text: "Bijli-Sadak-Pani infrastructure push", status: "partial" },
      { text: "Jeevika women self-help group expansion", status: "done" },
      { text: "Special Category Status for Bihar", status: "broken" },
    ],
  },
  {
    slug: "tejashwi-yadav", name: "Tejashwi Yadav", role: "Leader of Opposition, Bihar",
    party: { abbreviation: "RJD" },
    promises: [{ text: "10 lakh government jobs pledge", status: "partial" }],
  },
];

export const fallbackConstituencies = [
  { name: "Patna Sahib", state: "Bihar", current_rep: "Ravi Shankar Prasad", vote_share: 55.2, margin: 12.4, turnout: 58.6 },
  { name: "Raghopur", state: "Bihar", current_rep: "Tejashwi Yadav", vote_share: 51.8, margin: 6.2, turnout: 61.3 },
];

export const fallbackStocks = [
  { name: "Narendra Modi", price: 187.4, change_pct: 3.1 },
  { name: "Nitish Kumar", price: 92.1, change_pct: -1.4 },
  { name: "Tejashwi Yadav", price: 104.6, change_pct: 4.2 },
  { name: "Rahul Gandhi", price: 78.3, change_pct: -0.6 },
];

export const fallbackRisk = [
  { country: "India", war_risk: 15, economic_risk: 20, political_stability: 83 },
  { country: "Pakistan", war_risk: 34, economic_risk: 58, political_stability: 41 },
  { country: "China", war_risk: 22, economic_risk: 30, political_stability: 76 },
];
