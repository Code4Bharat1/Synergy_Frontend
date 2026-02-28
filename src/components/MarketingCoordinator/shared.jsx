// ─── Mock Data ────────────────────────────────────────────────────────────────
export const COORDINATOR = {
  name:   "Nadia Farouq",
  role:   "Marketing Coordinator",
  id:     "MKT-0007",
  avatar: "NF",
};

export const PROJECTS = [
  { id: "PRJ-2401", name: "AquaPark Dubai",    location: "Dubai, UAE",   status: "Active"   },
  { id: "PRJ-2389", name: "Blue Lagoon Resort", location: "Maldives",     status: "Active"   },
  { id: "PRJ-2376", name: "SunSplash Inc.",     location: "Florida, USA", status: "Closing"  },
  { id: "PRJ-2412", name: "Ocean World",        location: "Singapore",    status: "Active"   },
  { id: "PRJ-2398", name: "WaveCrest Park",     location: "Thailand",     status: "Planning" },
];

export const ITEMS_POOL = [
  "Waterslide Alpha",  "Lazy River Flume",   "Tube Slide G3",
  "Wave Pool Panel A", "Speed Slide Pro",    "Funnel Ride Classic",
  "Body Slide 360",    "Funnel Ride X2",     "Master Blaster",
  "Aqua Loop",         "Kiddie Pool Slide",  "Speed Slide Mini",
  "Wave Pool Panel B", "Speed Slide Classic","Waterslide Beta",
];

export const ENGINEERS = [
  { id: "ENG-0019", name: "Arjun Mehta",     site: "Dubai"     },
  { id: "ENG-0023", name: "Ravi Shankar",    site: "Maldives"  },
  { id: "ENG-0031", name: "Priya Nair",      site: "Florida"   },
  { id: "ENG-0044", name: "Ali Hassan",      site: "Singapore" },
  { id: "ENG-0051", name: "Meera Patel",     site: "Thailand"  },
];

export const PENDING_REPLICATIONS = [
  { id: "RPL-2024-18", project: "Ocean World",        items: 4, incharge: "Ali Hassan",    due: "Mar 2",  status: "Pending"     },
  { id: "RPL-2024-17", project: "WaveCrest Park",     items: 7, incharge: "Meera Patel",   due: "Feb 28", status: "In Review"   },
  { id: "RPL-2024-16", project: "Blue Lagoon Resort", items: 2, incharge: "Ravi Shankar",  due: "Feb 24", status: "Approved"    },
];

export const PENDING_DOCUMENTS = [
  { id: "DOC-081", type: "Design Handover",      project: "AquaPark Dubai",    due: "Today",   urgent: true  },
  { id: "DOC-080", type: "ERP Confirmation",     project: "Ocean World",       due: "Mar 3",   urgent: false },
  { id: "DOC-079", type: "Client Comm. Log",     project: "WaveCrest Park",    due: "Mar 5",   urgent: false },
  { id: "DOC-078", type: "Design Handover",      project: "SunSplash Inc.",    due: "Overdue", urgent: true  },
];