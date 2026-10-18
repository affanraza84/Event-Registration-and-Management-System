// Curated high-resolution editorial photography for tech gatherings, hackathons, and conferences
export interface EventCoverInfo {
  url: string;
  alt: string;
  accent: string;
}

const COVERS: Record<string, EventCoverInfo[]> = {
  hackathon: [
    {
      url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      alt: "Hackathon participants collaborating around laptops in a modern tech workshop",
      accent: "#5146E5",
    },
    {
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
      alt: "Engineers strategizing on code architecture and digital whiteboard",
      accent: "#4338CA",
    },
    {
      url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
      alt: "Dynamic tech hackathon keynote and project demo space",
      accent: "#6366F1",
    },
  ],
  meetup: [
    {
      url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
      alt: "Community members networking and discussing ideas around tables",
      accent: "#059669",
    },
    {
      url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
      alt: "Audience listening to a speaker at an intimate community meetup",
      accent: "#0D9488",
    },
    {
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
      alt: "Tech conference hall with people exchanging ideas",
      accent: "#0284C7",
    },
  ],
  conference: [
    {
      url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
      alt: "Speaker presenting on stage to an engaged conference audience",
      accent: "#7C3AED",
    },
    {
      url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
      alt: "Auditorium filled with summit attendees under stage lights",
      accent: "#5146E5",
    },
    {
      url: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1200&q=80",
      alt: "Annual developer summit panel discussion with industry experts",
      accent: "#4338CA",
    },
  ],
  ai: [
    {
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      alt: "Abstract digital wave representing artificial intelligence innovation",
      accent: "#5146E5",
    },
    {
      url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
      alt: "Neural network data visualization at machine learning symposium",
      accent: "#6366F1",
    },
  ],
  campus: [
    {
      url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
      alt: "University campus students collaborating on creative tech initiatives",
      accent: "#D97706",
    },
    {
      url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      alt: "Student developers building open source software together",
      accent: "#B45309",
    },
  ],
};

const DEFAULT_COVERS: EventCoverInfo[] = [
  {
    url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    alt: "Colleagues in an inspiring workshop space collaborating",
    accent: "#5146E5",
  },
  {
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    alt: "Atmospheric evening gathering of innovators and creators",
    accent: "#4338CA",
  },
  {
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    alt: "Celebration of creators and community milestones",
    accent: "#6366F1",
  },
];

export function getEventCover(title: string, category?: string, id?: string): EventCoverInfo {
  const text = `${title} ${category || ""}`.toLowerCase();
  let pool = DEFAULT_COVERS;

  if (text.includes("hackathon") || text.includes("code") || text.includes("build") || text.includes("sprint")) {
    pool = COVERS.hackathon;
  } else if (text.includes("ai") || text.includes("machine learning") || text.includes("data") || text.includes("llm")) {
    pool = COVERS.ai;
  } else if (text.includes("conference") || text.includes("summit") || text.includes("forum") || text.includes("keynote")) {
    pool = COVERS.conference;
  } else if (text.includes("student") || text.includes("campus") || text.includes("college") || text.includes("university")) {
    pool = COVERS.campus;
  } else if (text.includes("meetup") || text.includes("networking") || text.includes("community") || text.includes("gathering")) {
    pool = COVERS.meetup;
  }

  // Deterministic pick based on string hash so reload does not flicker
  const seed = (id || title || "event").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return pool[seed % pool.length];
}
